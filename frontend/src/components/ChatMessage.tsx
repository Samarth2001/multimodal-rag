"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CodeProps extends React.ComponentPropsWithoutRef<'code'> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";
  const { toast } = useToast();
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isUser && isStreaming && content === "") {
    return (
      <div className="flex items-start space-x-4 w-full px-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-zinc-300" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-4 w-full px-2 group ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
        isUser 
          ? 'bg-gradient-to-br from-zinc-700 to-zinc-800' 
          : 'bg-gradient-to-br from-zinc-800 to-zinc-900'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-zinc-300" />
        ) : (
          <Bot className="w-4 h-4 text-zinc-300" />
        )}
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        <div className={`prose prose-invert max-w-none ${
          isUser 
            ? 'prose-sm text-zinc-100' 
            : 'prose-sm text-zinc-200'
        }`}>
          <div className="prose-headings:text-zinc-200 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-4
                        prose-p:text-zinc-200 prose-p:leading-7 prose-p:mb-4
                        prose-strong:text-zinc-100 prose-strong:font-semibold
                        prose-em:text-zinc-300 prose-em:italic
                        prose-code:text-emerald-400 prose-code:bg-zinc-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-lg prose-pre:p-4
                        prose-ul:text-zinc-200 prose-ol:text-zinc-200 prose-li:text-zinc-200 prose-li:my-1
                        prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
                        prose-blockquote:border-l-emerald-500 prose-blockquote:bg-zinc-800/30 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:my-4 prose-blockquote:border-l-4
                        prose-hr:border-zinc-700 prose-hr:my-6
                        prose-table:text-zinc-200 prose-th:text-zinc-100 prose-th:font-semibold prose-th:bg-zinc-800 prose-th:border-zinc-700 prose-th:px-4 prose-th:py-2
                        prose-td:border-zinc-700 prose-td:px-4 prose-td:py-2 prose-td:border-t
                        prose-img:rounded-lg prose-img:shadow-lg">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ inline, className, children, ...props }: CodeProps) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="relative group">
                      <SyntaxHighlighter
                        // @ts-expect-error - react-syntax-highlighter types are incompatible
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="!bg-zinc-900 !border !border-zinc-800 !rounded-lg !text-sm !my-4 !shadow-lg"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-zinc-700 rounded-lg overflow-hidden">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-zinc-800 text-zinc-100 font-semibold px-4 py-3 text-left border-b border-zinc-700">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 border-b border-zinc-700 text-zinc-200">
                    {children}
                  </td>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 mb-4 pl-4 text-zinc-200">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 mb-4 pl-4 text-zinc-200">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-zinc-200 leading-7">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-emerald-500 bg-zinc-800/30 rounded-r-lg py-3 px-4 my-4 italic text-zinc-300">
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-zinc-100 mt-6 mb-4 border-b border-zinc-700 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-zinc-100 mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-zinc-100 mt-5 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-zinc-200 leading-7 mb-4 last:mb-0">
                    {children}
                  </p>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && <span className="blinking-cursor"></span>}
          </div>
        </div>

        {!isUser && !isStreaming && content.length > 0 && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors opacity-0 group-hover:opacity-100"
              title={isCopied ? "Copied!" : "Copy to clipboard"}
            >
              {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span className="ml-1 text-xs">{isCopied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
