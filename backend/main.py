from fastapi import FastAPI, UploadFile, BackgroundTasks, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from processing.pdf_processor import PDFProcessor
from vector_db.chroma_setup import ChromaDB
import uuid
from fastapi.middleware.cors import CORSMiddleware
import nltk
from typing import List, Dict, Any, Optional
import os
import time
from config import Config
from openai import OpenAI, APIError

# Download NLTK data
try:
    nltk.download('punkt_tab')
    nltk.download('averaged_perceptron_tagger_eng')
except Exception as e:
    print(f"NLTK download error: {e}")

app = FastAPI(
    title="Document AI Assistant API",
    description="Backend API for RAG-based document analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class ErrorResponse(BaseModel):
    detail: str

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question to ask about the document")
    session_id: str = Field(..., min_length=1, description="Session ID from document upload")

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    processing_time: float

class UploadResponse(BaseModel):
    session_id: str
    status: str
    filename: str

# Helper functions for error handling
async def process_upload(file_bytes: bytes, filename: str) -> str:
    try:
        session_id = str(uuid.uuid4())
        processor = PDFProcessor()
        chunks = processor.process_pdf(file_bytes, filename)

        if not chunks:
            raise ValueError("Failed to extract text from document")

        chroma = ChromaDB()
        collection = chroma.get_collection(session_id)
        collection.add(documents=chunks, ids=[str(uuid.uuid4()) for _ in chunks])
        return session_id
    except Exception as e:
        print(f"Upload processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )

@app.post("/upload", response_model=UploadResponse, responses={
    400: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
async def upload_file(file: UploadFile):
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    try:
        file_bytes = await file.read()
        
        # Check if file is empty
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
            
        session_id = await process_upload(file_bytes, file.filename)
        return {
            "session_id": session_id, 
            "status": "processed", 
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process upload: {str(e)}"
        )

@app.post("/chat", response_model=ChatResponse, responses={
    400: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
async def chat_endpoint(request: ChatRequest):
    start_time = time.time()
    
    try:
        # Validate session
        chroma = ChromaDB()
        try:
            collection = chroma.get_collection(request.session_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found. Please upload a document first."
            )
        
        # Get relevant context
        results = collection.query(query_texts=[request.question], n_results=3)
        
        if not results or not results.get("documents") or not results["documents"][0]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No relevant context found in the document"
            )
            
        context = "\n\n".join(results["documents"][0])
        sources = results.get("documents", [[]])[0]
        
        # Use DeepSeek API
        try:
            client = OpenAI(api_key=Config.DEEPSEEK_API_KEY, base_url=Config.DEEPSEEK_API_BASE)

            response = client.chat.completions.create(
                model=Config.CHAT_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": f"Answer this question based on the context:\n\n{context}\n\nQuestion: {request.question}",
                    }
                ],
                temperature=0.3,
            )
            
            processing_time = time.time() - start_time
            return {
                "answer": response.choices[0].message.content,
                "sources": sources[:3] if sources else None,
                "processing_time": processing_time
            }
        except APIError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"LLM API error: {str(e)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
