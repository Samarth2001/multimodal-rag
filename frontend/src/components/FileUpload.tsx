"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useChat } from "../context/ChatContext";
import { uploadDocument } from "../utils/api";

interface FileUploadProps {
  onDocumentNameSet?: (name: string) => void;
}

export default function FileUpload({ onDocumentNameSet }: FileUploadProps) {
  const { setSessionId } = useChat();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file.type !== "application/pdf") {
        setError("Only PDF files are accepted");
        return;
      }

      setError(null);
      setFileName(file.name);
      if (onDocumentNameSet) {
        onDocumentNameSet(file.name);
      }
      setIsUploading(true);
      
      // Create URL for preview
      const fileObjectUrl = URL.createObjectURL(file);
      setFileUrl(fileObjectUrl);
      
      try {
        const data = await uploadDocument(file);
        setSessionId(data.session_id);
      } catch (error) {
        console.error("Upload failed:", error);
        setError(error instanceof Error ? error.message : "Upload failed");
        setFileName("");
        setFileUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [setSessionId, onDocumentNameSet]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 hover:border-blue-400 dark:border-gray-600"
        } ${error ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-500 border-r-transparent mb-2"></div>
            <p className="text-gray-600 dark:text-gray-300">Processing PDF...</p>
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-300">
            {isDragActive ? "Drop PDF here" : "Drag PDF or click to upload"}
          </p>
        )}
      </div>

      {error && (
        <div className="mt-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {fileName && !isUploading && (
        <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {fileName}
            </p>
            
            {fileUrl && (
              <button 
                onClick={() => setShowPreview(!showPreview)} 
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            )}
          </div>
          
          {showPreview && fileUrl && (
            <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              <iframe 
                src={fileUrl} 
                className="w-full h-[300px]" 
                title="PDF Preview"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
