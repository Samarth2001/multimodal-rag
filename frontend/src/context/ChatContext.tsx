'use client';
import { createContext, ReactNode, useContext, useState } from 'react';

export interface Source {
  page_number: number;
  type: string;
}

export interface Message {
  content: string;
  isUser: boolean;
  sources?: Source[];
}

interface ChatContextType {
  sessionId: string | null;
  messages: Message[];
  addMessage: (message: Message) => void;
  setSessionId: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
}

// Initialize context with default values
const ChatContext = createContext<ChatContextType>({
  sessionId: null,
  messages: [], // Initialize with empty array
  addMessage: () => {},
  setSessionId: () => {},
  isLoading: false,
  setIsLoading: () => {}
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // Initialize with empty array
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (message: Message) => {
    const messageWithSources: Message = {
      ...message,
      sources: message.sources || []
    };
    setMessages((prev) => [...prev, messageWithSources]);
  };

  return (
    <ChatContext.Provider
      value={{
        sessionId,
        messages,
        addMessage,
        setSessionId,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
