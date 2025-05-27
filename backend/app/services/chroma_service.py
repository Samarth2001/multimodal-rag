import chromadb
from chromadb.utils import embedding_functions
# requests import removed as it's likely unused
# from chromadb.api.types import Documents, Embeddings import removed as it's likely unused

from config import Config # Assuming config.py is in backend/ root, adjust if not

class ChromaDB:
    def __init__(self):
        # Adjust path relative to the new location if Config.CHROMA_PATH was relative
        self.client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
        self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=Config.OPENAI_API_KEY,
            model_name=Config.EMBEDDING_MODEL,
            api_base=Config.OPENAI_API_BASE,
        )

    def get_collection(self, collection_name: str):
        return self.client.get_or_create_collection(
            name=collection_name, embedding_function=self.embedding_fn
        ) 