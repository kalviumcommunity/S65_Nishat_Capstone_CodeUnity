import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaCircle } from 'react-icons/fa';
import DOMPurify from 'dompurify';

const ChatBox = ({ socket, roomId, username, onMessageReceived }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }

    // Check initial connection status
    setIsConnected(socket.connected);

    // Listen for connection status changes
    const onConnect = () => {
      setIsConnected(true);
      if (roomId) {
        socket.emit('get-chat-history', { roomId });
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Listen for chat history
    const onChatHistory = (history) => {
      // Sanitize all messages in history
      const sanitizedHistory = (history || []).map(msg => ({
        ...msg,
        text: sanitizeMessage(msg.text || '')
      }));
      setMessages(sanitizedHistory);
      setTimeout(scrollToBottom, 100);
    };

    // Listen for new messages
    const onReceiveMessage = (message) => {
      // Sanitize incoming message
      const sanitizedMessage = {
        ...message,
        text: sanitizeMessage(message.text || '')
      };
      setMessages(prev => [...prev, sanitizedMessage]);
      setTimeout(scrollToBottom, 50);
      onMessageReceived?.();
    };

    // Add event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat-history', onChatHistory);
    socket.on('receive-message', onReceiveMessage);

    // If already connected, request chat history
    if (socket.connected && roomId) {
      socket.emit('get-chat-history', { roomId });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat-history', onChatHistory);
      socket.off('receive-message', onReceiveMessage);
    };
  }, [socket, roomId, username, onMessageReceived]);

  // Sanitize message text to prevent XSS attacks
  const sanitizeMessage = (message) => {
    return DOMPurify.sanitize(message, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) {
      return;
    }

    // Sanitize the message before sending
    const sanitizedText = sanitizeMessage(newMessage.trim());
    
    const messageData = {
      roomId,
      username,
      text: sanitizedText,
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', messageData);
    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm">
      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600/30 scrollbar-track-transparent"
      >
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={`${msg.username}-${msg.timestamp}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex ${
                msg.type === 'system' 
                  ? 'justify-center' 
                  : msg.username === username 
                    ? 'justify-end' 
                    : 'justify-start'
              }`}
            >
              {msg.type === 'system' ? (
                // System message
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-full px-3 py-1">
                  <div className="text-gray-400 text-xs text-center">
                    {msg.text}
                  </div>
                </div>
              ) : (
                // User message
                <div
                  className={`max-w-[75%] group ${
                    msg.username === username ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className={`text-xs text-gray-400 mb-1 px-1 ${
                    msg.username === username ? 'text-right' : 'text-left'
                  }`}>
                    {msg.username === username ? 'You' : msg.username}
                  </div>
                  <div
                    className={`p-3 rounded-2xl backdrop-blur-sm wrap-break-word ${
                      msg.username === username
                        ? 'bg-linear-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 text-white'
                        : 'bg-gray-800/60 border border-gray-700/30 text-gray-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Connection Status */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 py-2"
          >
            <FaCircle className="w-2 h-2 text-red-400 animate-pulse" />
            <span className="text-red-400 text-sm">Reconnecting...</span>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800/30 bg-gradient-to-r from-pink-500/5 to-purple-500/5 p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 min-w-0 bg-black/30 backdrop-blur-sm text-white rounded-lg px-4 py-3 border border-pink-500/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex-shrink-0 ${
              !newMessage.trim() || !isConnected
                ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/20'
            }`}
          >
            <FaPaperPlane className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
