'use client';

import { useState, useRef } from 'react';
import { useChat } from '@/context/ChatContext';

type ExportFormat = 'text' | 'json' | 'markdown';

export default function ExportButton() {
  const { messages, currentSessionName } = useChat();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleExport = (format: ExportFormat) => {
    if (messages.length === 0) return;
    
    let content = '';
    const filename = `${currentSessionName || 'chat-export'}-${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'text':
        content = messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
        downloadFile(`${filename}.txt`, content, 'text/plain');
        break;
      case 'json':
        content = JSON.stringify(messages, null, 2);
        downloadFile(`${filename}.json`, content, 'application/json');
        break;
      case 'markdown':
        content = messages.map(msg => {
          const role = msg.role === 'user' ? 'You' : 'AI Assistant';
          return `### ${role}\n\n${msg.content}`;
        }).join('\n\n');
        downloadFile(`${filename}.md`, content, 'text/markdown');
        break;
    }
    
    setShowDropdown(false);
  };

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={messages.length === 0}
        className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
          messages.length === 0
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } transition-colors`}
        aria-label="Export conversation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            <button
              onClick={() => handleExport('text')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Export as Text (.txt)
            </button>
            <button
              onClick={() => handleExport('json')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Export as JSON (.json)
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Export as Markdown (.md)
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 