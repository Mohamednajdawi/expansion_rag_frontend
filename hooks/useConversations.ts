import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types/api';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

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
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      lastUpdated: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    return newConversation.id;
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

  const addMessageToConversation = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        const updatedMessages = [...conv.messages, message];
        // Update title if this is the first message and the message is from the user
        if (conv.messages.length === 0 && message.role === 'user') {
          updateConversationTitle(conv.id, message.content);
        }
        return {
          ...conv,
          messages: updatedMessages,
          lastUpdated: new Date(),
        };
      }
      return conv;
    }));
  };

  const clearConversations = () => {
    if (window.confirm('Are you sure you want to clear all conversations?')) {
      setConversations([]);
      setCurrentConversationId(null);
    }
  };

  const clearCurrentConversation = () => {
    if (window.confirm('Are you sure you want to clear the current conversation?')) {
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [],
            lastUpdated: new Date(),
            title: 'New Chat'
          };
        }
        return conv;
      }));
    }
  };

  const currentConversation = conversations.find(conv => conv.id === currentConversationId);

  return {
    conversations,
    currentConversationId,
    currentConversation,
    setCurrentConversationId,
    createNewConversation,
    deleteConversation,
    addMessageToConversation,
    clearConversations,
    clearCurrentConversation
  };
} 