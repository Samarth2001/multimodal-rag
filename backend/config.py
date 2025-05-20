import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # OpenAI settings (for chat, embeddings, etc.)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
    CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-3.5-turbo") # Changed to OpenAI model

    PDF_UPLOAD_DIR = os.getenv("PDF_UPLOAD_DIR", "./uploads")
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
    CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma")

    # Note: OPENAI_EMBEDDING_MODEL is now used directly by EMBEDDING_MODEL
    # Note: OPENAI_API_BASE is now the primary API base
