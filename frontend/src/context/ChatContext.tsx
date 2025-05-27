'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

interface ChatSession {
  id: string;
  name: string; // Document name
  lastUpdated: string; // ISO date string
  messages: Message[];
}

interface ChatContextType {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  sessions: ChatSession[];
  currentSessionName: string | null;
  setCurrentSessionName: (name: string | null) => void;
  saveSession: () => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionName, setCurrentSessionName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Track if component is mounted to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load sessions from localStorage on mount - only after hydration
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      const storedSessions = localStorage.getItem('chat-sessions');
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.warn('Failed to load sessions from localStorage:', error);
    }
  }, [isMounted]);

  // Save sessions to localStorage whenever they change - only after hydration
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      if (sessions.length > 0) {
        localStorage.setItem('chat-sessions', JSON.stringify(sessions));
      }
    } catch (error) {
      console.warn('Failed to save sessions to localStorage:', error);
    }
  }, [sessions, isMounted]);

  // Add a new message to the current conversation
  const addMessage = (message: Message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  // Save current session to history
  const saveSession = () => {
    if (!sessionId || messages.length === 0 || !currentSessionName) return;

    setSessions(prevSessions => {
      // Check if this session already exists
      const existingSessionIndex = prevSessions.findIndex(s => s.id === sessionId);
      
      const updatedSession: ChatSession = {
        id: sessionId,
        name: currentSessionName,
        lastUpdated: new Date().toISOString(),
        messages: messages
      };

      if (existingSessionIndex >= 0) {
        // Update existing session
        const updatedSessions = [...prevSessions];
        updatedSessions[existingSessionIndex] = updatedSession;
        return updatedSessions;
      } else {
        // Add new session
        return [...prevSessions, updatedSession];
      }
    });
  };

  // Load a session from history
  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSessionId(session.id);
      setMessages(session.messages);
      setCurrentSessionName(session.name);
    }
  };

  // Delete a session from history
  const deleteSession = (sessionId: string) => {
    setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
    if (sessionId === sessionId) {
      setSessionId(null);
      setMessages([]);
      setCurrentSessionName(null);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      sessionId, 
      setSessionId, 
      messages, 
      setMessages, 
      addMessage,
      sessions,
      currentSessionName,
      setCurrentSessionName,
      saveSession,
      loadSession,
      deleteSession
    }}>
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
