'use client';

import { useChat } from '@/context/ChatContext';
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function SessionHistory() {
  const { 
    sessions, 
    loadSession, 
    deleteSession, 
    sessionId: currentSessionId,
    saveSession,
  } = useChat();
  
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const confirmDelete = (sessionIdToDelete: string) => {
    deleteSession(sessionIdToDelete);
    toast({
      title: "Session Deleted",
      description: "The chat session has been removed.",
    });
  };

  const handleSaveCurrent = () => {
    if (!currentSessionId) {
      toast({
        title: "No Active Session",
        description: "Cannot save. Start a new chat or load a document.",
        variant: "destructive"
      });
      return;
    }
    saveSession(); 
    toast({
      title: "Session Saved",
      description: "The current chat progress has been saved.",
    });
  };
  
  const handleLoadSession = (sessionIdToLoad: string) => {
    loadSession(sessionIdToLoad);
    const selectedSession = sessions.find(s => s.id === sessionIdToLoad);
    toast({
        title: "Session Loaded",
        description: `Switched to session: ${selectedSession?.name || 'Untitled Session'}.`,
    });
  }

  const displaySessions = sessions.filter(s => s.id !== currentSessionId || s.messages.length > 0 || s.name);

  if (displaySessions.length === 0 && !currentSessionId) {
    return (
      <div className="text-center p-4 text-neutral-500 flex-grow flex flex-col justify-center items-center">
        <p>No saved sessions yet.</p>
        <p className="text-xs mt-1">Start a chat and save it to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 flex flex-col h-full pt-1">
      {currentSessionId && (
        <Button
          onClick={handleSaveCurrent}
          variant="outline"
          className="w-full border-sky-500/50 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
        >
          Save Current Chat
        </Button>
      )}
      
      {displaySessions.length > 0 && (
        <h3 className="font-medium text-neutral-400 text-xs px-1 pt-2 tracking-wide uppercase">
          Saved Sessions
        </h3>
      )}
      
      {displaySessions.length === 0 && currentSessionId && (
         <div className="text-center p-4 text-xs text-neutral-500 flex-grow flex flex-col justify-center items-center">
            <p>No other saved sessions.</p>
            <p className="mt-1">Your current chat can be saved using the button above.</p>
         </div>
      )}

      {displaySessions.length > 0 && (
        <div className="space-y-1.5 flex-grow overflow-y-auto pr-1">
          {displaySessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleLoadSession(session.id)}
              className={`p-2.5 rounded-md cursor-pointer transition-all duration-150 group relative
                ${
                  session.id === currentSessionId
                    ? "bg-sky-600/30 border border-sky-500/70 ring-1 ring-sky-500 shadow-md"
                    : "bg-neutral-800/70 border border-neutral-700/80 hover:bg-neutral-750/70 hover:border-neutral-600/80"
                }`
              }
            >
              <div className="flex justify-between items-center">
                <div className="overflow-hidden flex-grow">
                  <h4 className={`font-medium truncate text-sm ${session.id === currentSessionId ? "text-sky-200" : "text-neutral-100 group-hover:text-white"}`}>
                    {session.name || "Untitled Session"}
                  </h4>
                  <p className={`text-xs truncate ${session.id === currentSessionId ? "text-sky-300/80" : "text-neutral-400 group-hover:text-neutral-300"}`}>
                    {formatDate(session.lastUpdated)} • {session.messages.length} message(s)
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 h-7 w-7 ml-2 flex-shrink-0 rounded-md ${session.id === currentSessionId ? "text-sky-300 hover:text-red-400 hover:bg-red-500/10" : "text-neutral-500 opacity-60 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10"}`}
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-400">
                        This action cannot be undone. This will permanently delete the session:
                        <br />
                        <span className="font-semibold text-neutral-300 mt-1 block"> {session.name || "Untitled Session"}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300 hover:text-neutral-200"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); confirmDelete(session.id);}}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 