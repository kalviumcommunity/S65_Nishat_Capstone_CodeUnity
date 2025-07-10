import React, { useState, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaSpinner, FaBug, FaCode, FaMagic, FaDownload, FaCopy, FaTrash, FaFileExport } from 'react-icons/fa';
import axios from 'axios';
import { useChatPersistence } from '../../hooks/useChatPersistence';

const BACKEND_URL = import.meta.env.PROD 
  ? 'https://s65-nishat-capstone-codeunity-swbt.onrender.com'
  : 'http://localhost:8080';

// Maximum number of chat messages to store (to prevent localStorage from getting too large)
const MAX_CHAT_HISTORY = 100;

const CopilotPanel = ({ currentFile, code, onCodeInsert, roomId }) => {
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  
  // Get chat persistence hooks
  const {
    loadChatHistory,
    saveMessage,
    saveMessages,
    syncToLocalStorage
  } = useChatPersistence(roomId);
  
  // Check AI service status on mount and load saved chats
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/ai/status`);
        setAiStatus(response.data);
      } catch (error) {
        console.error('Failed to check AI status:', error);
      }
    };
    
    // Load saved AI chat history from database
    const loadSavedChats = async () => {
      if (!roomId) {
        // Fallback to localStorage if no roomId
        try {
          const savedChats = localStorage.getItem('codeunity_ai_chat_history');
          if (savedChats) {
            const parsedChats = JSON.parse(savedChats);
            setResponses(parsedChats);
          }
        } catch (error) {
          console.error('Failed to load saved AI chats from localStorage:', error);
        }
        return;
      }
      
      try {
        const messages = await loadChatHistory();
        setResponses(messages || []);
      } catch (error) {
        console.error('Failed to load saved AI chats from database:', error);
        
        // Fallback to localStorage
        try {
          const savedChats = localStorage.getItem('codeunity_ai_chat_history');
          if (savedChats) {
            const parsedChats = JSON.parse(savedChats);
            setResponses(parsedChats);
          }
        } catch (localError) {
          console.error('Failed to load from localStorage fallback:', localError);
        }
      }
    };
    
    checkAIStatus();
    loadSavedChats();
  }, [roomId, loadChatHistory]);

  // Save chat history whenever responses change
  useEffect(() => {
    if (responses.length === 0) return;
    
    const saveToDatabase = async () => {
      if (roomId) {
        try {
          await saveMessages(responses);
        } catch (error) {
          console.error('Failed to save to database, using localStorage fallback:', error);
        }
      }
      
      // Always sync to localStorage as backup
      syncToLocalStorage(responses);
    };
    
    saveToDatabase();
  }, [responses, roomId, saveMessages, syncToLocalStorage]);
  
  // Extract code blocks from AI response
  const extractCodeBlocks = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const matches = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      matches.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }
    
    return matches;
  };
  
  // Copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };
  
  // Insert code into editor
  const insertCode = (codeToInsert) => {
    if (onCodeInsert && typeof onCodeInsert === 'function') {
      onCodeInsert(codeToInsert);
    }
  };

  // Helper function to add a new response and manage chat history limits
  const addResponse = async (newResponse) => {
    const responseWithId = {
      ...newResponse,
      id: newResponse.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: newResponse.timestamp || new Date().toISOString()
    };
    
    setResponses(prev => {
      const updated = [...prev, responseWithId];
      // Keep only the latest messages if we exceed the limit
      return updated.length > MAX_CHAT_HISTORY ? updated.slice(-MAX_CHAT_HISTORY) : updated;
    });
    
    // Save to database immediately if we have a roomId
    if (roomId) {
      try {
        await saveMessage(responseWithId);
      } catch (error) {
        console.error('Failed to save message to database:', error);
        // The message is still added to local state and localStorage via useEffect
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userPrompt = prompt.trim();
    setPrompt('');
    setIsLoading(true);

    // Add user's question to responses
    await addResponse({
      type: 'question',
      content: userPrompt,
      timestamp: new Date().toISOString()
    });

    try {
      // Check for special commands
      if (userPrompt.startsWith('/')) {
        await handleCommand(userPrompt);
      } else {
        await handleGeneralQuery(userPrompt);
      }
    } catch (error) {
      await addResponse({
        type: 'error',
        content: `Error: ${error.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommand = async (command) => {
    const cmd = command.toLowerCase();
    
    // Handle convert command
    if (cmd.startsWith('/convert ')) {
      const targetLanguage = cmd.split(' ')[1];
      if (!targetLanguage) {
        await addResponse({
          type: 'error',
          content: 'Please specify a target language. Example: /convert python',
          timestamp: new Date().toISOString()
        });
        return;
      }
      await convertCode(targetLanguage);
      return;
    }

    // If command not recognized
    await addResponse({
      type: 'error',
      content: `Unknown command: ${command}. Try asking questions directly instead.`,
      timestamp: new Date().toISOString()
    });
  };

  const handleGeneralQuery = async (query) => {
    console.log('Making AI request:', { query, code, currentFile }); // Debug log
    
    const response = await axios.post(`${BACKEND_URL}/api/ai/chat`, {
      prompt: query,
      code: code,
      fileName: currentFile,
      context: 'CodeUnity Editor'
    });

    console.log('AI Response:', response.data); // Debug log

    if (response.data.success) {
      await addResponse({
        type: 'answer',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        aiService: response.data.aiService,
        serviceMessage: response.data.serviceMessage
      });
    } else {
      throw new Error(response.data.message || 'AI service error');
    }
  };

  const convertCode = async (targetLanguage) => {
    const response = await axios.post(`${BACKEND_URL}/api/ai/chat`, {
      prompt: `Convert this code to ${targetLanguage}`,
      code: code,
      fileName: currentFile,
      context: `Code conversion to ${targetLanguage}`
    });

    if (response.data.success) {
      await addResponse({
        type: 'conversion',
        content: response.data.response,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(response.data.message || 'Code conversion service error');
    }
  };

  const getResponseIcon = (type) => {
    switch (type) {
      case 'question': return <FaRobot className="text-pink-400" size={16} />;
      case 'answer': return <FaMagic className="text-purple-400" size={16} />;
      case 'conversion': return <FaCode className="text-cyan-400" size={16} />;
      case 'error': return <FaBug className="text-red-400" size={16} />;
      default: return <FaRobot className="text-pink-400" size={16} />;
    }
  };

  const getResponseStyle = (type) => {
    switch (type) {
      case 'question': 
        return 'bg-pink-500/10 border-pink-500/20';
      case 'answer':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'conversion':
        return 'bg-cyan-500/10 border-cyan-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-purple-500/10 border-purple-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* AI Status Info Panel */}
      {aiStatus && aiStatus.currentService === 'fallback' && (
        <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b border-orange-400/20">
          <div className="text-xs space-y-2">
            <div className="font-medium text-orange-300">🔥 Upgrade Your AI Experience!</div>
            <div className="text-orange-200/80">
              <div>• <strong>Free:</strong> brew install ollama && ollama run codellama</div>
              <div>• <strong>Premium:</strong> Add OpenAI API key for best results</div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-w-0">
        {responses.length === 0 && (
          <div className="text-center text-gray-400 space-y-3 mt-8">
            <FaRobot size={32} className="mx-auto text-pink-400/30" />
            <p className="text-sm text-gray-300">Start a conversation with AI Assistant</p>
            <p className="text-xs text-gray-500">Ask questions about your code or request programming help</p>
          </div>
        )}
        
        {responses.map((item, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-xl border transition-all duration-200 ${getResponseStyle(item.type)}`}
          >
            <div className="flex items-start gap-2 mb-2">
              {getResponseIcon(item.type)}
              <span className="text-xs text-gray-300 capitalize font-medium">
                {item.type === 'question' ? 'You' : item.type}
              </span>
              {item.aiService && (
                <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-400/20">
                  {item.aiService === 'openai' ? '🤖 OpenAI' : item.aiService === 'ollama' ? '🆓 Ollama' : '⚡ Pattern'}
                </span>
              )}
              <span className="text-xs text-gray-500 ml-auto">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap break-words overflow-hidden leading-relaxed text-gray-100">
              {item.content}
            </div>
            
            {/* Action buttons for code responses */}
            {item.type !== 'question' && item.content && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => copyToClipboard(item.content)}
                  className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-400/20 transition-all duration-200 flex items-center gap-1"
                >
                  <FaCopy size={10} />
                  Copy
                </button>
                
                {/* Show insert button if there are code blocks and onCodeInsert is available */}
                {onCodeInsert && extractCodeBlocks(item.content).length > 0 && (
                  <button
                    onClick={() => {
                      const codeBlocks = extractCodeBlocks(item.content);
                      if (codeBlocks.length > 0) {
                        insertCode(codeBlocks[0].code);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-400/20 transition-all duration-200 flex items-center gap-1"
                  >
                    <FaDownload size={10} />
                    Insert
                  </button>
                )}
                
                {/* Insert raw response for completion type */}
                {onCodeInsert && (item.type === 'completion' || item.type === 'conversion') && (
                  <button
                    onClick={() => insertCode(item.content)}
                    className="px-2 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-400/20 transition-all duration-200 flex items-center gap-1"
                  >
                    <FaDownload size={10} />
                    Insert Code
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="bg-pink-500/10 border border-pink-500/20 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FaSpinner className="text-pink-400 animate-spin" size={16} />
              <span className="text-xs text-gray-300 font-medium">AI Assistant</span>
            </div>
            <div className="text-sm text-gray-200">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-800/30 bg-gradient-to-r from-pink-500/5 to-purple-500/5 space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-3 min-w-0">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={currentFile ? `Ask about ${currentFile}...` : "Ask questions about your code..."}
            className="flex-1 min-w-0 bg-black/30 backdrop-blur-sm text-white rounded-lg px-4 py-3 border border-pink-500/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 placeholder-gray-400 transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={`px-5 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium ${
              !prompt.trim() || isLoading
                ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed border border-gray-600/30'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20 border border-pink-500/30'
            }`}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" size={14} />
            ) : (
              <FaPaperPlane size={14} />
            )}
            <span className="hidden sm:inline">
              {isLoading ? 'Sending...' : 'Send'}
            </span>
          </button>
        </form>
        
        <p className="text-xs text-gray-500 break-words flex items-center gap-2">
          <span>💡</span>
          <span>Ask questions about your code, request help, or try commands like "/convert python"</span>
        </p>
      </div>
    </div>
  );
};

export default CopilotPanel;