import os
import logging
from dotenv import load_dotenv
from typing import List

load_dotenv()

class Config:
    # OpenAI settings (for chat, embeddings, etc.)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
    CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-3.5-turbo")

    # File storage
    PDF_UPLOAD_DIR = os.getenv("PDF_UPLOAD_DIR", "./uploads")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
    CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma")

    # Server configuration
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Rate limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_PERIOD = int(os.getenv("RATE_LIMIT_PERIOD", "60"))

    # File upload limits
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "50"))  # MB
    ALLOWED_EXTENSIONS = [".pdf"]

    @classmethod
    def validate_config(cls):
        """Validate required configuration"""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required")
        
        # Create directories if they don't exist
        os.makedirs(cls.PDF_UPLOAD_DIR, exist_ok=True)
        os.makedirs(cls.CHROMA_PATH, exist_ok=True)

    @classmethod
    def setup_logging(cls):
        """Setup structured logging"""
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
