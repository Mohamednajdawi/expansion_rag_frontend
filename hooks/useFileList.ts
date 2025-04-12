import { useState, useEffect } from 'react';

interface FileListResponse {
  files: string[];
  total_files: number;
}

// Helper function to clean up filenames
const cleanFileName = (filename: string): string => {
  // Remove file extension if present
  const name = filename.split('.').slice(0, -1).join('.') || filename;
  // Remove any UUID-like strings
  return name.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '').trim();
};

export function useFileList() {
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/documents/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data: FileListResponse = await response.json();
      // Clean up filenames before setting them
      const cleanedFiles = Array.from(new Set(data.files)).map(cleanFileName);
      setFiles(cleanedFiles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return {
    files,
    isLoading,
    error,
    refresh: fetchFiles
  };
} 