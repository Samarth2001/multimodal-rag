"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ComponentPropsWithoutRef } from 'react';
import { User, Sparkles } from 'lucide-react';

// Define the CodeProps type locally
interface CodeProps extends ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex w-full mb-5 ${
        role === "user" ? "justify-end pl-6 md:pl-10" : "justify-start pr-6 md:pr-10"
      }`}
    >
      {role === "assistant" && (
        <div className="flex-shrink-0 mr-2 md:mr-3">
          <div className={`w-8 h-8 rounded-full bg-sky-500/20 border-sky-500/30 border flex items-center justify-center`}>
            <Sparkles className={`w-4 h-4 text-sky-400`} />
          </div>
        </div>
      )}
      
      <div
        className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-xl shadow-sm ${
          role === "user"
            ? `bg-sky-700/50 border-sky-600/50 text-neutral-100 border rounded-br-none`
            : `bg-neutral-800 border-neutral-700 text-neutral-200 border rounded-bl-none`
        }`}
      >
        {role === "assistant" ? (
          <div className="prose prose-sm prose-invert max-w-none 
                        prose-p:text-neutral-200 prose-headings:text-sky-300 
                        prose-strong:text-neutral-100 prose-code:text-sky-300 prose-code:bg-neutral-700/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded 
                        prose-ul:text-neutral-300 prose-ol:text-neutral-300 
                        prose-a:text-sky-400 hover:prose-a:text-sky-300 transition-colors duration-150">
            <ReactMarkdown 
              components={{
                code: ({ inline, className, children, ...props }: CodeProps) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      style={atomDark as any}
                      language={match[1]}
                      PreTag="div"
                      className={`!bg-neutral-900/70 border border-neutral-700 rounded-md text-sm my-2 shadow`}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-neutral-100 whitespace-pre-wrap break-words">{content}</p>
        )}
      </div>
      
      {role === "user" && (
        <div className="flex-shrink-0 ml-2 md:ml-3">
          <div className={`w-8 h-8 rounded-full bg-neutral-700/40 border-neutral-600/50 border flex items-center justify-center`}>
            <User className={`w-4 h-4 text-neutral-300`} />
          </div>
        </div>
      )}
    </div>
  );
}
