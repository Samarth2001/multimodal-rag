"use client";
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        role === "user" ? "justify-end" : "justify-start"
      } mb-3`}
    >
      <div
        className={`max-w-[80%] p-3 rounded-lg ${
          role === "user"
            ? "bg-blue-500 text-white rounded-tr-none"
            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none"
        }`}
      >
        {role === "assistant" ? (
          <ReactMarkdown 
            components={{
              // Apply classes to all paragraphs, headings, etc.
              p: ({...props}) => <p className="prose dark:prose-invert" {...props} />
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  );
}
