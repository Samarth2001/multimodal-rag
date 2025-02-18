import chromadb
from chromadb.utils import embedding_functions
import requests
from chromadb.api.types import Documents, Embeddings

from config import Config

class DeepSeekEmbeddingFunction:
    def __init__(self):
        self.api_key = Config.DEEPSEEK_API_KEY
        self.api_url = f"{Config.DEEPSEEK_API_BASE}/embeddings"
        
    def __call__(self, input: Documents) -> Embeddings:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            self.api_url,
            headers=headers,
            json={
                "input": input,
                "model": Config.EMBEDDING_MODEL
            }
        )
        response.raise_for_status()
        return [item["embedding"] for item in response.json()["data"]]

class ChromaDB:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
        self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=Config.OPENAI_API_KEY,
            model_name=Config.OPENAI_EMBEDDING_MODEL,
            api_base=Config.OPENAI_API_BASE,
        )

    def get_collection(self, collection_name: str):
        return self.client.get_or_create_collection(
            name=collection_name, embedding_function=self.embedding_fn
        )