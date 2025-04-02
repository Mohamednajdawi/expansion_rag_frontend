import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type DocumentCategory = 'general' | 'technical' | 'business' | 'research' | 'other';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  success: boolean;
  category: DocumentCategory;
  processingStatus: ProcessingStatus;
  documentId?: string; // ID from the backend
}

const UPLOAD_URL = 'http://localhost:8000/documents/upload';
const DELETE_URL = 'http://localhost:8000/documents'; // Base URL for document deletion

export function useFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<DocumentCategory[]>([
    'general', 'technical', 'business', 'research', 'other'
  ]);

  // Load uploaded files from localStorage
  useEffect(() => {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      setUploadedFiles(JSON.parse(savedFiles).map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate),
        category: file.category || 'general', // Default category for backward compatibility
        processingStatus: file.processingStatus || 'completed' // Default status for backward compatibility
      })));
    }
  }, []);

  // Save uploaded files to localStorage
  useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  // Upload files with category
  const uploadFiles = async (files: FileList | null, category: DocumentCategory = 'general') => {
    if (!files) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);
      // Add category as metadata
      formData.append('metadata', JSON.stringify({ category }));

      try {
        const response = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          setUploadedFiles(prev => [{
            id: uuidv4(),
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            success: true,
            category,
            processingStatus: 'processing', // Initially set to processing
            documentId: data.document_id, // Store the document ID from the backend
          }, ...prev]);

          // Simulate status change after a delay (in a real app, you'd poll or use WebSockets)
          setTimeout(() => {
            setUploadedFiles(prev => 
              prev.map(f => 
                f.name === file.name && f.uploadDate.getTime() === new Date().getTime() 
                  ? { ...f, processingStatus: 'completed' } 
                  : f
              )
            );
          }, 3000);
        } else {
          console.error('Upload failed:', data);
          setUploadedFiles(prev => [{
            id: uuidv4(),
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            success: false,
            category,
            processingStatus: 'failed',
            documentId: undefined,
          }, ...prev]);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => [{
          id: uuidv4(),
          name: file.name,
          size: file.size,
          uploadDate: new Date(),
          success: false,
          category,
          processingStatus: 'failed',
          documentId: undefined,
        }, ...prev]);
      }
    }

    setIsUploading(false);
  };

  // Delete file locally
  const deleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Delete file from backend and locally
  const deleteFileFromKnowledgeBase = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    
    if (!file || !file.documentId) {
      // If no document ID, just remove locally
      deleteFile(fileId);
      return;
    }

    try {
      const response = await fetch(`${DELETE_URL}/${file.documentId}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
        }
      });

      if (response.ok) {
        // Remove from local state if backend deletion successful
        deleteFile(fileId);
      } else {
        console.error('Error deleting document from knowledge base');
        // Optionally mark as failed deletion
      }
    } catch (error) {
      console.error('Error connecting to backend for deletion:', error);
    }
  };

  // Update file category
  const updateFileCategory = (fileId: string, newCategory: DocumentCategory) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, category: newCategory } 
          : file
      )
    );
  };

  // Get files by category
  const getFilesByCategory = (category: DocumentCategory | 'all') => {
    if (category === 'all') {
      return uploadedFiles;
    }
    return uploadedFiles.filter(file => file.category === category);
  };

  return {
    uploadedFiles,
    isUploading,
    uploadFiles,
    deleteFile,
    deleteFileFromKnowledgeBase,
    updateFileCategory,
    getFilesByCategory,
    categories
  };
} 