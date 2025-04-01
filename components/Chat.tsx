'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, QARequest, QAResponse } from '../types/api';
import { v4 as uuidv4 } from 'uuid';
import { Sun, Moon, Trash2, Copy, Download, Settings, ChevronDown, ChevronUp, Send, MessageSquare, Plus, X, Upload, File, FileText, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000/qa';
const UPLOAD_URL = 'http://localhost:8000/documents/upload';

const MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4 Mini' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  success: boolean;
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(new Date(date));
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [temperature, setTemperature] = useState(0);
  const [expandedSources, setExpandedSources] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations from localStorage on initial render
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed.map((conv: any) => ({
        ...conv,
        lastUpdated: new Date(conv.lastUpdated)
      })));
      if (parsed.length > 0) {
        setCurrentConversationId(parsed[0].id);
      }
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load uploaded files from localStorage
  useEffect(() => {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      setUploadedFiles(JSON.parse(savedFiles).map((file: any) => ({
        ...file,
        uploadDate: new Date(file.uploadDate)
      })));
    }
  }, []);

  // Save uploaded files to localStorage
  useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, currentConversationId]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      lastUpdated: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setInput('');
  };

  const updateConversationTitle = (conversationId: string, firstMessage: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : ''),
        };
      }
      return conv;
    }));
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (currentConversationId === conversationId) {
      const remaining = conversations.filter(conv => conv.id !== conversationId);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentConversationId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Update conversation with user message
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        const updatedMessages = [...conv.messages, userMessage];
        // Update title if this is the first message
        if (conv.messages.length === 0) {
          updateConversationTitle(conv.id, input);
        }
        return {
          ...conv,
          messages: updatedMessages,
          lastUpdated: new Date(),
        };
      }
      return conv;
    }));

    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          top_k: 3,
          model: selectedModel,
          temperature: temperature,
        } as QARequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QAResponse = await response.json();

      if (!data.success) {
        throw new Error(data.answer || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.chunks,
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            lastUpdated: new Date(),
          };
        }
        return conv;
      }));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, errorMessage],
            lastUpdated: new Date(),
          };
        }
        return conv;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const currentConversation = conversations.find(conv => conv.id === currentConversationId);

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setConversations(prev => prev.map(conv => ({
        ...conv,
        messages: [],
        lastUpdated: new Date(),
      })));
    }
  };

  const handleExportChat = () => {
    const exportData = {
      messages: currentConversation?.messages || [],
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSources = (messageId: string) => {
    setExpandedSources(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const formData = new FormData();
      formData.append('file', file);

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
          }, ...prev]);
        } else {
          console.error('Upload failed:', data);
          setUploadedFiles(prev => [{
            id: uuidv4(),
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            success: false,
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
        }, ...prev]);
      }
    }

    setIsUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  const deleteFile = async (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Upload Section */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowUploadArea(!showUploadArea)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Files
            </div>
            <ChevronDown className={`w-4 h-4 transform transition-transform duration-200 ${showUploadArea ? 'rotate-180' : ''}`} />
          </button>

          {showUploadArea && (
            <div className="p-4 animate-slideDown">
              {/* Drag and drop area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  multiple
                />
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Supported formats: PDF, TXT, DOC, DOCX
                </p>
              </div>

              {/* Uploaded files list */}
              <div className="mt-4 space-y-2">
                {isUploading && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Uploading...</span>
                  </div>
                )}
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group animate-slideIn"
                  >
                    <File className={`w-4 h-4 ${file.success ? 'text-green-500' : 'text-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all duration-200"
                      aria-label="Delete file"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                currentConversationId === conv.id ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              onClick={() => setCurrentConversationId(conv.id)}
            >
              <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {conv.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(conv.lastUpdated)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all duration-200"
                aria-label="Delete conversation"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
          <h1 className="text-xl font-bold dark:text-white bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">RAG Chatbot</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle settings"
            >
              <Settings className="w-5 h-5 dark:text-white" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Clear chat"
            >
              <Trash2 className="w-5 h-5 dark:text-white" />
            </button>
            <button
              onClick={handleExportChat}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Export chat"
            >
              <Download className="w-5 h-5 dark:text-white" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="p-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm animate-slideDown">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors duration-200"
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6 dark:bg-gray-900 scroll-smooth">
          {currentConversation?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex animate-fadeIn ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-md transition-all duration-200 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 shadow-md dark:text-white'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <p className="whitespace-pre-wrap flex-grow leading-relaxed">{message.content}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyMessage(message.content);
                    }}
                    className="ml-2 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-all duration-200"
                    aria-label="Copy message"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-xs opacity-70">
                  {formatTimestamp(new Date(message.timestamp))}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSources(message.id);
                      }}
                      className="flex items-center text-xs opacity-70 hover:opacity-100 transition-colors duration-200"
                    >
                      {expandedSources.includes(message.id) ? (
                        <ChevronUp className="w-4 h-4 mr-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mr-1" />
                      )}
                      {message.sources.length} {message.sources.length === 1 ? 'Source' : 'Sources'}
                    </button>
                    {expandedSources.includes(message.id) && (
                      <div className="mt-2 space-y-2 animate-slideDown">
                        {message.sources.map((source) => (
                          <div
                            key={source.chunk_id}
                            className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-lg leading-relaxed"
                          >
                            {source.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="max-w-4xl mx-auto flex items-end space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 