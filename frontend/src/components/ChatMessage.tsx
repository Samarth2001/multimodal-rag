"use client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          role === "user"
            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        }`}
      >
        <div className="flex items-center mb-1">
          <div
            className={`h-6 w-6 rounded-full mr-2 flex items-center justify-center text-xs
              ${
                role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-500 text-white"
              }`}
          >
            {role === "user" ? "U" : "AI"}
          </div>
          <p className="text-xs font-medium">
            {role === "user" ? "You" : "Assistant"}
          </p>
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
