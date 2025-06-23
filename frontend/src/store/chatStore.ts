import { create } from 'zustand';
import { 
    ChatSession, 
    Message, 
    getSessionsFromDB, 
    saveSessionToDB, 
    deleteSessionFromDB,
    getSessionFromDB
} from '@/utils/db';
import { devtools } from 'zustand/middleware';

interface ChatState {
  sessionId: string | null;
  messages: Message[];
  sessions: ChatSession[];
  currentSessionName: string | null;
  isLoadingSessions: boolean;

  setSessionId: (id: string | null) => void;
  setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  setCurrentSessionName: (name: string | null) => void;
  
  fetchSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  saveCurrentSession: () => Promise<void>;
  clearCurrentSession: () => void;
  getSessions: () => ChatSession[];
}

const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      sessionId: null,
      messages: [],
      sessions: [],
      currentSessionName: null,
      isLoadingSessions: true,

      setSessionId: (id) => set({ sessionId: id }, false, "setSessionId"),
      setMessages: (messages) => set((state) => ({
        messages: typeof messages === 'function' ? messages(state.messages) : messages
      }), false, "setMessages"),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] }), false, "addMessage"),
      setCurrentSessionName: (name) => set({ currentSessionName: name }, false, "setCurrentSessionName"),

      fetchSessions: async () => {
        set({ isLoadingSessions: true });
        try {
            const sessions = await getSessionsFromDB();
            set({ sessions, isLoadingSessions: false }, false, "fetchSessions/success");
        } catch (error) {
            console.error("Failed to fetch sessions from DB:", error);
            set({ isLoadingSessions: false }, false, "fetchSessions/error");
        }
      },

      loadSession: async (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId) || await getSessionFromDB(sessionId);
        if (session) {
          set({
            sessionId: session.id,
            messages: session.messages,
            currentSessionName: session.name,
          }, false, "loadSession");
        }
      },

      deleteSession: async (sessionId: string) => {
        await deleteSessionFromDB(sessionId);
        if (get().sessionId === sessionId) {
          get().clearCurrentSession();
        }
        await get().fetchSessions(); // Refresh list
      },

      saveCurrentSession: async () => {
        const { sessionId, messages, currentSessionName } = get();
        if (!sessionId || !currentSessionName || messages.length === 0) return;

        const sessionToSave: ChatSession = {
          id: sessionId,
          name: currentSessionName,
          lastUpdated: new Date().toISOString(),
          messages,
        };
        
        await saveSessionToDB(sessionToSave);
        await get().fetchSessions(); // Refresh list
      },
      
      clearCurrentSession: () => {
        set({
            sessionId: null,
            messages: [],
            currentSessionName: null,
        }, false, "clearCurrentSession");
      },
      
      getSessions: () => get().sessions,
    }),
    { name: "ChatStore" }
  )
);

// Auto-save when messages change for an active session - only on client side
if (typeof window !== 'undefined') {
  let saveTimeout: NodeJS.Timeout;
  useChatStore.subscribe((state, prevState) => {
    if (state.sessionId && state.currentSessionName && state.messages.length > 0) {
      if (state.messages !== prevState.messages) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          state.saveCurrentSession();
        }, 1000); // Debounce save for 1 second
      }
    }
  });
}

// Initial fetch - only on client side
if (typeof window !== 'undefined') {
  useChatStore.getState().fetchSessions();
}


export default useChatStore; 