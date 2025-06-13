from fastapi import FastAPI, UploadFile, BackgroundTasks, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
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
from openai import OpenAI, APIError
from contextlib import asynccontextmanager

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
    lifespan=lifespan
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS with environment-based origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced response models
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="Question to ask about the document")
    session_id: str = Field(..., min_length=1, description="Session ID from document upload")

    @field_validator('question')
    @classmethod
    def validate_question(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Question cannot be empty')
        return v.strip()

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

# Session management
active_sessions: Dict[str, SessionInfo] = {}

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
    """Validate file extension"""
    if not any(filename.lower().endswith(ext) for ext in Config.ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(Config.ALLOWED_EXTENSIONS)}"
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
        metadatas = [{"filename": filename, "chunk_id": i, "session_id": session_id} for i in range(len(chunks))]
        
        collection.add(
            documents=chunks, 
            ids=chunk_ids,
            metadatas=metadatas
        )

        # Store session info
        active_sessions[session_id] = SessionInfo(
            session_id=session_id,
            filename=filename,
            created_at=time.time(),
            chunk_count=len(chunks),
            status="active"
        )

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

@app.post("/chat", response_model=ChatResponse, responses={
    400: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
@limiter.limit(f"{Config.RATE_LIMIT_REQUESTS}/minute")
async def chat_endpoint(request: Request, chat_request: ChatRequest):
    """Enhanced chat endpoint with better context retrieval and error handling"""
    start_time = time.time()
    
    try:
        logger.info(f"Chat request for session {chat_request.session_id}: {chat_request.question[:100]}")
        
        # Validate session
        chroma = ChromaDB()
        try:
            collection = chroma.get_collection(chat_request.session_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found. Please upload a document first."
            )
        
        # Get relevant context with improved retrieval
        results = collection.query(
            query_texts=[chat_request.question], 
            n_results=5,  # Get more results for better context
            include=["documents", "metadatas", "distances"]
        )
        
        if not results or not results.get("documents") or not results["documents"][0]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No relevant context found in the document"
            )
            
        # Build context with source attribution
        contexts = results["documents"][0]
        metadatas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []
        distances = results.get("distances", [[]])[0] if results.get("distances") else []
        
        # Filter and rank context by relevance
        relevant_contexts = []
        sources = []
        
        for i, (context, metadata, distance) in enumerate(zip(contexts, metadatas, distances)):
            if distance < 0.5:  # Only include highly relevant chunks
                chunk_info = f"[Chunk {metadata.get('chunk_id', i)} from {metadata.get('filename', 'document')}]"
                relevant_contexts.append(f"{chunk_info}\n{context}")
                sources.append(f"Chunk {metadata.get('chunk_id', i)}")
        
        if not relevant_contexts:
            relevant_contexts = contexts[:3]  # Fallback to top 3
            sources = [f"Chunk {i}" for i in range(len(relevant_contexts))]
        
        context = "\n\n".join(relevant_contexts)
        
        # Enhanced prompt with better instruction
        try:
            client = OpenAI(api_key=Config.OPENAI_API_KEY, base_url=Config.OPENAI_API_BASE)

            response = client.chat.completions.create(
                model=Config.CHAT_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant that answers questions based on provided document context. Always base your answers on the context provided. If the context doesn't contain enough information to answer the question, say so clearly. Cite specific parts of the context when possible."
                    },
                    {
                        "role": "user",
                        "content": f"Context from document:\n\n{context}\n\nQuestion: {chat_request.question}\n\nPlease provide a comprehensive answer based on the context above."
                    }
                ],
                temperature=0.3,
                max_tokens=1000,
            )
            
            processing_time = time.time() - start_time
            answer = response.choices[0].message.content
            
            logger.info(f"Chat response generated in {processing_time:.2f}s for session {chat_request.session_id}")
            
            return ChatResponse(
                answer=answer,
                sources=sources[:3],
                processing_time=processing_time,
                session_id=chat_request.session_id
            )
            
        except APIError as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"LLM API error: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )

@app.get("/sessions", response_model=List[SessionInfo])
@limiter.limit("30/minute")
async def list_sessions(request: Request):
    """Get list of active sessions"""
    return list(active_sessions.values())

@app.delete("/sessions/{session_id}")
@limiter.limit("20/minute")
async def delete_session(request: Request, session_id: str):
    """Delete a session and its data"""
    try:
        if session_id in active_sessions:
            chroma = ChromaDB()
            chroma.delete_collection(session_id)
            del active_sessions[session_id]
            logger.info(f"Deleted session {session_id}")
            return {"message": "Session deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting session: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Enhanced health check with dependency status"""
    try:
        # Check OpenAI API
        client = OpenAI(api_key=Config.OPENAI_API_KEY, base_url=Config.OPENAI_API_BASE)
        
        # Check ChromaDB
        chroma = ChromaDB()
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "1.0.0",
            "services": {
                "openai": "connected",
                "chromadb": "connected",
                "sessions": len(active_sessions)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
