/* eslint-disable react/jsx-no-comment-textnodes */
"use client";
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function TechExplainer() {
  const [activeTab, setActiveTab] = useState('how');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`mt-6 ${
      isDark 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-white border-gray-200 shadow-sm'
      } border rounded-lg p-4`}>
      <h3 className={`text-lg font-semibold ${
        isDark ? 'text-emerald-400' : 'text-emerald-600'
      } mb-3`}>RAG Technology</h3>
      
      <div className={`flex space-x-2 mb-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => setActiveTab('how')}
          className={`px-3 py-2 text-sm ${
            activeTab === 'how' 
              ? `${isDark ? 'text-emerald-400' : 'text-emerald-600'} border-b-2 ${isDark ? 'border-emerald-400' : 'border-emerald-500'}` 
              : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
          }`}
        >
          How It Works
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-3 py-2 text-sm ${
            activeTab === 'pipeline' 
              ? `${isDark ? 'text-emerald-400' : 'text-emerald-600'} border-b-2 ${isDark ? 'border-emerald-400' : 'border-emerald-500'}` 
              : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
          }`}
        >
          Pipeline
        </button>
        <button
          onClick={() => setActiveTab('tech')}
          className={`px-3 py-2 text-sm ${
            activeTab === 'tech' 
              ? `${isDark ? 'text-emerald-400' : 'text-emerald-600'} border-b-2 ${isDark ? 'border-emerald-400' : 'border-emerald-500'}` 
              : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
          }`}
        >
          Tech Stack
        </button>
      </div>
      
      <div className="text-sm">
        {activeTab === 'how' && (
          <div className="space-y-2">
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              <span className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-semibold`}>Retrieval-Augmented Generation (RAG)</span> enhances LLM responses with external knowledge.
            </p>
            <ol className={`list-decimal list-inside space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>Your document is processed and <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>chunked</span> into smaller segments</li>
              <li>Each chunk is <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>embedded</span> into a high-dimensional vector space</li>
              <li>Your question is also <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>embedded</span> using the same technique</li>
              <li>The system performs <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>similarity search</span> to find relevant chunks</li>
              <li>The LLM generates a response using your question and the retrieved context</li>
            </ol>
          </div>
        )}
        
        {activeTab === 'pipeline' && (
          <div className="py-2">
            <div className="flex flex-col items-center">
              <RagPipelineVisual />
            </div>
          </div>
        )}
        
        {activeTab === 'tech' && (
          <div className="space-y-3">
            <div className={`${
              isDark 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
              } p-3 rounded border font-mono`}>
              <p className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>// Vector Database</p>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ChromaDB <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>// Document storage & retrieval</span></p>
              
              <p className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} mt-2`}>// Embedding Model</p>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>all-MiniLM-L6-v2 <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>// 384-dimension vectors</span></p>
              
              <p className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} mt-2`}>// LLM for Generation</p>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>DeepSeek <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>// Context-aware responses</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RagPipelineVisual() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px] py-4">
        {/* Pipeline visualization with arrows */}
        <div className="relative flex justify-between items-center">
          {/* Document */}
          <div className={`${
            isDark 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
            } border p-3 rounded-lg w-24 z-10 flex flex-col items-center`}>
            <svg className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Document</span>
          </div>
          
          {/* Arrow */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 mx-1"></div>
          
          {/* Chunking */}
          <div className={`${
            isDark 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
            } border p-3 rounded-lg w-24 z-10 flex flex-col items-center`}>
            <svg className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Chunking</span>
          </div>
          
          {/* Arrow */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 mx-1"></div>
          
          {/* Embedding */}
          <div className={`${
            isDark 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
            } border p-3 rounded-lg w-24 z-10 flex flex-col items-center`}>
            <svg className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Embedding</span>
          </div>
          
          {/* Arrow */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 mx-1"></div>
          
          {/* Response */}
          <div className={`${
            isDark 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
            } border p-3 rounded-lg w-24 z-10 flex flex-col items-center`}>
            <svg className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} mb-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Response</span>
          </div>
        </div>
      </div>
    </div>
  );
}