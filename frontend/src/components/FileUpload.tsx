"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useChat } from "../context/ChatContext";

export default function FileUpload() {
  const { setSessionId } = useChat();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file.type !== "application/pdf") return;

      setFileName(file.name);
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        setSessionId(data.session_id);
      } catch (error) {
        console.error("Upload failed:", error);
        setFileName("");
      } finally {
        setIsUploading(false);
      }
    },
    [setSessionId]
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
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <p className="text-center text-gray-600 dark:text-gray-300">
            Processing PDF...
          </p>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-300">
            {isDragActive ? "Drop PDF here" : "Drag PDF or click to upload"}
          </p>
        )}
      </div>

      {fileName && !isUploading && (
        <div className="mt-2 text-sm">
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Current file:</span> {fileName}
          </p>
        </div>
      )}
    </div>
  );
}
