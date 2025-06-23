// Conditional import for client-side only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let openDB: any = null;

const DB_NAME = 'chat-sessions-db';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

// Initialize idb only on client side
const initIDB = async () => {
  if (typeof window !== 'undefined' && !openDB) {
    const idb = await import('idb');
    openDB = idb.openDB;
  }
};

export type Message = {
    role: 'user' | 'assistant';
    content: string;
    isError?: boolean;
};

export interface ChatSession {
    id: string;
    name: string;
    lastUpdated: string;
    messages: Message[];
}



const getDBPromise = async () => {
  await initIDB();
  if (!openDB) {
    throw new Error('IndexedDB not available');
  }
  return openDB(DB_NAME, DB_VERSION, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upgrade(db: any) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('lastUpdated', 'lastUpdated');
    },
  });
};

export const getSessionsFromDB = async (): Promise<ChatSession[]> => {
    if (typeof window === 'undefined') return [];
    const db = await getDBPromise();
    const sessions = await db.getAll(STORE_NAME);
    // Sort by most recently updated
    return sessions.sort((a: ChatSession, b: ChatSession) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
};

export const getSessionFromDB = async (id: string): Promise<ChatSession | undefined> => {
    if (typeof window === 'undefined') return undefined;
    const db = await getDBPromise();
    return db.get(STORE_NAME, id);
}

export const saveSessionToDB = async (session: ChatSession): Promise<void> => {
    if (typeof window === 'undefined') return;
    const db = await getDBPromise();
    await db.put(STORE_NAME, session);
};

export const deleteSessionFromDB = async (id: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    const db = await getDBPromise();
    await db.delete(STORE_NAME, id);
}; 