import { useState, useEffect } from 'react';

interface FileListResponse {
  files: string[];
  total_files: number;
}

export interface KnowledgeBaseFile {
  id: string;
  name: string;
  originalName: string;
  dateAdded?: string;
}

// Helper function to clean up filenames
const cleanFileName = (filename: string): KnowledgeBaseFile => {
  // Extract UUID if present
  const uuidMatch = filename.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
  const id = uuidMatch ? uuidMatch[1] : filename;
  
  // Remove file extension and UUID
  let name = filename.split('.').slice(0, -1).join('.') || filename;
  name = name.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '').trim();
  
  // Clean up any remaining underscores or dashes
  name = name.replace(/_/g, ' ').replace(/-/g, ' ').trim();
  
  return {
    id,
    name: name || 'Unnamed Document',
    originalName: filename,
    dateAdded: new Date().toISOString() // We'll assume "now" since we don't have the actual date
  };
};

export function useFileList() {
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
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
      
      // Process filenames to be more user-friendly
      const processedFiles = Array.from(new Set(data.files)).map(cleanFileName);
      
      setFiles(processedFiles);
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