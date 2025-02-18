import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    # DeepSeek settings (for chat, etc.)
    DEEPSEEK_API_BASE = "https://api.deepseek.com/v1"  
    EMBEDDING_MODEL = "deepseek-text-embedding"
    CHAT_MODEL = "deepseek-chat"
    PDF_UPLOAD_DIR = os.getenv("PDF_UPLOAD_DIR", "./uploads")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
    CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma")
    
    # OpenAI embedding settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
