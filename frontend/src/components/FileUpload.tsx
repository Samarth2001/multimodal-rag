"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useChat } from "../context/ChatContext";
import { uploadDocument } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";

interface FileUploadProps {
  onDocumentNameSet: (name: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDocumentNameSet }) => {
  const { setSessionId, sessionId } = useChat();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

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
      // Simulate progress for better UX
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
      // Short delay before resetting UI to show completion
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 1000);
    }
  }, [setSessionId, onDocumentNameSet, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: isUploading || !!sessionId, // Disable if uploading or a session is active
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center 
        transition-all duration-200 
        ${isDragActive ? 'border-sky-500 bg-sky-900/20' : 'border-neutral-700 hover:border-sky-600 hover:bg-neutral-800/40'}
        ${isUploading ? 'cursor-wait' : 'cursor-pointer'}
        ${!!sessionId && !isUploading ? 'border-green-700/60 bg-green-900/20 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-sm font-medium text-sky-300">Processing Document...</p>
          <Progress value={progress} className="w-full h-1.5 mt-2 bg-neutral-700" />
        </div>
      ) : !!sessionId ? (
         <div className="flex flex-col items-center justify-center space-y-2 text-green-400">
          <CheckCircle className="w-8 h-8" />
          <p className="text-sm font-medium">Document Ready</p>
          <p className="text-xs text-green-500">Clear chat to upload a new file</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 text-neutral-400">
          <Upload className="w-8 h-8" />
          <p className="text-sm font-medium">
            {isDragActive ? "Drop the PDF here" : "Upload Document"}
          </p>
          <p className="text-xs text-neutral-500">Drop a PDF or click to browse</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
