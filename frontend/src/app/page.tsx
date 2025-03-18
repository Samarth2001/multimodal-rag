"use client";
import { useState, useRef, FormEvent, useEffect } from "react";
import FileUpload from "../components/FileUpload";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import LoadingSpinner from "../components/LoadingSpinner";
import { useChat } from "../context/ChatContext";
import { useTheme } from "../context/ThemeContext";
import ChatMessage from "../components/ChatMessage";
import TechExplainer from "../components/TechExplainer";
import QueryMetrics from "../components/QueryMetrics";
import ThemeToggle from "../components/ThemeToggle";
import SessionHistory from "../components/SessionHistory";
import ExportButton from "../components/ExportButton";
import ShortcutHelp from "../components/ShortcutHelp";
import FeedbackButton from "../components/FeedbackButton";
import { sendChatMessage } from "@/utils/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const { 
    sessionId, 
    setSessionId, 
    messages, 
    setMessages, 
    addMessage, 
    setCurrentSessionName 
  } = useChat();
  const { theme } = useTheme();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionId || !question.trim()) return;

    // Add user message immediately
    const userMessage = { role: "user" as const, content: question };
    addMessage(userMessage);

    const currentQuestion = question;
    setQuestion("");
    setLoading(true);
    setError(null);
    setProcessingTime(null);

    try {
      const data = await sendChatMessage(currentQuestion, sessionId);
      
      const assistantMessage = {
        role: "assistant" as const,
        content: data.answer,
      };
      
      addMessage(assistantMessage);
      setProcessingTime(data.processing_time);
    } catch (error) {
      console.error("Chat failed:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      const errorMessage = {
        role: "assistant" as const,
        content: "Sorry, I encountered an error processing your question. Please try again.",
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set document name when uploading a file
  const handleDocumentNameChange = (name: string) => {
    setCurrentSessionName(name);
  };

  // Add keyboard shortcut to send message with Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        if (
          sessionId && 
          question.trim() && 
          !loading && 
          document.activeElement instanceof HTMLInputElement &&
          document.activeElement.id === 'chat-input'
        ) {
          e.preventDefault();
          const form = document.getElementById('chat-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
      }

      // Ctrl+L to clear chat
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (messages.length > 0 && confirm('Clear all messages?')) {
          setMessages([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sessionId, question, loading, setMessages, messages]);

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-950 text-gray-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} backdrop-blur-sm border-b shadow-lg py-4 sticky top-0 z-10`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 tracking-tight">
            Document <span className="text-emerald-500">AI</span> Assistant
          </h1>
          <div className="flex items-center space-x-4">
            <FeedbackButton />
            <ShortcutHelp />
            <ThemeToggle />
            <span className={`px-3 py-1 text-xs ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} rounded-full border text-emerald-500 font-mono`}>
              Powered by RAG
            </span>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-6">
        {/* Left sidebar for file upload, session history and tech explanation */}
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <div className={`${theme === 'dark' 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-gray-900/20' 
            : 'bg-white border-gray-200 shadow-gray-200/40'
          } backdrop-blur-sm border rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Document Upload
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
              Upload a PDF document to start asking questions about its
              contents.
            </p>
            <FileUpload onDocumentNameSet={handleDocumentNameChange} />

            {sessionId && (
              <div className={`mt-4 p-3 ${theme === 'dark' 
                ? 'bg-emerald-900/20 border-emerald-800/30' 
                : 'bg-emerald-50 border-emerald-200'
              } border rounded-md`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} flex items-center`}>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                  Document loaded successfully!
                </p>
              </div>
            )}
          </div>
          
          {/* Session history component */}
          <div className={`${theme === 'dark' 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-gray-900/20' 
            : 'bg-white border-gray-200 shadow-gray-200/40'
          } backdrop-blur-sm border rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              Chat History
            </h2>
            <SessionHistory />
          </div>
          
          {/* Tech Explainer component */}
          <TechExplainer />
        </div>

        {/* Right side for chat */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          <div className={`${theme === 'dark' 
            ? 'bg-gray-800/30 border-gray-700/50 shadow-gray-900/20' 
            : 'bg-white border-gray-200 shadow-gray-200/40'
          } backdrop-blur-sm border rounded-lg shadow-lg p-6 flex-grow flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                {sessionId
                  ? "Technical Document Analysis"
                  : "Upload a document to begin analysis"}
              </h2>
              
              {/* Export button */}
              <ExportButton />
            </div>

            {/* Chat messages area */}
            <div className="flex-grow overflow-y-auto mb-4 space-y-4 max-h-[calc(70vh-12rem)] pr-2 custom-scrollbar">
              {messages.length === 0 && sessionId ? (
                <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} italic text-center py-8`}>
                  Ask a technical question about your document to begin the analysis.
                </p>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className={`w-16 h-16 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-center`}>
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
              
              {messages.length > 0 && processingTime && (
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-right`}>
                  Last query processed in {processingTime.toFixed(2)}s
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Chat input form */}
            <form id="chat-form" onSubmit={handleQuestion} className="relative">
              <input
                id="chat-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  sessionId
                    ? "Ask a technical question about your document... (Ctrl+Enter to send)"
                    : "Upload a document to start querying"
                }
                disabled={!sessionId || loading}
                className={`w-full p-4 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 border-gray-700 text-gray-200 placeholder-gray-500'
                    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
                }`}
              />
              <button
                type="submit"
                disabled={!sessionId || loading}
                className={`absolute right-2 top-2 rounded-lg p-2 ${
                  !sessionId || loading
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
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
      <footer className={`${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} py-4 border-t mt-auto`}>
        <div className="container mx-auto px-4 text-center text-xs text-gray-500">
          <p>Advanced RAG Architecture | {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
