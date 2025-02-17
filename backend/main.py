from fastapi import FastAPI, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from processing.pdf_processor import PDFProcessor
from vector_db.chroma_setup import ChromaDB
import uuid
from fastapi.middleware.cors import CORSMiddleware  # Add this import

import os
from config import Config
from openai import OpenAI


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    session_id: str


class UploadResponse(BaseModel):
    session_id: str
    status: str


@app.post("/upload", response_model=UploadResponse)
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile):
    session_id = str(uuid.uuid4())
    file_bytes = await file.read()

    background_tasks.add_task(
        process_upload_background, file_bytes, session_id, file.filename
    )

    return {"session_id": session_id, "status": "processing"}


def process_upload_background(file_bytes: bytes, session_id: str, filename: str):
    processor = PDFProcessor()
    chunks = processor.process_pdf(file_bytes, filename)

    chroma = ChromaDB()
    collection = chroma.get_collection(session_id)

    collection.add(documents=chunks, ids=[str(uuid.uuid4()) for _ in chunks])


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    chroma = ChromaDB()
    collection = chroma.get_collection(request.session_id)

    results = collection.query(query_texts=[request.question], n_results=3)

    context = "\n\n".join(results["documents"][0])

    # Use DeepSeek API
    client = OpenAI(api_key=Config.DEEPSEEK_API_KEY, base_url=Config.DEEPSEEK_API_BASE)

    response = client.chat.completions.create(
        model=Config.CHAT_MODEL,
        messages=[
            {
                "role": "user",
                "content": f"Answer this question based on the context:\n\n{context}\n\nQuestion: {request.question}",
            }
        ],
        temperature=0.3,
    )

    return {"answer": response.choices[0].message.content}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
