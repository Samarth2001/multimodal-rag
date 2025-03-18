"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ComponentPropsWithoutRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div
      className={`flex ${
        role === "user" ? "justify-end" : "justify-start"
      } mb-4`}
    >
      {role === "assistant" && (
        <div className="flex-shrink-0 mr-2">
          <div className={`w-8 h-8 rounded-full ${
            isDark 
              ? 'bg-emerald-500/20 border-emerald-500/30' 
              : 'bg-emerald-100 border-emerald-300'
            } border flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      )}
      
      <div
        className={`max-w-[85%] p-4 rounded-lg ${
          role === "user"
            ? `${isDark 
                ? 'bg-blue-600/30 border-blue-500/30 text-white' 
                : 'bg-blue-50 border-blue-200 text-blue-900'
              } border rounded-tr-none`
            : `${isDark 
                ? 'bg-gray-800 border-gray-700 text-gray-200' 
                : 'bg-gray-50 border-gray-200 text-gray-800'
              } border rounded-tl-none`
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
                      style={isDark 
                        ? (atomDark as Record<string, React.CSSProperties>) 
                        : (oneLight as Record<string, React.CSSProperties>)}
                      language={match[1]}
                      PreTag="div"
                      className={`rounded border ${isDark ? 'border-gray-700' : 'border-gray-300'} text-sm`}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={`${isDark 
                      ? 'bg-gray-900 text-emerald-400' 
                      : 'bg-gray-100 text-emerald-700'
                    } px-1 py-0.5 rounded`} {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({...props}) => <p {...props} />,
                ul: ({...props}) => <ul className="list-disc pl-4 my-2" {...props} />,
                ol: ({...props}) => <ol className="list-decimal pl-4 my-2" {...props} />,
                li: ({node, children, ...props}) => {
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
          <div className={`mt-2 pt-2 border-t ${
            isDark 
              ? 'border-gray-700/50 text-gray-500' 
              : 'border-gray-200 text-gray-500'
            } text-xs flex items-center`}>
            <span className="mr-2">RAG-enhanced response</span>
            <div className={`flex-grow h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          </div>
        )}
      </div>
      
      {role === "user" && (
        <div className="flex-shrink-0 ml-2">
          <div className={`w-8 h-8 rounded-full ${
            isDark 
              ? 'bg-blue-500/20 border-blue-500/30' 
              : 'bg-blue-100 border-blue-300'
            } border flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
