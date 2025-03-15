"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ComponentPropsWithoutRef } from 'react';

// Define the CodeProps type locally
interface CodeProps extends ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        role === "user" ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {role === "assistant" && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      )}
      
      <div
        className={`max-w-[85%] p-4 rounded-lg ${
          role === "user"
            ? "bg-blue-600/30 border border-blue-500/30 text-white rounded-tr-none"
            : "bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none"
        }`}
      >
        {role === "assistant" ? (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown 
              components={{
                code: ({ inline, className, children, ...props }: CodeProps) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={atomDark as Record<string, React.CSSProperties>} // Use a more specific type
                      language={match[1]}
                      PreTag="div"
                      className="rounded border border-gray-700 text-sm"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-900 px-1 py-0.5 rounded text-emerald-400" {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({...props}) => <p {...props} />,
                ul: ({...props}) => <ul className="list-disc pl-4 my-2" {...props} />,
                ol: ({...props}) => <ol className="list-decimal pl-4 my-2" {...props} />,
                li: ({node, children, ...props}) => {  // Removed 'className' since it's not used
                  const parentElementType = node?.parent?.type;
                  if (parentElementType !== 'list') {
                    return (
                      <ul className="list-disc pl-4 my-2">
                        <li className="my-1" {...props}>{children}</li>
                      </ul>
                    );
                  }
                  return <li className="my-1" {...props}>{children}</li>;
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p>{content}</p>
        )}
        
        {role === "assistant" && (
          <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-500 flex items-center">
            <span className="mr-2">RAG-enhanced response</span>
            <div className="flex-grow h-px bg-gray-800"></div>
          </div>
        )}
      </div>
      
      {role === "user" && (
        <div className="flex-shrink-0 ml-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
