import os
import logging
import re
from dotenv import load_dotenv
from typing import List

# Load .env file from the current directory (backend)
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

class Config:
    # OpenRouter Configuration
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_API_BASE = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1/")
    SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
    SITE_NAME = os.getenv("SITE_NAME", "Multimodal RAG Assistant")
    
    # Model Configuration (OpenRouter format)
    CHAT_MODEL = os.getenv("CHAT_MODEL", "google/gemini-2.5-flash-lite-preview-06-17")
    
    # For embeddings, we'll use Google's direct API (OpenRouter doesn't support embeddings)
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "embedding-001")

    # File storage
    PDF_UPLOAD_DIR = os.getenv("PDF_UPLOAD_DIR", "./uploads")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "2000"))  # Increased from 1000 for better context
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "400"))  # Increased from 100 for better continuity
    CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma")
    
    # Enhanced retrieval parameters
    RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "12"))  # Retrieve more candidates
    DISTANCE_THRESHOLD = float(os.getenv("DISTANCE_THRESHOLD", "0.75"))  # More lenient threshold
    MIN_CHUNK_LENGTH = int(os.getenv("MIN_CHUNK_LENGTH", "100"))  # Filter out very short chunks

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
        if not cls.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is required")
        if not cls.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is required for embeddings")
        
        # Create directories if they don't exist
        os.makedirs(cls.PDF_UPLOAD_DIR, exist_ok=True)
        os.makedirs(cls.CHROMA_PATH, exist_ok=True)

    @classmethod
    def setup_logging(cls):
        """Setup structured logging with security considerations"""
        # Configure logging to not expose sensitive information
        class SensitiveDataFilter(logging.Filter):
            def filter(self, record):
                # Filter out API keys and other sensitive information
                if hasattr(record, 'msg'):
                    record.msg = str(record.msg)
                    # Remove API keys from log messages
                    record.msg = re.sub(r'sk-[a-zA-Z0-9-]+', '[API_KEY_REDACTED]', record.msg)
                    record.msg = re.sub(r'AIza[a-zA-Z0-9_-]+', '[GOOGLE_API_KEY_REDACTED]', record.msg)
                return True
        
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Add the filter to all handlers
        for handler in logging.root.handlers:
            handler.addFilter(SensitiveDataFilter())
    
    @classmethod
    def get_system_prompt(cls) -> str:
        """Get system prompt securely (not exposed in logs)"""
        return """You are a professional AI assistant that helps users understand and analyze documents comprehensively.

Core Principles:
- Provide thorough, accurate answers based on the document content
- Synthesize information from multiple parts of the document when relevant
- Be specific and include important details when they exist in the document
- Maintain natural, conversational language

Guidelines:
- Carefully review all provided document content before responding
- If information appears in multiple sections, integrate it coherently
- Include specific details, numbers, dates, names, or other precise information when present
- Reference document sections naturally (e.g., "According to the document...", "The text mentions...", "As stated in the material...")
- If the question requires information not fully covered in the provided content, clearly state what information is available and what might be missing
- Prioritize accuracy and completeness over brevity
- Never mention technical terms like "chunks", "embeddings", or "retrieval"
- Always maintain a helpful, professional tone

Remember: Your goal is to provide the most comprehensive and accurate answer possible based on the document content provided."""
