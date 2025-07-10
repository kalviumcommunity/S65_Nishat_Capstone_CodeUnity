import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env.PROD 
  ? 'https://s65-nishat-capstone-codeunity-swbt.onrender.com'
  : 'http://localhost:8080';

// Generate a unique session ID for the current browser session
const generateSessionId = () => {
  const stored = sessionStorage.getItem('codeunity_session_id');
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('codeunity_session_id', newId);
  return newId;
};

export const useChatPersistence = (roomId, userId = null) => {
  const [sessionId] = useState(() => generateSessionId());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load chat history from database
  const loadChatHistory = useCallback(async () => {
    if (!roomId) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      
      const response = await fetch(
        `${BACKEND_URL}/api/ai-chat/history/${roomId}/${sessionId}?${params}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.messages || [];
      } else {
        throw new Error(data.message || 'Failed to load chat history');
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError(err.message);
      
      // Fallback to localStorage if database fails
      try {
        const savedChats = localStorage.getItem('codeunity_ai_chat_history');
        return savedChats ? JSON.parse(savedChats) : [];
      } catch (localErr) {
        console.error('Fallback localStorage also failed:', localErr);
        return [];
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId, sessionId, userId]);

  // Save a single message to database
  const saveMessage = useCallback(async (message) => {
    if (!roomId) return false;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-chat/save-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          sessionId,
          message,
          userId
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save message');
      }
      
      return true;
    } catch (err) {
      console.error('Error saving message:', err);
      setError(err.message);
      
      // Fallback to localStorage if database fails
      try {
        const existing = localStorage.getItem('codeunity_ai_chat_history');
        const messages = existing ? JSON.parse(existing) : [];
        messages.push(message);
        
        // Keep only last 100 messages
        const limitedMessages = messages.slice(-100);
        localStorage.setItem('codeunity_ai_chat_history', JSON.stringify(limitedMessages));
        return true;
      } catch (localErr) {
        console.error('Fallback localStorage save failed:', localErr);
        return false;
      }
    }
  }, [roomId, sessionId, userId]);

  // Save multiple messages to database (bulk save)
  const saveMessages = useCallback(async (messages) => {
    if (!roomId || !Array.isArray(messages)) return false;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-chat/save-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          sessionId,
          messages,
          userId
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save messages');
      }
      
      return true;
    } catch (err) {
      console.error('Error saving messages:', err);
      setError(err.message);
      
      // Fallback to localStorage if database fails
      try {
        localStorage.setItem('codeunity_ai_chat_history', JSON.stringify(messages.slice(-100)));
        return true;
      } catch (localErr) {
        console.error('Fallback localStorage save failed:', localErr);
        return false;
      }
    }
  }, [roomId, sessionId, userId]);

  // Clear chat history from database
  const clearChatHistory = useCallback(async () => {
    if (!roomId) return false;
    
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      
      const response = await fetch(
        `${BACKEND_URL}/api/ai-chat/clear/${roomId}/${sessionId}?${params}`, 
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to clear chat history');
      }
      
      // Also clear localStorage
      localStorage.removeItem('codeunity_ai_chat_history');
      
      return true;
    } catch (err) {
      console.error('Error clearing chat history:', err);
      setError(err.message);
      
      // At least clear localStorage
      localStorage.removeItem('codeunity_ai_chat_history');
      return false;
    }
  }, [roomId, sessionId, userId]);

  // Auto-sync with localStorage as backup
  const syncToLocalStorage = useCallback((messages) => {
    try {
      const limitedMessages = messages.slice(-100);
      localStorage.setItem('codeunity_ai_chat_history', JSON.stringify(limitedMessages));
    } catch (err) {
      console.error('Failed to sync to localStorage:', err);
    }
  }, []);

  return {
    sessionId,
    isLoading,
    error,
    loadChatHistory,
    saveMessage,
    saveMessages,
    clearChatHistory,
    syncToLocalStorage
  };
};
