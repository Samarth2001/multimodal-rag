# 🤖 Multimodal RAG Document Assistant

A powerful, production-ready document analysis system that combines **Retrieval Augmented Generation (RAG)** with a modern web interface. Upload PDF documents and chat with them using advanced AI capabilities.

## ✨ Features

### 🔥 **Enhanced RAG Pipeline**
- **Advanced PDF Processing**: Better text extraction with element-type handling (text, tables, images)
- **Intelligent Chunking**: Optimized text segmentation with overlap for better context preservation
- **Semantic Search**: ChromaDB vector store with Google AI embeddings for precise document retrieval
- **Context-Aware Responses**: Improved prompt engineering with source citations

### 🚀 **Production-Ready Backend**
- **FastAPI** with comprehensive error handling and validation
- **Rate Limiting** to prevent abuse
- **Session Management** with persistent storage
- **Health Monitoring** with detailed service status
- **Structured Logging** for better debugging
- **File Upload Validation** with size and type checking
- **CORS Configuration** for secure cross-origin requests

### 🎨 **Modern Frontend**
- **Next.js 15** with App Router and TypeScript
- **ShadCN UI Components** for consistent, accessible design
- **Complete Black Theme** with subtle accents
- **Mobile-Responsive** design with drawer navigation
- **Real-time Progress** indicators for uploads
- **Toast Notifications** for better UX
- **Keyboard Shortcuts** (Ctrl+Enter to send, Ctrl+L to clear)

### 🛠️ **Developer Experience**
- **Docker Support** for easy deployment
- **Environment Configuration** with validation
- **API Documentation** with OpenAPI/Swagger
- **Type Safety** throughout the application
- **Error Boundaries** for graceful error handling

## 🏗️ Architecture

```
Frontend (Next.js)     Backend (FastAPI)     Vector Store (ChromaDB)
      │                        │                        │
      ├─ Upload Interface      ├─ PDF Processing        ├─ Document Embeddings
      ├─ Chat Interface        ├─ Text Chunking         ├─ Similarity Search
      ├─ Session Management    ├─ OpenRouter Integration├─ Metadata Storage
      └─ Progress Tracking     └─ Response Generation   └─ Session Isolation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+
- **OpenRouter API Key** ([Get one here](https://openrouter.ai/keys))
- **Google AI API Key** for embeddings ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd multimodal-rag
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r Requirements.txt

# Configure environment
cp env.example .env
# Edit .env with your OpenRouter and Google AI API keys

# Run the backend
python main.py
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🐳 Docker Deployment

### Quick Start with Docker Compose
```bash
# Create environment file
cp backend/env.example .env
# Add your OpenRouter and Google AI API keys to .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Individual Container Builds
```bash
# Backend
cd backend
docker build -t multimodal-rag-backend .

# Frontend
cd frontend
docker build -t multimodal-rag-frontend .
```

## 📊 API Endpoints

### Document Management
- `POST /upload` - Upload and process PDF documents
- `GET /sessions` - List all document sessions
- `DELETE /sessions/{id}` - Delete a specific session

### Chat Interface
- `POST /chat` - Send questions about uploaded documents
- `POST /visualize-embeddings` - Generate embeddings for visualization

### System
- `GET /health` - Health check with service status

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/.env`)
```env
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_API_BASE=https://openrouter.ai/api/v1/
SITE_URL=http://localhost:3000
SITE_NAME=Multimodal RAG Assistant

# Model Configuration (OpenRouter format)
CHAT_MODEL=google/gemini-2.5-flash-lite-preview-06-17

# Google AI for Embeddings
GOOGLE_API_KEY=your_google_api_key_here
EMBEDDING_MODEL=models/text-embedding-004

# File Processing
PDF_UPLOAD_DIR=./uploads
CHROMA_PATH=./chroma
CHUNK_SIZE=1000
CHUNK_OVERLAP=100
MAX_FILE_SIZE=50

# Server
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
multimodal-rag/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   └── chroma_service.py    # Vector database management
│   │   └── schemas/
│   │       └── schemas.py           # API data models
│   ├── processing/
│   │   └── pdf_processor.py         # Enhanced PDF processing
│   ├── main.py                      # FastAPI application
│   ├── config.py                    # Configuration management
│   ├── Requirements.txt             # Python dependencies
│   └── Dockerfile                   # Backend container
├── frontend/
│   ├── src/
│   │   ├── app/                     # Next.js App Router
│   │   ├── components/              # React components
│   │   │   └── ui/                  # ShadCN UI components
│   │   ├── context/                 # React context providers
│   │   ├── hooks/                   # Custom hooks
│   │   └── utils/                   # Utility functions
│   ├── package.json                 # Node.js dependencies
│   └── Dockerfile                   # Frontend container
├── docker-compose.yml               # Orchestration
└── README.md                        # This file
```

## 💡 Usage Tips

### 📤 **Document Upload**
- Supports PDF files up to 50MB
- Real-time progress tracking during processing
- Automatic text chunking and embedding generation
- Session-based isolation for multiple documents

### 💬 **Chat Interface**
- Ask questions about your uploaded documents
- Responses include source citations
- Context-aware answers based on document content
- Session persistence across browser refreshes

### ⌨️ **Keyboard Shortcuts**
- `Ctrl + Enter`: Send message
- `Ctrl + L`: Clear chat history

### 📱 **Mobile Support**
- Responsive design with mobile-optimized navigation
- Drawer-style sidebar for small screens
- Touch-friendly interface elements

## 🛠️ Development

### Adding New Features

#### Backend
1. Add new endpoints in `main.py`
2. Create data models in `app/schemas/schemas.py`
3. Add business logic in `app/services/`
4. Update configuration in `config.py`

#### Frontend
1. Create components in `src/components/`
2. Add pages in `src/app/`
3. Update API calls in `src/utils/api.ts`
4. Style with Tailwind CSS and ShadCN components

### Testing
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm test
```

## 🔍 Monitoring & Debugging

### Health Checks
- Backend health: `GET /health`
- Service status monitoring included
- Docker health checks configured

### Logging
- Structured logging with configurable levels
- Request/response tracking
- Error monitoring with stack traces

## 🚨 Troubleshooting

### Common Issues

1. **OpenRouter API Errors**
   - Verify OpenRouter API key is set correctly
   - Check OpenRouter credits and billing
   - Ensure API base URL is correct

2. **Google AI Embedding Errors**
   - Verify Google AI API key is set correctly
   - Check Google AI API quota
   - Ensure embedding model is available

3. **File Upload Failures**
   - Check file size (max 50MB)
   - Ensure PDF format
   - Verify sufficient disk space

4. **ChromaDB Issues**
   - Clear `chroma/` directory to reset
   - Check file permissions
   - Verify sufficient memory

### Reset Application
```bash
# Clear all data
rm -rf backend/chroma/ backend/uploads/
rm -rf vector_store/ uploads/

# Restart services
docker-compose down -v
docker-compose up -d
```

## 🔒 Security Considerations

- Rate limiting prevents API abuse
- File type validation prevents malicious uploads
- CORS properly configured for production
- Environment variables for sensitive data
- Input validation and sanitization

## 📈 Performance Optimization

- Chunked file processing for large documents
- Efficient vector similarity search
- Connection pooling for database operations
- Static asset optimization in production
- Caching strategies for repeated queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenRouter** for unified LLM API access
- **Google AI** for Gemini models and embeddings
- **ChromaDB** for vector database capabilities
- **FastAPI** for the robust backend framework
- **Next.js** for the modern frontend framework
- **ShadCN** for beautiful UI components 