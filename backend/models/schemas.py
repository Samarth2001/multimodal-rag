from pydantic import BaseModel
from typing import List, Union, Dict, Any

class DocumentChunk(BaseModel):
    content: Union[str, bytes]
    type: str  # "text", "image", "table"
    metadata: Dict[str, Any]
    page_number: int

class RAGResponse(BaseModel):
    answer: str
    sources: List[DocumentChunk]
    session_id: str

class UploadRequest(BaseModel):
    file_bytes: bytes
    filename: str
    session_id: str

class ChatRequest(BaseModel):
    question: str
    session_id: str
    history: List[Dict[str, str]] = []