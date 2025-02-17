import chromadb
from chromadb.utils import embedding_functions
from config import Config
from chromadb.utils import embedding_functions


class ChromaDB:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
        self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=Config.DEEPSEEK_API_KEY,
            model_name=Config.EMBEDDING_MODEL,
            api_base=Config.DEEPSEEK_API_BASE,
        )

    def get_collection(self, collection_name: str):
        return self.client.get_or_create_collection(
            name=collection_name, embedding_function=self.embedding_fn
        )
