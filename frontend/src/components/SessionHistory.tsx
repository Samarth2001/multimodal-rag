"use client";
import React, { useState, useEffect } from "react";
import useChatStore from "@/store/chatStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Trash2,
  RefreshCw,
  FolderOpen,
  MoreVertical,
  CheckCircle,
  MessageCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ChatSession } from "@/utils/db";

const SessionHistory: React.FC = () => {
  const { 
    sessions, 
    sessionId, 
    loadSession, 
    deleteSession,
    isLoadingSessions
  } = useChatStore();
  
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDeleteSession = async (sessionToDelete: string) => {
    try {
      await deleteSession(sessionToDelete);
      toast({
        title: "Session Deleted",
        description: "The conversation has been removed.",
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete session";
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: errorMessage,
      });
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    if (sessionId === session.id) {
      return; // Already selected
    }
    
    loadSession(session.id);
    toast({
      title: "Session Loaded",
      description: `Switched to ${session.name}`,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
      
      if (diffInMinutes < 1) {
        return "Just now";
      } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m ago`;
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h ago`;
      } else if (diffInMinutes < 2880) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return "Unknown";
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-zinc-700/30 border-t-zinc-400 rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Loading sessions...</span>
        </div>
      </div>
    );
  }

  if (isLoadingSessions && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-500">Loading conversations...</span>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 px-4">
        <div className="p-4 rounded-xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/30">
          <FolderOpen className="w-6 h-6 text-zinc-500" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-zinc-400 font-medium">No conversations yet</p>
          <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
            Upload a PDF document to start your first conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session, index) => {
        const isSelected = sessionId === session.id;
        return (
          <Card
            key={session.id}
            onClick={() => handleSelectSession(session)}
            className={`
              group transition-all duration-300 cursor-pointer relative overflow-hidden border
              ${isSelected 
                ? 'bg-gradient-to-br from-zinc-800/80 to-zinc-900/60 border-zinc-700/60 shadow-lg shadow-zinc-900/20 ring-1 ring-zinc-700/30' 
                : 'bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 border-zinc-800/40 hover:border-zinc-700/60 hover:shadow-md hover:bg-gradient-to-br hover:from-zinc-800/40 hover:to-zinc-900/60'
              }
              backdrop-blur-sm transform-gpu
            `}
            style={{
              animationDelay: `${index * 30}ms`,
              animation: 'fadeInUp 0.4s ease-out forwards'
            }}
          >
            {isSelected && (
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/10 via-transparent to-zinc-700/10 pointer-events-none" />
            )}
            
            <CardContent className="p-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-br from-zinc-700/40 to-zinc-800/40 shadow-sm shadow-zinc-900/30 ring-1 ring-zinc-700/20' 
                      : 'bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 group-hover:from-zinc-700/50 group-hover:to-zinc-800/50'
                  }`}>
                    {isSelected ? (
                      <CheckCircle className="h-4 w-4 text-zinc-300" />
                    ) : (
                      <FileText className="h-4 w-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`text-sm font-medium truncate transition-colors duration-300 ${
                      isSelected ? 'text-zinc-200' : 'text-zinc-300 group-hover:text-zinc-200'
                    }`} title={session.name}>
                      {session.name}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <span className={`transition-colors duration-300 ${
                          isSelected ? 'text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-400'
                        }`}>
                          {session.messages.length}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <span className={`transition-colors duration-300 ${
                          isSelected ? 'text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-400'
                        }`}>
                          {formatDate(session.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                        isSelected 
                          ? 'text-zinc-300 hover:bg-zinc-700/30 hover:text-zinc-200' 
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-zinc-900/95 border-zinc-800/50 backdrop-blur-sm shadow-xl"
                  >
                    <DropdownMenuItem 
                      onSelect={() => handleDeleteSession(session.id)} 
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30 cursor-pointer transition-colors"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('session-history-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'session-history-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default SessionHistory; 