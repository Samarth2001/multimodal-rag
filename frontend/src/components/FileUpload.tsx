'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useChat } from '../context/ChatContext';

export default function FileUpload() {
  const { setSessionId } = useChat();
  const [isUploading, setIsUploading] = useState(false);
  const processUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
  
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  };
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const { session_id } = await response.json();
      setSessionId(session_id);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [setSessionId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
  });

  return (
    <div {...getRootProps()} className={`upload-container ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {isUploading ? (
        <p>Processing PDF...</p>
      ) : (
        <p>{isDragActive ? 'Drop PDF here' : 'Drag PDF or click to upload'}</p>
      )}
    </div>
  );
}