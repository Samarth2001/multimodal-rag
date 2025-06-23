"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import useChatStore from "@/store/chatStore";
import { uploadDocument } from "@/utils/api";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, Loader2, FileIcon } from "lucide-react";

interface FileUploadProps {
  onDocumentNameSet: (name: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDocumentNameSet }) => {
  const { setSessionId, sessionId, clearCurrentSession } = useChatStore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (sessionId) {
      // If a session already exists, we should clear it before uploading a new one.
      // This logic could also be handled by a confirmation dialog in a real app.
      clearCurrentSession();
    }
    
    // Validations
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return toast({ variant: "destructive", title: "Invalid File Type", description: "Only PDF files are supported." });
    }
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return toast({ variant: "destructive", title: "File Too Large", description: `File size exceeds the 50MB limit.` });
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? prev : prev + 10));
      }, 500);

      const result = await uploadDocument(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setSessionId(result.session_id);
      onDocumentNameSet(file.name);

      toast({
        title: "Upload Successful",
        description: `${file.name} is ready for analysis.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      toast({ variant: "destructive", title: "Upload Failed", description: errorMessage });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 1000);
    }
  }, [setSessionId, onDocumentNameSet, toast, sessionId, clearCurrentSession]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: isUploading,
  });

  const hasActiveSession = !!sessionId && !isUploading;

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-3 text-center 
        transition-all duration-200 ease-in-out cursor-pointer text-sm
        ${isDragActive 
          ? 'border-zinc-500/60 bg-zinc-800/20' 
          : hasActiveSession
            ? 'border-emerald-500/60 bg-emerald-900/10 cursor-not-allowed'
            : 'border-zinc-700/50 hover:border-zinc-600/60 hover:bg-zinc-800/20'
        }
        ${isUploading ? 'cursor-wait' : ''}
      `}
    >
      <input {...getInputProps()} disabled={isUploading || hasActiveSession} />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-700/20 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          </div>
          <div className="space-y-2 w-full">
            <p className="text-xs font-medium text-zinc-300">Processing...</p>
            <Progress 
              value={progress} 
              className="w-full h-1.5 bg-zinc-800 rounded-full" 
            />
            <p className="text-xs text-zinc-500">{progress}%</p>
          </div>
        </div>
      ) : hasActiveSession ? (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-emerald-400">Document Ready</p>
            <p className="text-xs text-zinc-500">Clear chat to upload new file</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className={`w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center transition-colors ${
            isDragActive ? 'bg-zinc-700/20' : ''
          }`}>
            {isDragActive ? (
              <FileIcon className="w-4 h-4 text-zinc-400" />
            ) : (
              <Upload className="w-4 h-4 text-zinc-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className={`text-xs font-medium transition-colors ${
              isDragActive ? 'text-zinc-300' : 'text-zinc-300'
            }`}>
              {isDragActive ? "Drop PDF here" : "Upload PDF"}
            </p>
            <p className="text-xs text-zinc-500">
              Drag & drop or click to browse
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
