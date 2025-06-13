"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getSessions, deleteSession } from "@/utils/api";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Trash2,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  MoreVertical,
  CheckCircle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SessionInfo {
  session_id: string;
  filename: string;
  created_at: number;
  chunk_count: number;
  status: string;
}

interface APIError extends Error {
  status?: number;
}

const SessionHistory: React.FC = () => {
  const { sessionId, setSessionId } = useChat();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if component is mounted to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadSessions = useCallback(async (force: boolean = false) => {
    // Prevent too frequent requests (minimum 2 seconds between calls)
    const now = Date.now();
    if (!force && now - lastLoadTime < 2000) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const sessionList = await getSessions();
      setSessions(sessionList);
      setLastLoadTime(now);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load sessions";
      
      // Handle rate limiting specifically
      if (err && typeof err === 'object' && 'status' in err && (err as APIError).status === 429) {
        setError("Too many requests. Please wait a moment before refreshing.");
        // Don't show toast for rate limiting to avoid spam
        console.warn("Rate limited on sessions endpoint");
        
        // Clear the timeout if one exists
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
        
        // Retry after 10 seconds for rate limiting
        loadTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            loadSessions(true);
          }
        }, 10000);
        
        return;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Failed to Load Sessions",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, lastLoadTime, isMounted]);

  const handleDeleteSession = async (sessionToDelete: string) => {
    try {
      await deleteSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s.session_id !== sessionToDelete));
      if (sessionId === sessionToDelete) {
        setSessionId(null);
      }
      toast({
        title: "Session Deleted",
        description: "The session has been removed.",
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

  const handleSelectSession = (session: SessionInfo) => {
    if (sessionId === session.session_id) {
      return; // Already selected
    }
    
    setSessionId(session.session_id);
    toast({
      title: "Session Loaded",
      description: `Switched to ${session.filename}`,
    });
  };

  // Only load sessions after component is mounted to prevent hydration issues
  useEffect(() => {
    if (isMounted) {
      loadSessions();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isMounted, loadSessions]);

  // Don't render anything during initial hydration
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-neutral-500">Loading...</span>
      </div>
    );
  }

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
        <span className="ml-2 text-sm text-neutral-500">Loading sessions...</span>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => loadSessions()}
          className="border-neutral-700 hover:bg-neutral-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FolderOpen className="w-8 h-8 text-neutral-600 mb-2" />
        <p className="text-sm text-neutral-500 mb-1">No documents uploaded yet</p>
        <p className="text-xs text-neutral-600">Upload a PDF to start analyzing</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-neutral-500 font-medium">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </p>
        <Button variant="ghost" size="sm" onClick={() => loadSessions()} disabled={loading} className="h-7 px-2 text-neutral-400 hover:text-neutral-200">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => (
          <Card
            key={session.session_id}
            onClick={() => handleSelectSession(session)}
            className={`
              group transition-all duration-200 cursor-pointer
              border 
              ${sessionId === session.session_id 
                ? 'bg-sky-900/40 border-sky-700/80 ring-2 ring-sky-700/60' 
                : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-700'
              }
            `}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center ${sessionId === session.session_id ? 'bg-sky-800/70' : 'bg-neutral-800'}`}>
                  {sessionId === session.session_id ? <CheckCircle className="h-4 w-4 text-sky-400" /> : <FileText className="h-4 w-4 text-neutral-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-200 truncate">{session.filename}</p>
                  <p className="text-xs text-neutral-400">
                    {session.chunk_count} chunks
                  </p>
                </div>
              </div>

              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                       <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-900/50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the session and its data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteSession(session.session_id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SessionHistory; 