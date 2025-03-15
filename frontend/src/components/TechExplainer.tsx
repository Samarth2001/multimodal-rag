/* eslint-disable react/jsx-no-comment-textnodes */
"use client";
import { useState } from 'react';

export default function TechExplainer() {
  const [activeTab, setActiveTab] = useState('how');
  
  return (
    <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-emerald-400 mb-3">RAG Technology</h3>
      
      <div className="flex space-x-2 mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('how')}
          className={`px-3 py-2 text-sm ${activeTab === 'how' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          How It Works
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-3 py-2 text-sm ${activeTab === 'pipeline' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Pipeline
        </button>
        <button
          onClick={() => setActiveTab('tech')}
          className={`px-3 py-2 text-sm ${activeTab === 'tech' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Tech Stack
        </button>
      </div>
      
      <div className="text-sm">
        {activeTab === 'how' && (
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="text-emerald-400 font-semibold">Retrieval-Augmented Generation (RAG)</span> enhances LLM responses with external knowledge.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Your document is processed and <span className="text-blue-400">chunked</span> into smaller segments</li>
              <li>Each chunk is <span className="text-blue-400">embedded</span> into a high-dimensional vector space</li>
              <li>Your question is also <span className="text-blue-400">embedded</span> using the same technique</li>
              <li>The system performs <span className="text-blue-400">similarity search</span> to find relevant chunks</li>
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
            <div className="bg-gray-900 p-3 rounded border border-gray-700 font-mono">
              <p className="text-emerald-400">// Vector Database</p>
              <p className="text-gray-300">ChromaDB <span className="text-gray-500">// Document storage & retrieval</span></p>
              
              <p className="text-emerald-400 mt-2">// Embedding Model</p>
              <p className="text-gray-300">all-MiniLM-L6-v2 <span className="text-gray-500">// 384-dimension vectors</span></p>
              
              <p className="text-emerald-400 mt-2">// LLM for Generation</p>
              <p className="text-gray-300">DeepSeek <span className="text-gray-500">// Context-aware responses</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RagPipelineVisual() {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px] py-4">
        {/* Pipeline visualization with arrows */}
        <div className="relative flex justify-between items-center">
          {/* Document */}
          <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg w-24 z-10 flex flex-col items-center">
            <svg className="w-6 h-6 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">Document</span>
          </div>
          
          {/* Arrow */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 mx-1"></div>
          
          {/* Chunking */}
          <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg w-24 z-10 flex flex-col items-center">
            <svg className="w-6 h-6 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="text-xs">Chunking</span>
          </div>
          
          {/* Arrow */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 mx-1"></div>
          
          {/* Embedding */}
          <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg w-24 z-10 flex flex-col items-center">
            <svg className="w-6 h-6 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Embedding</span>
          </div>
          
          {/* Arrow */}
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 mx-1"></div>
          
          {/* Response */}
          <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg w-24 z-10 flex flex-col items-center">
            <svg className="w-6 h-6 text-emerald-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs">Response</span>
          </div>
        </div>
      </div>
    </div>
  );
}