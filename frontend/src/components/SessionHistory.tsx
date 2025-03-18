'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';

export default function SessionHistory() {
  const { 
    sessions, 
    loadSession, 
    deleteSession, 
    sessionId: currentSessionId,
    saveSession
  } = useChat();
  
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setShowConfirmDelete(sessionId);
  };

  const confirmDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
    setShowConfirmDelete(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDelete(null);
  };

  const handleSaveCurrent = () => {
    saveSession();
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500 dark:text-gray-400">
        <p>No saved sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentSessionId && (
        <button
          onClick={handleSaveCurrent}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
        >
          Save Current Session
        </button>
      )}
      
      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
        Previous Sessions
      </h3>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => loadSession(session.id)}
            className={`p-3 rounded-md cursor-pointer transition-colors ${
              session.id === currentSessionId
                ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50"
                : "bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700/50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1 truncate max-w-[200px]">
                  {session.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(session.lastUpdated)} • {session.messages.length} messages
                </p>
              </div>
              
              {showConfirmDelete === session.id ? (
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => confirmDelete(e, session.id)}
                    className="p-1 text-xs bg-red-500 text-white rounded"
                  >
                    Yes
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="p-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete session"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 