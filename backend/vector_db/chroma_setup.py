from langchain.vectorstores import Chroma
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.storage import InMemoryStore
from langchain_openai import OpenAIEmbeddings


class VectorStore:
    def __init__(self):
        self.vectorstore = Chroma(
            collection_name="multimodal_rag", embedding_function=OpenAIEmbeddings()
        )
        self.store = InMemoryStore()

        self.retriever = MultiVectorRetriever(
            vectorstore=self.vectorstore, docstore=self.store, id_key="doc_id"
        )

    def store_documents(self, texts: List[str], tables: List[str], images: List[str]):
        # Store text summaries
        text_ids = [str(uuid.uuid4()) for _ in texts]
        self.retriever.vectorstore.add_documents(
            [
                Document(page_content=t, metadata={"doc_id": id})
                for t, id in zip(texts, text_ids)
            ]
        )
        self.retriever.docstore.mset(list(zip(text_ids, texts)))

        # Store image summaries
        image_ids = [str(uuid.uuid4()) for _ in images]
        self.retriever.vectorstore.add_documents(
            [
                Document(page_content=i, metadata={"doc_id": id})
                for i, id in zip(images, image_ids)
            ]
        )
        self.retriever.docstore.mset(list(zip(image_ids, images)))
