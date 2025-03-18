'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const shortcuts = [
    { key: 'Ctrl + Enter', description: 'Send message' },
    { key: 'Ctrl + /', description: 'Show/hide shortcut help' },
    { key: 'Ctrl + L', description: 'Clear chat' },
    { key: 'Ctrl + D', description: 'Toggle dark/light mode' },
    { key: 'Esc', description: 'Close dialogs' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-1 rounded-md ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        title="Keyboard Shortcuts"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div 
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border p-6 rounded-lg shadow-xl max-w-md w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Keyboard Shortcuts</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className={`font-mono px-2 py-1 text-sm rounded ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                    {shortcut.key}
                  </div>
                  <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{shortcut.description}</div>
                </div>
              ))}
            </div>
            
            <p className="mt-4 text-sm text-gray-500">Press Esc or click outside to close</p>
          </div>
        </div>
      )}
    </>
  );
} 