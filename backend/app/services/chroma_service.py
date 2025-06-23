import chromadb
from chromadb.utils import embedding_functions
import requests
import json
from typing import List

from config import Config

class GoogleEmbeddingFunction:
    """Custom embedding function for Google Embedding models via direct API"""
    
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        # Clean model name - remove 'models/' prefix if present
        self.model_name = model_name.replace('models/', '') if model_name.startswith('models/') else model_name
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:embedContent"
        
    def __call__(self, input: List[str]) -> List[List[float]]:
        """Generate embeddings using Google AI API"""
        try:
            embeddings = []
            for text in input:
                response = requests.post(
                    self.api_url,
                    headers={
                        "Content-Type": "application/json",
                    },
                    params={"key": self.api_key},
                    data=json.dumps({
                        "content": {
                            "parts": [{"text": text}]
                        },
                        "taskType": "RETRIEVAL_DOCUMENT"
                    })
                )
                
                if response.status_code == 200:
                    result = response.json()
                    embeddings.append(result['embedding']['values'])
                else:
                    raise Exception(f"API request failed: {response.status_code} - {response.text}")
                    
            return embeddings
        except Exception as e:
            raise Exception(f"Error generating embeddings with Google AI: {str(e)}")

class ChromaDB:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
        self.embedding_fn = GoogleEmbeddingFunction(
            api_key=Config.GOOGLE_API_KEY,
            model_name=Config.EMBEDDING_MODEL
        )

    def get_collection(self, collection_name: str):
        return self.client.get_or_create_collection(
            name=collection_name, 
            embedding_function=self.embedding_fn
        )
    
    def delete_collection(self, collection_name: str):
        """Delete a collection by name"""
        try:
            self.client.delete_collection(collection_name)
        except Exception as e:
            raise Exception(f"Error deleting collection {collection_name}: {str(e)}") 