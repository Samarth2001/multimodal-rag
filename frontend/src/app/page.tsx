'use client'
import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      setSessionId(data.session_id)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleQuestion = async () => {
    if (!sessionId || !question) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          session_id: sessionId
        })
      })
      const data = await response.json()
      setAnswer(data.answer)
    } catch (error) {
      console.error('Chat failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto p-4">
      <div className="mb-4">
        <label htmlFor="pdfUpload" className="block mb-2">Upload PDF Document</label>
        <input 
          id="pdfUpload"
          type="file" 
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-2"
          title="Upload PDF Document"
        />
        <button 
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Upload PDF
        </button>
      </div>

      {sessionId && (
        <div className="mb-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question"
            className="border p-2 mr-2"
          />
          <button 
            onClick={handleQuestion}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {loading ? 'Processing...' : 'Ask'}
          </button>
        </div>
      )}

      {answer && (
        <div className="bg-gray-100 p-4 rounded">
          <p>{answer}</p>
        </div>
      )}
    </main>
  )
}