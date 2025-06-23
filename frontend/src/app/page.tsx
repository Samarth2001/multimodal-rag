"use client";
import { useState, useRef, FormEvent, useEffect, useCallback } from "react";
import useChatStore from "@/store/chatStore";
import { motion, AnimatePresence } from "framer-motion";

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Custom Components
import FileUpload from "../components/FileUpload";
import ChatMessage from "../components/ChatMessage";
import SessionHistory from "../components/SessionHistory";
import ErrorBoundary from "@/components/ErrorBoundary";

import { sendChatMessage } from "@/utils/api";
import { MessageSquare, Send, HelpCircle, FileText, Trash2, Download, Menu, Info, Settings, RefreshCw } from 'lucide-react';
import { Message } from "@/utils/db";

type ExportFormat = 'text' | 'json' | 'markdown';

export default function Home() {
  const {
    sessionId,
    messages,
    addMessage,
    setMessages,
    setCurrentSessionName,
    currentSessionName,
    clearCurrentSession,
    fetchSessions,
    isLoadingSessions,
  } = useChatStore();

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [currentSources, setCurrentSources] = useState<string[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [question]);

  useEffect(() => {
    if(error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
      setError(null);
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
        setError(errorMessageContent);
        
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
      clearCurrentSession();
      toast({ title: "Chat Cleared", description: "The chat history and document session have been cleared." });
    }
  }, [messages.length, clearCurrentSession, toast]);

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
  }, [sessionId, question, loading, handleClearChat]);

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
        content = messages.map((msg: Message) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\\n\\n');
        downloadFile(`${filename}.txt`, content, 'text/plain');
        break;
      case 'json':
        content = JSON.stringify(messages, null, 2);
        downloadFile(`${filename}.json`, content, 'application/json');
        break;
      case 'markdown':
        content = messages.map((msg: Message) => {
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

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-950/95 backdrop-blur-sm p-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-sm">
            <MessageSquare className="h-4 w-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">DocAI Assistant</h2>
            <p className="text-xs text-zinc-500">AI Document Analysis</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all duration-200"
          onClick={() => setIsSidebarOpen(false)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* File Upload Section */}
      <div className="py-5 space-y-4 border-b border-zinc-800/50">
        <div className="space-y-2 px-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-500/60" />
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Document Upload</h3>
          </div>
        </div>
        <div className="px-3">
          <FileUpload onDocumentNameSet={handleDocumentNameChange} />
          {currentSessionName && (
            <div className="flex items-center gap-2 p-3 mt-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate" title={currentSessionName}>
                  {currentSessionName}
                </p>
                <p className="text-xs text-zinc-500">Active document</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 pb-3 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-500/60" />
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Chat History</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => fetchSessions()}
              disabled={isLoadingSessions}
              className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all duration-200"
              title="Refresh sessions"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingSessions ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              <ErrorBoundary>
                <SessionHistory />
              </ErrorBoundary>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 pt-3 border-t border-zinc-800/50 space-y-3">
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearChat} 
              className="flex-1 text-zinc-300 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-200"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Clear Chat
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!sessionId || messages.length === 0} 
                className="flex-1 text-zinc-300 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-200"
              >
                <Download className="h-3 w-3 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Export Conversation</DialogTitle>
                <DialogDescription className="text-zinc-400">Select a format to download your conversation.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 py-4">
                <Button variant="outline" onClick={() => handleExport('markdown')} className="border-zinc-700 hover:bg-zinc-800 transition-colors">
                  Markdown
                </Button>
                <Button variant="outline" onClick={() => handleExport('text')} className="border-zinc-700 hover:bg-zinc-800 transition-colors">
                  Text
                </Button>
                <Button variant="outline" onClick={() => handleExport('json')} className="border-zinc-700 hover:bg-zinc-800 transition-colors">
                  JSON
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-zinc-600">
            Powered by AI • Version 1.0
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {(messages.length > 0) ? (
        // =================================================================
        // CHAT VIEW
        // =================================================================
        <div className="h-screen flex bg-zinc-950 text-zinc-100 overflow-hidden">
          {/* Unified Sidebar for both Mobile and Desktop */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[320px] bg-zinc-950 border-zinc-800 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Main Content - Full Width */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors">
                  <Menu className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center space-x-3">
                  <h1 className="text-lg font-medium text-zinc-100">
                    {currentSessionName || "No document loaded"}
                  </h1>
                  {sessionId && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Ready</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {messages.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={handleClearChat} className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors" title="Clear Chat (Ctrl+L)">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!sessionId || messages.length === 0} className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors" title="Export Chat">
                      <Download className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                      <DialogTitle>Export Conversation</DialogTitle>
                      <DialogDescription className="text-zinc-400">Select a format to download your conversation.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-3 py-4">
                      <Button variant="outline" onClick={() => handleExport('markdown')} className="border-zinc-700 hover:bg-zinc-800 transition-colors">
                        Markdown
                      </Button>
                      <Button variant="outline" onClick={() => handleExport('text')} className="border-zinc-700 hover:bg-zinc-800 transition-colors">
                        Text
                      </Button>
                      <Button variant="outline" onClick={() => handleExport('json')} className="border-zinc-700 hover:bg-zinc-800 transition-colors">
                        JSON
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                      <DialogTitle>Keyboard Shortcuts</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Efficiently navigate and use the application.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">Send message</span>
                        <div className="flex gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Ctrl</kbd>
                          <span className="text-zinc-500">+</span>
                          <kbd className="px-2 py-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Enter</kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">Clear chat</span>
                        <div className="flex gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Ctrl</kbd>
                          <span className="text-zinc-500">+</span>
                          <kbd className="px-2 py-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-zinc-300">L</kbd>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800 transition-colors">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                <div className="w-full max-w-7xl mx-auto px-6 py-4">
                  {messages.length === 0 && sessionId ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm border border-zinc-800/30">
                        <MessageSquare className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-200 mb-3">Ready to analyze your document</h3>
                      <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                        Ask any question about your document content to begin the analysis.
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm border border-zinc-800/30">
                        <FileText className="w-8 h-8 text-zinc-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-200 mb-3">Welcome to DocAI Assistant</h3>
                      <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                        Upload a PDF document to start analyzing and asking questions about its content.
                      </p>
                    </div>
                  ) : (
                    <ErrorBoundary>
                      <div className="py-8">
                        <AnimatePresence initial={false}>
                          {messages.map((msg: Message, index: number) => (
                            <motion.div
                              key={index}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{
                                opacity: { duration: 0.2 },
                                y: { duration: 0.3 },
                                layout: { duration: 0.3 }
                              }}
                              className="mb-8"
                            >
                              <ChatMessage
                                role={msg.role}
                                content={msg.content}
                                isStreaming={loading && index === messages.length - 1}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                      </div>
                    </ErrorBoundary>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur">
                <div className="w-full max-w-7xl mx-auto p-6">
                  <form id="chat-form" onSubmit={handleQuestion} className="flex items-end space-x-3">
                    <div className="flex-1 min-w-0">
                      <Textarea
                        id="chat-input"
                        value={question}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                        placeholder={sessionId ? "Ask a question about your document..." : "Upload a document first..."}
                        className="min-h-[48px] bg-zinc-900/50 border-zinc-800/50 focus:border-zinc-600/50 focus:ring-zinc-600/20 placeholder:text-zinc-500 text-zinc-100 rounded-xl resize-none transition-colors"
                        disabled={!sessionId || loading}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!sessionId || loading || !question.trim()} 
                      size="icon"
                      className="h-10 w-10 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-xl shrink-0 transition-colors"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-zinc-400/30 border-t-zinc-200 rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                  
                  {loading && currentSources.length > 0 && (
                    <div className="flex items-center justify-center text-xs text-zinc-500 mt-3">
                      <Info className="w-3 h-3 mr-1.5 text-zinc-400" />
                      <span>Searching through: {currentSources.join(', ')}</span>
                    </div>
                  )}
                  
                  {processingTime && !loading && messages.length > 0 && (
                    <p className="text-xs text-zinc-600 text-center mt-2">
                      Response generated in {processingTime.toFixed(2)}s
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // =================================================================
        // WELCOME VIEW
        // =================================================================
        <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100 p-4">
          <div className="w-full max-w-2xl text-center">
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight text-zinc-100 mb-4"
            >
              What can I help you analyze?
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-zinc-400 mb-10"
            >
              Upload a document and ask a question to get started.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 shadow-2xl shadow-zinc-950/50"
            >
              <form id="chat-form" onSubmit={handleQuestion} className="flex flex-col space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-1 min-w-0">
                    <Textarea
                      ref={textareaRef}
                      id="chat-input"
                      value={question}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault();
                          const form = e.currentTarget.form;
                          if (form && sessionId && question.trim()) {
                            form.requestSubmit();
                          }
                        }
                      }}
                      placeholder={currentSessionName ? `Ask a question about ${currentSessionName}...` : "Start by uploading a document below..."}
                      className="min-h-[100px] max-h-[300px] text-lg leading-relaxed bg-transparent border-none focus:ring-0 placeholder:text-zinc-500 text-zinc-100 resize-none transition-colors overflow-y-auto"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!sessionId || loading || !question.trim()} 
                    size="icon"
                    className="h-12 w-12 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-xl shrink-0 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    title={sessionId ? "Send message (Ctrl+Enter)" : "Upload a document first"}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-zinc-400/30 border-t-zinc-200 rounded-full animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-dashed border-zinc-700/50" />
                  </div>
                  <span className="relative px-4 bg-zinc-900 text-xs text-zinc-500 font-medium tracking-wider uppercase">
                    {currentSessionName ? "Document Ready" : "Upload Document"}
                  </span>
                </div>

                <FileUpload onDocumentNameSet={handleDocumentNameChange} />
                
                {sessionId && (
                  <p className="text-xs text-zinc-500 text-center">
                    Press <kbd className="px-1.5 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Enter</kbd> to send
                  </p>
                )}
              </form>
            </motion.div>

            <motion.div 
              className="mt-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button variant="link" onClick={() => setIsSidebarOpen(true)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Chat History
              </Button>
            </motion.div>

          </div>
          {/* Sidebar Sheet for history access from welcome screen */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[320px] bg-zinc-950 border-zinc-800 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
}
