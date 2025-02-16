import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    OPENAI_API_BASE = "https://api.deepseek.com/v1"
    
    # Document processing
    PDF_UPLOAD_DIR = "uploads/pdf"
    IMAGE_UPLOAD_DIR = "uploads/images"
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    
    # Vector DB
    VECTOR_STORE_PATH = "vector_store"
    TEXT_EMBEDDING_MODEL = "deepseek-text-embedding"
    IMAGE_EMBEDDING_MODEL = "openai/clip-vit-base-patch32"
    
    # RAG
    MAX_CONTEXT_LENGTH = 4096
    TEMPERATURE = 0.3