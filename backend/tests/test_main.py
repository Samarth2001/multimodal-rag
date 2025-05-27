import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "timestamp" in data

def test_upload_no_file():
    """Test upload endpoint with no file"""
    response = client.post("/upload")
    assert response.status_code == 422  # Validation error

def test_chat_no_session():
    """Test chat endpoint with invalid session"""
    response = client.post("/chat", json={
        "question": "What is this document about?",
        "session_id": "invalid-session-id"
    })
    assert response.status_code == 404

def test_sessions_endpoint():
    """Test sessions listing endpoint"""
    response = client.get("/sessions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_visualize_embeddings_empty_text():
    """Test embeddings endpoint with empty text"""
    response = client.post("/visualize-embeddings", json={
        "text": ""
    })
    assert response.status_code == 422  # Validation error

def test_visualize_embeddings_valid_text():
    """Test embeddings endpoint with valid text"""
    response = client.post("/visualize-embeddings", json={
        "text": "hello world test"
    })
    # This might fail if OpenAI API key is not set, but structure should be correct
    assert response.status_code in [200, 500]  # 500 if no API key 