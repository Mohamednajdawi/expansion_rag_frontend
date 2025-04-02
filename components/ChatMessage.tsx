'use client';

import { useState } from 'react';
import { Message, ChunkResponse } from '../types/api';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';

interface ChatMessageProps {
  message: Message;
  onCopy: (content: string) => void;
}

export default function ChatMessage({ message, onCopy }: ChatMessageProps) {
  const [expandedSources, setExpandedSources] = useState(false);
  const [expandedQueries, setExpandedQueries] = useState(false);

  const toggleSources = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSources(!expandedSources);
  };

  const toggleExpandedQueries = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedQueries(!expandedQueries);
  };

  return (
    <div
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
              onCopy(message.content);
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
        
        {/* Sources Section */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200/20 dark:border-gray-700/50">
            <button
              onClick={toggleSources}
              className="flex items-center text-xs opacity-70 hover:opacity-100 transition-colors duration-200"
            >
              {expandedSources ? (
                <ChevronUp className="w-4 h-4 mr-1" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-1" />
              )}
              {message.sources.length} {message.sources.length === 1 ? 'Source' : 'Sources'}
            </button>
            {expandedSources && (
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
        
        {/* Expanded Queries Section */}
        {message.expanded_queries && message.expanded_queries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200/20 dark:border-gray-700/50">
            <button
              onClick={toggleExpandedQueries}
              className="flex items-center text-xs opacity-70 hover:opacity-100 transition-colors duration-200"
            >
              {expandedQueries ? (
                <ChevronUp className="w-4 h-4 mr-1" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-1" />
              )}
              {message.expanded_queries.length} Expanded {message.expanded_queries.length === 1 ? 'Query' : 'Queries'}
            </button>
            {expandedQueries && (
              <div className="mt-2 space-y-2 animate-slideDown">
                {message.expanded_queries.map((query, index) => (
                  <div
                    key={`query-${index}`}
                    className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-lg leading-relaxed italic"
                  >
                    "{query}"
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 