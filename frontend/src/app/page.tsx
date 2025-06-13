"use client";
import { useState, useRef, FormEvent, useEffect, useCallback } from "react";
import { useChat, Message } from "../context/ChatContext";
// Removed useTheme as theme is now forced dark via layout.tsx
// import { useTheme } from "../context/ThemeContext"; 

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Added DialogClose
import { useToast } from "@/hooks/use-toast";


// Custom Components (potentially to be refactored or restyled with ShadCN)
import FileUpload from "../components/FileUpload"; // Will need heavy restyling or replacement
import ChatMessage from "../components/ChatMessage"; // Will need restyling
// import TechExplainer from "../components/TechExplainer"; // REMOVED
// import QueryMetrics from "../components/QueryMetrics"; // To be decided if/how to integrate
// import ThemeToggle from "../components/ThemeToggle"; // REMOVED (theme is forced dark)
import SessionHistory from "../components/SessionHistory"; // Needs restyling with ShadCN
// import ExportButton from "../components/ExportButton"; // To be integrated with ShadCN Button
// import ShortcutHelp from "../components/ShortcutHelp"; // To be integrated into a dialog or new component
// import FeedbackButton from "../components/FeedbackButton"; // To be integrated with ShadCN Button

import { sendChatMessage } from "@/utils/api";
import { MessageSquare, Paperclip, Send, HelpCircle, FileText, Trash2, Download, Menu, Info } from 'lucide-react'; // Removed Settings, added Info

// Message type is defined in ChatContext.tsx and used implicitly by useChat hook

type ExportFormat = 'text' | 'json' | 'markdown';

export default function Home() {
  const {
    sessionId,
    setSessionId, // Now used for clearing
    messages,
    setMessages,
    addMessage,
    setCurrentSessionName,
    currentSessionName,
  } = useChat();
  // const { theme } = useTheme(); // REMOVED

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [currentSources, setCurrentSources] = useState<string[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if(error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
      setError(null); // Clear error after toasting
    }
  }, [error, toast]);

  const handleQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionId || !question.trim()) {
      if(!sessionId) {
        toast({ title: "No Document", description: "Please upload a document first.", variant: "destructive" });
      }
      return;
    }

    const userMessage = { role: "user" as const, content: question };
    addMessage(userMessage);
    // Add an empty assistant message that will be populated by the stream
    addMessage({ role: "assistant" as const, content: ""});

    const currentQuestion = question;
    setQuestion("");
    setLoading(true);
    setCurrentSources([]);
    setProcessingTime(null);

    await sendChatMessage(currentQuestion, sessionId, {
      onToken: (token) => {
        setMessages((prevMessages: Message[]) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            const updatedMessages = [...prevMessages];
            updatedMessages[prevMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + token,
            };
            return updatedMessages;
          }
          return prevMessages;
        });
      },
      onSources: (sources) => {
        setCurrentSources(sources);
      },
      onComplete: (time) => {
        setProcessingTime(time);
        setLoading(false);
      },
      onError: (err) => {
        const errorMessageContent = err instanceof Error ? err.message : "An error occurred processing your question.";
        setError(errorMessageContent); // Set error to trigger toast
        
        // Update the last message to show an error state
        setMessages((prevMessages: Message[]) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                const updatedMessages = [...prevMessages];
                updatedMessages[prevMessages.length - 1] = {
                    ...lastMessage,
                    content: "Sorry, I encountered an error. Please try again.",
                    isError: true,
                };
                return updatedMessages;
            }
            return prevMessages;
        });
        
        setLoading(false);
      },
    });
  };

  const handleDocumentNameChange = (name: string) => {
    setCurrentSessionName(name);
     toast({
        title: "Document Loaded",
        description: `${name} is ready for analysis.`,
      });
  };
  
  const handleClearChat = useCallback(() => {
    if (messages.length > 0 && confirm('Are you sure you want to clear the current chat and document session?')) {
      setMessages([]);
      setSessionId(null); // Clear the session
      setCurrentSessionName(null); // Clear the document name
      toast({ title: "Chat Cleared", description: "The chat history and document session have been cleared." });
    }
  }, [messages, setMessages, toast, setSessionId, setCurrentSessionName]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && !e.shiftKey) {
        if (
          sessionId &&
          question.trim() &&
          !loading &&
          document.activeElement?.id === 'chat-input'
        ) {
          e.preventDefault();
          const form = document.getElementById('chat-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        handleClearChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sessionId, question, loading, messages, setMessages, handleClearChat]); // Added messages and setMessages to dependency array for handleClearChat

  const handleExport = (format: ExportFormat) => {
    if (messages.length === 0) {
      toast({
        title: "Export Failed",
        description: "There are no messages to export.",
        variant: "destructive"
      });
      return;
    }
    
    let content = '';
    const filename = `${currentSessionName || 'chat-export'}-${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'text':
        content = messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\\n\\n');
        downloadFile(`${filename}.txt`, content, 'text/plain');
        break;
      case 'json':
        content = JSON.stringify(messages, null, 2);
        downloadFile(`${filename}.json`, content, 'application/json');
        break;
      case 'markdown':
        content = messages.map(msg => {
          const role = msg.role === 'user' ? 'You' : 'AI Assistant';
          return `### ${role}\\n\\n${msg.content}`;
        }).join('\\n\\n');
        downloadFile(`${filename}.md`, content, 'text/markdown');
        break;
    }
    
    toast({
      title: "Export Successful",
      description: `Chat exported as ${format.toUpperCase()}.`
    });
  };

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-neutral-200 overflow-hidden">
      {/* Header */}
      <header className="bg-neutral-950 border-b border-neutral-800 py-3 flex-shrink-0">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
             <Button variant="ghost" size="icon" className="md:hidden mr-2 text-neutral-400 hover:text-sky-400" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Doc<span className="text-sky-400">AI</span>ssistant
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* <FeedbackButton /> - Replace with ShadCN Dialog/Button */}
            {/* <ShortcutHelp /> - Replace with ShadCN Dialog/Button */}
             <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-sky-400">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                <DialogHeader>
                  <DialogTitle>Keyboard Shortcuts</DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Efficiently navigate and use the application.
                  </DialogDescription>
                </DialogHeader>
                <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300 py-2">
                  <li><kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Enter</kbd>: Send message</li>
                  <li><kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">L</kbd>: Clear chat messages</li>
                </ul>
                 <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" className="border-neutral-700 hover:bg-neutral-800">Close</Button>
                    </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* <ThemeToggle /> REMOVED */}
            {/* Removed RAG badge for cleaner UI */}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar - Drawer style */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
           <div className="relative z-50 h-full w-72 bg-neutral-950 border-r border-neutral-800 shadow-xl">
             {/* Inlined Left Panel Content for Mobile */}
             <div className="h-full flex flex-col p-4 space-y-4">
                <Card className="bg-neutral-900 border-neutral-800 flex-shrink-0">
                  <CardHeader>
                    <CardTitle className="text-lg text-neutral-200 flex items-center">
                      <Paperclip className="mr-2 h-5 w-5 text-sky-400" /> Document Upload
                    </CardTitle>
                    <CardDescription className="text-neutral-400 text-xs">
                      Upload a PDF to begin analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload onDocumentNameSet={handleDocumentNameChange} />
                  </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800 flex-1 flex flex-col min-h-0">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-lg text-neutral-200 flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-sky-400" /> Chat History
                    </CardTitle>
                    <CardDescription className="text-neutral-400 text-xs">
                      Review previous conversations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        <SessionHistory />
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
           </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-4 md:py-6 flex gap-6 overflow-hidden min-h-0">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:block md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0">
           {/* Inlined Left Panel Content for Desktop */}
           <div className="h-full flex flex-col p-4 space-y-4 bg-neutral-950/50 rounded-lg">
              <Card className="bg-neutral-900 border-neutral-800 flex-shrink-0">
                <CardHeader>
                  <CardTitle className="text-lg text-neutral-200 flex items-center">
                    <Paperclip className="mr-2 h-5 w-5 text-sky-400" /> Document Upload
                  </CardTitle>
                  <CardDescription className="text-neutral-400 text-xs">
                    Upload a PDF to begin analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload onDocumentNameSet={handleDocumentNameChange} />
                </CardContent>
              </Card>
              <Card className="bg-neutral-900 border-neutral-800 flex-1 flex flex-col min-h-0">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-lg text-neutral-200 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-sky-400" /> Chat History
                  </CardTitle>
                  <CardDescription className="text-neutral-400 text-xs">
                    Review previous conversations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      <SessionHistory />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col bg-neutral-950 border-neutral-800 shadow-md min-h-0">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-neutral-800 flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-neutral-200">
                  {currentSessionName ? `Chat: ${currentSessionName}` : sessionId ? "Chat" : "Upload a document to begin"}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {messages.length > 0 && (
                     <Button variant="ghost" size="icon" onClick={handleClearChat} className="text-neutral-400 hover:text-red-500" title="Clear Chat (Ctrl+L)">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                  )}
                  {/* <ExportButton /> - Replace with ShadCN */}
                  <Dialog>
                    <DialogTrigger asChild>
                       <Button variant="ghost" size="icon" disabled={!sessionId || messages.length === 0} className="text-neutral-400 hover:text-sky-400" title="Export Chat">
                         <Download className="h-4 w-4" />
                       </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                       <DialogHeader>
                          <DialogTitle>Export Chat</DialogTitle>
                          <DialogDescription>Select a format to download your conversation.</DialogDescription>
                       </DialogHeader>
                       <div className="flex justify-around py-4">
                          <Button variant="outline" onClick={() => handleExport('markdown')}>Markdown</Button>
                          <Button variant="outline" onClick={() => handleExport('text')}>Text</Button>
                          <Button variant="outline" onClick={() => handleExport('json')}>JSON</Button>
                       </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {messages.length === 0 && sessionId ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                      <MessageSquare className="w-16 h-16 text-neutral-700 mb-3" />
                      <p className="text-neutral-500 text-sm">
                        Ask a question about your document to begin the analysis.
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                       <FileText className="w-16 h-16 text-neutral-700 mb-3" />
                      <p className="text-neutral-500 text-sm">
                        Upload a document to analyze its content.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <ChatMessage
                          key={index}
                          role={msg.role}
                          content={msg.content}
                          // Add specific styling for ShadCN if ChatMessage is kept custom
                          // For example, pass theme='dark' or specific Tailwind classes
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 border-t border-neutral-800 flex-shrink-0">
              <div className="w-full space-y-2">
                <form id="chat-form" onSubmit={handleQuestion} className="flex w-full items-center space-x-2">
                  <Input
                    id="chat-input"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={sessionId ? "Ask a question..." : "Upload a document first..."}
                    className="flex-grow bg-neutral-900 border-neutral-700 focus:border-sky-500 placeholder:text-neutral-600"
                    disabled={!sessionId || loading}
                  />
                  <Button type="submit" disabled={!sessionId || loading || !question.trim()} className="bg-sky-600 hover:bg-sky-500 text-white">
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
                {loading && currentSources.length > 0 && (
                  <div className="flex items-center justify-center text-xs text-neutral-500 pt-1">
                    <Info className="w-3 h-3 mr-1.5" />
                    <span>Searching in sources: {currentSources.join(', ')}</span>
                  </div>
                )}
                {processingTime && !loading && messages.length > 0 && (
                  <p className="text-xs text-neutral-600 text-center">
                    Last query: {processingTime.toFixed(2)}s
                  </p>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
