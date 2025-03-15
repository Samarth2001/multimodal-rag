"use client";
import { useState, useRef, FormEvent } from "react";
import FileUpload from "../components/FileUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { useChat } from "../context/ChatContext";
import ChatMessage from "../components/ChatMessage";

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
            Document AI Assistant
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by RAG
          </p>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-6">
        {/* Left sidebar for file upload */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Upload Document
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a PDF document to start asking questions about its
              contents.
            </p>
            <FileUpload />

            {sessionId && (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Document loaded successfully!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right side for chat */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex-grow flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {sessionId
                ? "Ask Questions About Your Document"
                : "Upload a document to start"}
            </h2>

            {/* Chat messages area */}
            <div className="flex-grow overflow-y-auto mb-4 space-y-4 max-h-[50vh]">
              {messages.length === 0 && sessionId ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">
                  Ask a question about your document to begin the conversation.
                </p>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    Upload a PDF document to start analyzing its content.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    You can ask questions about the document after uploading.
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
              <div ref={messagesEndRef} />
            </div>

            {/* Question input area */}
            <form onSubmit={handleQuestion} className="mt-auto">
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={
                    sessionId
                      ? "Ask a question about your document..."
                      : "Upload a document first"
                  }
                  disabled={!sessionId || loading}
                  className="w-full p-4 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!sessionId || loading || !question.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                    !sessionId || loading || !question.trim()
                      ? "bg-gray-300 text-gray-500 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-4 shadow-inner mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Document AI Assistant &copy; {new Date().getFullYear()} | A Multimodal
          RAG Application
        </div>
      </footer>
    </div>
  );
}
