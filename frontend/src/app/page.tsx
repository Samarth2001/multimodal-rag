"use client";
import { useState, useRef, FormEvent } from "react";
import FileUpload from "../components/FileUpload";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import LoadingSpinner from "../components/LoadingSpinner";
import { useChat } from "../context/ChatContext";
import ChatMessage from "../components/ChatMessage";
import TechExplainer from "../components/TechExplainer";
import QueryMetrics from "../components/QueryMetrics";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sessionId, setSessionId } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionId || !question.trim()) return;

    // Add user message immediately
    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);

    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
          session_id: sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Chat failed:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your question.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-950 text-gray-200">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 shadow-lg py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-400 tracking-tight">
            Document <span className="text-emerald-400">AI</span> Assistant
          </h1>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 text-xs bg-gray-800 rounded-full border border-gray-700 text-emerald-400 font-mono">
              Powered by RAG
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-6">
        {/* Left sidebar for file upload and tech explanation */}
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">
              Document Upload
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Upload a PDF document to start asking questions about its
              contents.
            </p>
            <FileUpload />

            {sessionId && (
              <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-md">
                <p className="text-sm text-emerald-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                  Document loaded successfully!
                </p>
              </div>
            )}
          </div>
          
          {/* Add the Tech Explainer component */}
          <TechExplainer />
        </div>

        {/* Right side for chat */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg p-6 flex-grow flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              {sessionId
                ? "Technical Document Analysis"
                : "Upload a document to begin analysis"}
            </h2>

            {/* Chat messages area */}
            <div className="flex-grow overflow-y-auto mb-4 space-y-4 max-h-[50vh] pr-2 custom-scrollbar">
              {messages.length === 0 && sessionId ? (
                <p className="text-gray-500 italic text-center py-8">
                  Ask a technical question about your document to begin the analysis.
                </p>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-center">
                    Upload a document to analyze its technical content
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatMessage
                    key={index}
                    role={msg.role}
                    content={msg.content}
                  />
                ))
              )}
              
              {messages.length > 0 && <QueryMetrics />}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input form */}
            <form onSubmit={handleQuestion} className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  sessionId
                    ? "Ask a technical question about your document..."
                    : "Upload a document to start querying"
                }
                disabled={!sessionId || loading}
                className="w-full p-4 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-800/50 border-gray-700 text-gray-200 placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={!sessionId || loading}
                className={`absolute right-2 top-2 rounded-lg p-2 ${
                  !sessionId || loading
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/80 py-4 border-t border-gray-800 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-gray-500">
          <p>Advanced RAG Architecture | {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
