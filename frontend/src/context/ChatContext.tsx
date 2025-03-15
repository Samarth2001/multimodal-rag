'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

interface ChatContextType {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ sessionId, setSessionId }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
