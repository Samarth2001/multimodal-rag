from fastapi import FastAPI, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.processing.document_processor import DocumentProcessor
from backend.processing.chunking import ChunkProcessor
from backend.vector_db.chroma_setup import VectorStore
from backend.models.schemas import UploadRequest, ChatRequest, RAGResponse
from config import Config
import uuid
import openai

# First create the FastAPI app instance
app = FastAPI()

# Then add the CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize other components
document_processor = DocumentProcessor()
vector_store = VectorStore()

# Configure DeepSeek
openai.api_key = Config.DEEPSEEK_API_KEY
openai.api_base = Config.OPENAI_API_BASE

@app.post("/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile):
    file_bytes = await file.read()
    
    # Process document
    processor = DocumentProcessor()
    texts, tables, images = processor.process_pdf(file_bytes)
    
    # Generate summaries
    summarizer = Summarizer()
    text_summaries = summarizer.summarize_text(texts)
    image_summaries = summarizer.summarize_images(images)
    
    # Store in vector DB
    vector_store = VectorStore()
    vector_store.store_documents(text_summaries, tables, image_summaries)
    
    return {"status": "processed", "texts": len(texts), "images": len(images)}

def process_upload_background(file_bytes: bytes, session_id: str):
    # Process document
    elements, image_paths = document_processor.process_pdf(file_bytes, session_id)
    chunks = ChunkProcessor.create_chunks(elements, image_paths)
    
    # Create vector collection
    collection = vector_store.create_collection(session_id)
    
    # Add text chunks to vector DB (images handled in Phase 2)
    text_chunks = [c for c in chunks if c.type == "text"]
    collection.add(
        documents=[c.content for c in text_chunks],
        ids=[str(uuid.uuid4()) for _ in text_chunks],
        metadatas=[c.metadata for c in text_chunks]
    )

from langchain_core.runnables import RunnableLambda

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    vector_store = VectorStore()
    
    # Retrieve relevant documents
    docs = vector_store.retriever.get_relevant_documents(request.question)
    
    # Build multimodal prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Answer using text and images:"),
        ("user", "{question}\n\nContext:\n{context}")
    ])
    
    chain = (
        {"context": RunnableLambda(format_docs), "question": RunnablePassthrough()}
        | prompt
        | ChatOpenAI(model="gpt-4o")
        | StrOutputParser()
    )
    
    response = chain.invoke({
        "question": request.question,
        "context": docs
    })
    
    return {"answer": response}

@app.post("/session/{session_id}")
async def create_session(session_id: str):
    return {"session_id": session_id}