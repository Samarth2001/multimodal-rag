"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useChat } from "../context/ChatContext";
import { uploadDocument } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

interface FileUploadProps {
  onDocumentNameSet: (name: string) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  uploadedFile: string | null;
  error: string | null;
  chunkCount?: number;
  processingTime?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDocumentNameSet }) => {
  const { setSessionId } = useChat();
  const { toast } = useToast();
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    uploadedFile: null,
    error: null,
  });

  const simulateProgress = useCallback(() => {
    const interval = setInterval(() => {
      setUploadState(prev => {
        if (prev.progress >= 90) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 200);
    return interval;
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      uploadedFile: null,
      error: null,
    });

    const progressInterval = simulateProgress();

    try {
      const result = await uploadDocument(file);
      
      clearInterval(progressInterval);
      setUploadState({
        isUploading: false,
        progress: 100,
        uploadedFile: file.name,
        error: null,
        chunkCount: result.chunk_count,
        processingTime: result.processing_time,
      });

      setSessionId(result.session_id);
      onDocumentNameSet(file.name);

      toast({
        title: "Upload Successful",
        description: `${file.name} processed into ${result.chunk_count} chunks in ${result.processing_time.toFixed(2)}s`,
      });

    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setUploadState({
        isUploading: false,
        progress: 0,
        uploadedFile: null,
        error: errorMessage,
      });

      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: errorMessage,
      });
    }
  }, [setSessionId, onDocumentNameSet, toast, simulateProgress]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Only PDF files are supported.",
        });
        return;
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 50MB limit.`,
        });
        return;
      }

      handleUpload(file);
    }
  }, [handleUpload, toast]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: uploadState.isUploading,
  });

  const clearUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      uploadedFile: null,
      error: null,
    });
    setSessionId(null);
  };

  const getDropzoneStatus = () => {
    if (uploadState.error) return "error";
    if (uploadState.uploadedFile) return "success";
    if (uploadState.isUploading) return "uploading";
    if (isDragReject) return "reject";
    if (isDragActive) return "active";
    return "idle";
  };

  const status = getDropzoneStatus();

  const getStatusStyles = () => {
    switch (status) {
      case "active":
        return "border-sky-500 bg-sky-50/50 text-sky-700";
      case "reject":
        return "border-red-500 bg-red-50/50 text-red-700";
      case "error":
        return "border-red-500 bg-red-50/50 text-red-700";
      case "success":
        return "border-green-500 bg-green-50/50 text-green-700";
      case "uploading":
        return "border-sky-500 bg-sky-50/50 text-sky-700";
      default:
        return "border-neutral-700 bg-neutral-900/50 text-neutral-400 hover:border-sky-500 hover:text-sky-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case "uploading":
        return (
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Upload className="w-8 h-8" />;
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
          transition-all duration-200 
          ${uploadState.isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${getStatusStyles()}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}
          
          <div className="space-y-1">
            {status === "uploading" && (
              <p className="text-sm font-medium">Processing document...</p>
            )}
            {status === "success" && uploadState.uploadedFile && (
              <p className="text-sm font-medium">
                ✓ {uploadState.uploadedFile} uploaded successfully
              </p>
            )}
            {status === "error" && (
              <p className="text-sm font-medium text-red-600">
                ✗ {uploadState.error}
              </p>
            )}
            {status === "active" && (
              <p className="text-sm font-medium">Drop your PDF here</p>
            )}
            {status === "reject" && (
              <p className="text-sm font-medium text-red-600">
                Only PDF files are supported
              </p>
            )}
            {status === "idle" && (
              <>
                <p className="text-sm font-medium">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-xs text-neutral-500">
                  Max file size: 50MB
                </p>
              </>
            )}
          </div>
        </div>

        {uploadState.isUploading && (
          <div className="mt-4 space-y-2">
            <Progress value={uploadState.progress} className="w-full" />
            <p className="text-xs text-neutral-600">
              {uploadState.progress}% complete
            </p>
          </div>
        )}
      </div>

      {uploadState.uploadedFile && (
        <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-neutral-200">
                {uploadState.uploadedFile}
              </p>
              <div className="flex items-center space-x-2 text-xs text-neutral-400">
                {uploadState.chunkCount && (
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
                    {uploadState.chunkCount} chunks
                  </Badge>
                )}
                {uploadState.processingTime && (
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
                    {uploadState.processingTime.toFixed(2)}s
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearUpload}
            className="text-neutral-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
