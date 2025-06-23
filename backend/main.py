from fastapi import FastAPI, UploadFile, BackgroundTasks, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field, field_validator
from processing.pdf_processor import PDFProcessor
from app.services.chroma_service import ChromaDB
import uuid
import logging
import asyncio
from typing import List, Dict, Any, Optional
import os
import time
import tempfile
from config import Config
import requests
from contextlib import asynccontextmanager
import json
import hashlib
import re
from datetime import datetime, timedelta
import threading
import gc

# Setup configuration and logging
Config.validate_config()
Config.setup_logging()
logger = logging.getLogger(__name__)

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting Document AI Assistant API")
    Config.validate_config()
    logger.info("Configuration validated successfully")
    yield
    # Shutdown logic (if any)
    logger.info("Shutting down Document AI Assistant API")

app = FastAPI(
    title="Document AI Assistant API",
    description="Backend API for RAG-based document analysis",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if Config.LOG_LEVEL == "DEBUG" else None,  # Hide docs in production
    redoc_url="/redoc" if Config.LOG_LEVEL == "DEBUG" else None  # Hide redoc in production
)

# Add security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*.localhost"])

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS with strict origins (not wildcard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=False,  # More secure - don't allow credentials
    allow_methods=["GET", "POST", "DELETE"],  # Only allow necessary methods
    allow_headers=["Content-Type", "Authorization"],  # Only allow necessary headers
)

# Enhanced response models
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="Question to ask about the document")
    session_id: str = Field(..., min_length=1, max_length=100, description="Session ID from document upload")

    @field_validator('question')
    @classmethod
    def validate_question(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Question cannot be empty')
        # Sanitize question to prevent injection attacks
        sanitized = re.sub(r'[<>"\']', '', v.strip())
        if len(sanitized) < 1:
            raise ValueError('Question contains only invalid characters')
        return sanitized[:1000]  # Truncate if too long
    
    @field_validator('session_id')
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        # Validate UUID format to prevent injection
        if not re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', v):
            raise ValueError('Invalid session ID format')
        return v

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    processing_time: float
    session_id: str

class UploadResponse(BaseModel):
    session_id: str
    status: str
    filename: str
    chunk_count: int
    processing_time: float

class SessionInfo(BaseModel):
    session_id: str
    filename: str
    created_at: float
    chunk_count: int
    status: str

# Session management with thread-safe operations and automatic cleanup
active_sessions: Dict[str, SessionInfo] = {}
session_lock = threading.Lock()
MAX_SESSIONS = 100  # Prevent memory exhaustion

def cleanup_old_sessions():
    """Clean up sessions older than 24 hours"""
    cutoff_time = time.time() - (24 * 60 * 60)  # 24 hours ago
    with session_lock:
        sessions_to_remove = [
            session_id for session_id, session_info in active_sessions.items()
            if session_info.created_at < cutoff_time
        ]
        for session_id in sessions_to_remove:
            try:
                chroma = ChromaDB()
                chroma.delete_collection(session_id)
                del active_sessions[session_id]
                logger.info(f"Cleaned up old session: {session_id}")
            except Exception as e:
                logger.warning(f"Failed to cleanup session {session_id}: {e}")
    
    # Force garbage collection
    gc.collect()

def add_session(session_info: SessionInfo):
    """Add session with automatic cleanup if needed"""
    with session_lock:
        # If we're at max capacity, clean up old sessions
        if len(active_sessions) >= MAX_SESSIONS:
            cleanup_old_sessions()
        
        # If still at capacity, remove oldest session
        if len(active_sessions) >= MAX_SESSIONS:
            oldest_session = min(active_sessions.items(), key=lambda x: x[1].created_at)
            try:
                chroma = ChromaDB()
                chroma.delete_collection(oldest_session[0])
                del active_sessions[oldest_session[0]]
                logger.info(f"Removed oldest session: {oldest_session[0]}")
            except Exception as e:
                logger.warning(f"Failed to remove oldest session: {e}")
        
        active_sessions[session_info.session_id] = session_info

# Utility functions
def validate_file_size(file_bytes: bytes) -> None:
    """Validate file size"""
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > Config.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({size_mb:.1f}MB) exceeds maximum allowed size ({Config.MAX_FILE_SIZE}MB)"
        )

def validate_file_type(filename: str) -> None:
    """Validate file extension and name"""
    # Sanitize filename to prevent path traversal
    clean_filename = os.path.basename(filename)
    if not clean_filename or clean_filename != filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    # Check for dangerous characters
    if any(char in filename for char in ['<', '>', ':', '"', '|', '?', '*', '\0']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename contains invalid characters"
        )
    
    # Validate extension
    if not any(filename.lower().endswith(ext) for ext in Config.ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(Config.ALLOWED_EXTENSIONS)}"
        )
    
    # Prevent excessively long filenames
    if len(filename) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename too long"
        )

async def process_upload(file_bytes: bytes, filename: str) -> tuple[str, int]:
    """Process document upload with enhanced error handling"""
    start_time = time.time()
    session_id = str(uuid.uuid4())
    
    try:
        logger.info(f"Processing upload for file: {filename}, session: {session_id}")
        
        # Process PDF
        processor = PDFProcessor()
        chunks = processor.process_pdf(file_bytes, filename)

        if not chunks:
            raise ValueError("Failed to extract text from document")

        logger.info(f"Extracted {len(chunks)} chunks from {filename}")

        # Store in vector database
        chroma = ChromaDB()
        collection = chroma.get_collection(session_id)
        
        # Add chunks with metadata
        chunk_ids = [f"{session_id}_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "filename": filename, 
                "chunk_id": i, 
                "session_id": session_id,
                "page": i // 3 + 1,  # Estimate page number (3 chunks per page average)
                "document_type": "pdf"
            } 
            for i in range(len(chunks))
        ]
        
        collection.add(
            documents=chunks, 
            ids=chunk_ids,
            metadatas=metadatas
        )

        # Store session info using thread-safe method
        session_info = SessionInfo(
            session_id=session_id,
            filename=filename,
            created_at=time.time(),
            chunk_count=len(chunks),
            status="active"
        )
        add_session(session_info)

        processing_time = time.time() - start_time
        logger.info(f"Successfully processed {filename} in {processing_time:.2f}s")
        
        return session_id, len(chunks)
        
    except Exception as e:
        logger.error(f"Upload processing error for {filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )

@app.post("/upload", response_model=UploadResponse, responses={
    400: {"model": ErrorResponse},
    413: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
@limiter.limit(f"{Config.RATE_LIMIT_REQUESTS}/minute")
async def upload_file(request: Request, file: UploadFile):
    """Upload and process PDF document with enhanced validation"""
    start_time = time.time()
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    validate_file_type(file.filename)
    
    try:
        file_bytes = await file.read()
        
        # Validate file size and content
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        validate_file_size(file_bytes)
        
        session_id, chunk_count = await process_upload(file_bytes, file.filename)
        processing_time = time.time() - start_time
        
        return UploadResponse(
            session_id=session_id,
            status="processed",
            filename=file.filename,
            chunk_count=chunk_count,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload endpoint error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process upload: {str(e)}"
        )

async def stream_chat_responses(chat_request: ChatRequest):
    """Generator for streaming chat responses using Server-Sent Events."""
    start_time = time.time()
    
    try:
        logger.info(f"Streaming chat request for session {chat_request.session_id}: {chat_request.question[:100]}")
        
        # 1. Enhanced multi-strategy retrieval
        chroma = ChromaDB()
        try:
            collection = chroma.get_collection(chat_request.session_id)
        except Exception:
            # Yield an error event for the client
            error_message = json.dumps({"error": "Document session not found. Please upload a document first before asking questions.", "status_code": 404})
            yield f"event: error\ndata: {error_message}\n\n"
            return

        # Strategy 1: Direct semantic search with higher recall
        primary_results = collection.query(
            query_texts=[chat_request.question], 
            n_results=Config.RETRIEVAL_TOP_K,
            include=["documents", "metadatas", "distances"]
        )
        
        # Strategy 2: Keyword-based search for specific terms
        question_words = chat_request.question.lower().split()
        important_words = [word for word in question_words if len(word) > 3 and word not in 
                         ['what', 'when', 'where', 'which', 'about', 'does', 'have', 'this', 'that', 'with', 'from', 'they', 'them', 'were', 'been', 'said', 'each', 'then', 'their']]
        
        # Combine results from multiple strategies
        all_contexts = []
        all_metadatas = []
        all_distances = []
        seen_contexts = set()
        
        # Add primary results
        if primary_results and primary_results.get("documents") and primary_results["documents"][0]:
            for ctx, meta, dist in zip(
                primary_results["documents"][0],
                primary_results.get("metadatas", [[]])[0],
                primary_results.get("distances", [[]])[0]
            ):
                if ctx not in seen_contexts:
                    all_contexts.append(ctx)
                    all_metadatas.append(meta)
                    all_distances.append(dist)
                    seen_contexts.add(ctx)
        
        # Add keyword-based results if we have important words
        if important_words:
            keyword_query = " ".join(important_words)
            keyword_results = collection.query(
                query_texts=[keyword_query], 
                n_results=Config.RETRIEVAL_TOP_K // 2,
                include=["documents", "metadatas", "distances"]
            )
            
            if keyword_results and keyword_results.get("documents") and keyword_results["documents"][0]:
                for ctx, meta, dist in zip(
                    keyword_results["documents"][0],
                    keyword_results.get("metadatas", [[]])[0],
                    keyword_results.get("distances", [[]])[0]
                ):
                    if ctx not in seen_contexts and len(all_contexts) < Config.RETRIEVAL_TOP_K:
                        all_contexts.append(ctx)
                        all_metadatas.append(meta)
                        all_distances.append(dist)
                        seen_contexts.add(ctx)

        if not all_contexts:
            error_message = json.dumps({"error": "I couldn't find relevant information in the document to answer your question. Please try rephrasing your question or asking about different aspects of the document.", "status_code": 404})
            yield f"event: error\ndata: {error_message}\n\n"
            return
        
        # Enhanced relevance filtering with more lenient threshold
        relevant_contexts, sources = [], []
        for i, (context, metadata, distance) in enumerate(zip(all_contexts, all_metadatas, all_distances)):
            # Use the new configurable distance threshold
            if distance < Config.DISTANCE_THRESHOLD:
                # Filter out very short chunks unless they're specifically relevant
                if len(context.strip()) >= Config.MIN_CHUNK_LENGTH or any(word in context.lower() for word in important_words):
                    relevant_contexts.append(context.strip())
                    # Use page/section info if available, otherwise use position
                    source_info = f"Page {metadata.get('page', i+1)}" if metadata.get('page') else f"Section {i+1}"
                    sources.append(source_info)
        
        # Fallback: if strict filtering yields too few results, include more chunks
        if len(relevant_contexts) < 2:
            relevant_contexts = [ctx.strip() for ctx in all_contexts[:5] if len(ctx.strip()) >= Config.MIN_CHUNK_LENGTH]
            sources = [f"Section {i+1}" for i in range(len(relevant_contexts))]
        
        # Final fallback: include any content if we still have nothing
        if not relevant_contexts:
            relevant_contexts = [ctx.strip() for ctx in all_contexts[:3]]
            sources = [f"Section {i+1}" for i in range(len(relevant_contexts))]

        # Create enhanced context with better structure
        context_parts = []
        for i, ctx in enumerate(relevant_contexts[:8]):  # Limit to 8 most relevant chunks for token efficiency
            # Add source information to help LLM understand context
            source_info = sources[i] if i < len(sources) else f"Section {i+1}"
            context_parts.append(f"[{source_info}]\n{ctx.strip()}")
        
        context_str = "\n\n".join(context_parts)
        
        # Log context quality for debugging
        logger.info(f"Retrieved {len(relevant_contexts)} relevant chunks for question: {chat_request.question[:50]}...")

        # Yield sources found - limit to 5 most relevant
        clean_sources = []
        for source in sources[:5]:
            if source not in clean_sources:  # Avoid duplicates
                clean_sources.append(source)
        
        sources_message = json.dumps(clean_sources)
        yield f"event: sources\ndata: {sources_message}\n\n"

        # 2. Call OpenRouter API with enhanced prompt
        system_prompt = Config.get_system_prompt()
        
        user_prompt = f"""Based on the following document content, please answer the user's question comprehensively and accurately.

Document Content:
{context_str}

User Question: {chat_request.question}

Instructions:
- Provide a thorough answer based on the document content
- If the answer requires information from multiple sections, synthesize them coherently  
- If specific details are mentioned in the document, include them in your response
- If the document doesn't contain enough information to fully answer the question, state what information is available and what might be missing
- Cite relevant sections when appropriate (e.g., "According to Page X..." or "As mentioned in Section Y...")

Answer:"""

        # 3. Prepare OpenRouter request
        headers = {
            "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": Config.SITE_URL,
            "X-Title": Config.SITE_NAME,
        }
        
        payload = {
            "model": Config.CHAT_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,  # Lower temperature for more consistent, factual responses
            "max_tokens": 1500,  # Increased for more comprehensive answers
            "stream": True,
            "top_p": 0.9,  # Add top_p for better response quality
        }

        # 4. Stream response from OpenRouter with timeout and error handling
        try:
            response = requests.post(
                f"{Config.OPENROUTER_API_BASE}chat/completions",
                headers=headers,
                json=payload,
                stream=True,
                timeout=(10, 60)  # (connect timeout, read timeout)
            )
        except requests.exceptions.Timeout:
            error_message = json.dumps({"error": "Request timeout - please try again", "status_code": 408})
            yield f"event: error\ndata: {error_message}\n\n"
            return
        except requests.exceptions.RequestException as e:
            error_message = json.dumps({"error": "Network error - please try again", "status_code": 502})
            yield f"event: error\ndata: {error_message}\n\n"
            return
        
        if response.status_code != 200:
            error_message = json.dumps({"error": f"OpenRouter API error: {response.status_code} - {response.text}", "status_code": response.status_code})
            yield f"event: error\ndata: {error_message}\n\n"
            return

        # 5. Parse and yield streaming chunks
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                data = line[6:]  # Remove "data: " prefix
                if data == "[DONE]":
                    break
                try:
                    chunk_data = json.loads(data)
                    if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                        delta = chunk_data["choices"][0].get("delta", {})
                        if "content" in delta and delta["content"]:
                            token_message = json.dumps({"token": delta["content"]})
                            yield f"event: token\ndata: {token_message}\n\n"
                            await asyncio.sleep(0.01)  # Small delay for smoother streaming
                except json.JSONDecodeError:
                    continue

    except Exception as e:
        logger.error(f"OpenRouter API error during stream: {str(e)}")
        error_message = json.dumps({"error": f"LLM API error: {e}", "status_code": 500})
        yield f"event: error\ndata: {error_message}\n\n"
    except Exception as e:
        logger.error(f"Chat stream error: {str(e)}")
        error_message = json.dumps({"error": f"Error processing chat: {e}", "status_code": 500})
        yield f"event: error\ndata: {error_message}\n\n"
    finally:
        # 4. Signal end of stream
        processing_time = time.time() - start_time
        end_message = json.dumps({"processing_time": processing_time})
        yield f"event: end\ndata: {end_message}\n\n"
        logger.info(f"Chat stream finished in {processing_time:.2f}s for session {chat_request.session_id}")

@app.post("/chat", responses={
    400: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
@limiter.limit(f"{Config.RATE_LIMIT_REQUESTS}/minute")
async def chat_endpoint(request: Request, chat_request: ChatRequest):
    """
    Handles chat requests.
    This endpoint now initiates a Server-Sent Events (SSE) stream.
    """
    return StreamingResponse(stream_chat_responses(chat_request), media_type="text/event-stream")

@app.get("/sessions", response_model=List[SessionInfo])
@limiter.limit("30/minute")
async def list_sessions(request: Request):
    """Get list of active sessions with privacy protection"""
    with session_lock:
        # Return sessions without exposing sensitive filename info
        safe_sessions = []
        for session in active_sessions.values():
            safe_session = SessionInfo(
                session_id=session.session_id,
                filename=hashlib.md5(session.filename.encode()).hexdigest()[:8] + "_" + session.filename.split('.')[-1],  # Hash filename for privacy
                created_at=session.created_at,
                chunk_count=session.chunk_count,
                status=session.status
            )
            safe_sessions.append(safe_session)
        return safe_sessions

@app.delete("/sessions/{session_id}")
@limiter.limit("20/minute")
async def delete_session(request: Request, session_id: str):
    """Delete a session and its data with validation"""
    try:
        # Validate session_id format to prevent injection
        if not re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', session_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID format"
            )
        
        with session_lock:
            if session_id in active_sessions:
                try:
                    chroma = ChromaDB()
                    chroma.delete_collection(session_id)
                    del active_sessions[session_id]
                    logger.info(f"Deleted session {session_id[:8]}...")  # Only log partial ID for privacy
                    return {"message": "Session deleted successfully"}
                except Exception as e:
                    logger.error(f"Error deleting session data: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Error deleting session data"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found"
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in delete_session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@app.get("/health")
@limiter.limit("10/minute")  # Rate limit health checks
async def health_check(request: Request):
    """Enhanced health check with security considerations"""
    try:
        # Check OpenRouter API (without exposing keys)
        openrouter_status = "unknown"
        try:
            headers = {
                "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": Config.SITE_URL,
                "X-Title": Config.SITE_NAME,
            }
            
            test_response = requests.get(
                f"{Config.OPENROUTER_API_BASE}models",
                headers=headers,
                timeout=3  # Shorter timeout
            )
            openrouter_status = "connected" if test_response.status_code == 200 else "error"
        except Exception:
            openrouter_status = "error"
        
        # Check ChromaDB
        chromadb_status = "unknown"
        try:
            chroma = ChromaDB()
            chromadb_status = "connected"
        except Exception:
            chromadb_status = "error"
        
        # Clean up old sessions during health check
        if len(active_sessions) > 50:  # If many sessions, cleanup
            cleanup_old_sessions()
        
        return {
            "status": "healthy" if all(s in ["connected", "unknown"] for s in [openrouter_status, chromadb_status]) else "degraded",
            "timestamp": time.time(),
            "version": "1.0.0",
            "services": {
                "openrouter": openrouter_status,
                "chromadb": chromadb_status,
                "sessions": len(active_sessions),
                "memory_usage": "normal" if len(active_sessions) < MAX_SESSIONS * 0.8 else "high"
            }
        }
    except Exception as e:
        # Don't expose internal error details
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": time.time(),
                "error": "Internal health check error"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
