"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { User, Sparkles } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming you have an Avatar component

// Define the CodeProps type locally if not globally available
interface CodeProps extends React.ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 border border-sky-500/30">
          <AvatarFallback className="bg-sky-500/20 text-sky-400">
            <Sparkles className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <Card className={`max-w-[85%] md:max-w-[75%] shadow-sm rounded-xl ${isUser ? "bg-sky-800/60 border-sky-700/40 text-neutral-100 rounded-br-none" : "bg-neutral-800/80 border-neutral-700/60 text-neutral-200 rounded-bl-none"}`}>
        <CardContent className="p-3 md:p-4">
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
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                      className="!bg-neutral-900/70 border border-neutral-700 rounded-md text-sm my-2 shadow-inner"
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
        </CardContent>
      </Card>

      {isUser && (
        <Avatar className="h-8 w-8 border border-neutral-600/50">
          <AvatarFallback className="bg-neutral-700/40 text-neutral-300">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
