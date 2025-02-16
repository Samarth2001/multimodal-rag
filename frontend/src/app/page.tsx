"use client";
import { useChat } from "../context/ChatContext";
import FileUpload from "../components/FileUpload";
import ChatMessage from "../components/ChatMessage";
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Home() {
  const { messages, addMessage, sessionId, isLoading, setIsLoading } =
    useChat();
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    addMessage({ content: input, isUser: true });
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      addMessage({
        content: data.answer,
        isUser: false,
        sources: data.sources,
      });
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        content: "Error processing request",
        isUser: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="chat-container">
      <div className="upload-section">
        <FileUpload />
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && <LoadingSpinner />}
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the document..."
          disabled={!sessionId}
        />
        <button type="submit" disabled={!sessionId || isLoading}>
          Send
        </button>
      </form>
    </main>
  );
}
