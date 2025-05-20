"use client";
import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useChat } from "../context/ChatContext";
import { uploadDocument } from "../utils/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Loader2, AlertTriangle, XCircle, Eye, EyeOff } from 'lucide-react';

interface FileUploadProps {
  onDocumentNameSet?: (name: string) => void;
}

export default function FileUpload({ onDocumentNameSet }: FileUploadProps) {
  const { setSessionId, sessionId } = useChat();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        setInternalError("Only PDF files are accepted.");
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setInternalError(null);
      setFileName(file.name);
      if (onDocumentNameSet) {
        onDocumentNameSet(file.name);
      }
      setIsUploading(true);
      setShowPreview(false);
      
      const fileObjectUrl = URL.createObjectURL(file);
      setFileUrl(fileObjectUrl);
      
      try {
        const data = await uploadDocument(file);
        setSessionId(data.session_id);
        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded and processed.`,
        });
      } catch (error) {
        console.error("Upload failed:", error);
        const errorMsg = error instanceof Error ? error.message : "Upload failed due to an unknown error.";
        toast({
          title: "Upload Failed",
          description: errorMsg,
          variant: "destructive",
        });
        setFileName(null);
        setFileUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setInternalError(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [setSessionId, onDocumentNameSet, toast]
  );

  const { getRootProps, getInputProps, isDragActive, isFocused, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    disabled: isUploading || !!sessionId,
  });

  const handleRemoveFile = () => {
    setFileName(null);
    setFileUrl(null);
    setShowPreview(false);
    setInternalError(null);
    setSessionId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast({ title: "File Removed", description: "The document has been removed." });
  };

  const getDropzoneClassName = () => {
    let baseClasses = "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-150";
    if (isUploading || (!!sessionId && !!fileName)) {
      baseClasses += " opacity-50 cursor-not-allowed";
    } else {
      baseClasses += " hover:border-sky-500/70";
    }

    if ((isDragActive || isFocused) && !(isUploading || (!!sessionId && !!fileName))) {
      baseClasses += " border-sky-500 ring-2 ring-sky-500/50 bg-sky-900/20";
    } else {
      baseClasses += " border-neutral-700";
    }

    if (isDragReject || internalError) {
      baseClasses += " border-red-500/70 bg-red-900/20 text-red-400";
    } else {
      baseClasses += " text-neutral-400";
    }

    if (isDragAccept && !isDragReject && !(isUploading || (!!sessionId && !!fileName))) {
      baseClasses += " border-green-500/70 bg-green-900/20";
    }
    return baseClasses;
  };

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <div {...getRootProps({ className: getDropzoneClassName(), ref: fileInputRef as any })}>
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-sky-400 mb-3" />
            <p className="text-sm text-neutral-300">Processing PDF...</p>
            <p className="text-xs text-neutral-500">Please wait.</p>
          </div>
        ) : sessionId && fileName ? (
          <div className="flex flex-col items-center justify-center text-neutral-500">
            <FileText className="h-10 w-10 mb-3 text-green-500" />
            <p className="text-sm text-green-400">Document <span className="font-semibold">{fileName}</span> loaded.</p>
            <p className="text-xs">Ready for chat.</p>
          </div>
        ) : isDragReject || internalError ? (
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm">{internalError || "Invalid file type"}</p>
            <p className="text-xs">Only PDF files are accepted.</p>
          </div>
        ) : isDragAccept && !isDragReject ? (
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className="h-10 w-10 text-green-400 mb-3" />
            <p className="text-sm text-green-400">Drop PDF here to upload</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className="h-10 w-10 mb-3" />
            <p className="text-sm">
              Drag & drop a PDF file here, or click to select
            </p>
            <p className="text-xs text-neutral-500 mt-1">Max file size: 50MB</p>
          </div>
        )}
      </div>

      {fileName && !isUploading && (
        <div className="mt-4 p-3 border border-neutral-700/80 rounded-lg bg-neutral-800/60 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center overflow-hidden">
              <FileText className="h-5 w-5 mr-2 text-sky-400 flex-shrink-0" />
              <p className="text-sm text-neutral-200 truncate" title={fileName}>{fileName}</p>
            </div>
            <div className="flex items-center flex-shrink-0 space-x-2">
              {fileUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPreview(!showPreview)} 
                  className="text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 px-2 h-7"
                >
                  {showPreview ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                  {showPreview ? "Hide" : "Preview"}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRemoveFile} 
                className="text-red-500/80 hover:text-red-400 hover:bg-red-500/10 h-7 w-7"
                title="Remove file"
              >
                <XCircle className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
          
          {showPreview && fileUrl && (
            <div className="mt-3 border border-neutral-700 rounded overflow-hidden aspect-[4/3] md:aspect-video bg-neutral-900">
              <iframe 
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
