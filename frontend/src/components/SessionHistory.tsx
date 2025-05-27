"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getSessions, deleteSession } from "@/utils/api";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Trash2, 
  RefreshCw, 
  Clock, 
  FolderOpen,
  AlertCircle 
} from "lucide-react";

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
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s.session_id !== sessionToDelete));
      
      // If the deleted session was the current one, clear it
      if (sessionId === sessionToDelete) {
        setSessionId(null);
      }

      toast({
        title: "Session Deleted",
        description: "Session and all associated data have been removed.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete session";
      
      // Handle rate limiting for delete
      if (err && typeof err === 'object' && 'status' in err && (err as APIError).status === 429) {
        toast({
          variant: "destructive",
          title: "Rate Limited",
          description: "Too many requests. Please wait a moment before trying again.",
        });
        return;
      }
      
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

  const handleRefresh = () => {
    loadSessions(true); // Force refresh
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600';
      case 'processing':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-neutral-600';
    }
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
          onClick={handleRefresh}
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500 font-medium">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-6 px-2 text-neutral-400 hover:text-neutral-200"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.session_id}
            className={`
              group relative p-3 rounded-lg border cursor-pointer transition-all duration-200
              ${sessionId === session.session_id 
                ? 'bg-sky-900/30 border-sky-700 ring-1 ring-sky-700/50' 
                : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/50 hover:border-neutral-700'
              }
            `}
            onClick={() => handleSelectSession(session)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <FileText className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-neutral-200 truncate">
                    {session.filename}
                  </span>
                  {sessionId === session.session_id && (
                    <Badge 
                      variant="secondary" 
                      className="bg-sky-800 text-sky-200 text-xs px-1.5 py-0.5"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-neutral-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(session.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                    <span>{session.chunk_count} chunks</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.session_id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-neutral-500 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionHistory; 