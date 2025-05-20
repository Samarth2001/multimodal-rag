# test_embeddings.py
from chromadb.utils import embedding_functions
from config import Config

embedder = embedding_functions.OpenAIEmbeddingFunction(
    api_key=Config.OPENAI_API_KEY,
    model_name=Config.OPENAI_EMBEDDING_MODEL,
    api_base=Config.OPENAI_API_BASE,
)

embeddings = embedder(["Test document chunk"])
print(embeddings[0][:5])  # Should show vector numbers 