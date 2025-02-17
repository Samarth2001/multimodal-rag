import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    DEEPSEEK_API_BASE = "https://api.deepseek.com/v1"
    EMBEDDING_MODEL = "deepseek-text-embedding"  # DeepSeek's embedding model
    CHAT_MODEL = "deepseek-chat"  # DeepSeek's chat model
