const express = require('express');
const router = express.Router();
const AiChat = require('../models/aiChat');

// Get chat history for a room/session
router.get('/history/:roomId/:sessionId', async (req, res) => {
  try {
    const { roomId, sessionId } = req.params;
    const { userId } = req.query;
    
    const chat = await AiChat.getChatHistory(roomId, sessionId, userId);
    
    if (!chat) {
      return res.json({
        success: true,
        messages: [],
        message: 'No chat history found'
      });
    }
    
    res.json({
      success: true,
      messages: chat.messages || [],
      lastActivity: chat.lastActivity,
      message: 'Chat history retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history',
      error: error.message
    });
  }
});

// Save a chat message
router.post('/save-message', async (req, res) => {
  try {
    const { roomId, sessionId, message, userId } = req.body;
    
    if (!roomId || !sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: 'roomId, sessionId, and message are required'
      });
    }
    
    // Validate message structure
    if (!message.type || !message.content) {
      return res.status(400).json({
        success: false,
        message: 'Message must have type and content'
      });
    }
    
    // Add timestamp and ID if not provided
    const messageToSave = {
      ...message,
      id: message.id || Date.now().toString(),
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
    };
    
    const updatedChat = await AiChat.saveMessage(roomId, sessionId, messageToSave, userId);
    
    res.json({
      success: true,
      message: 'Message saved successfully',
      chatId: updatedChat._id,
      messageCount: updatedChat.messages.length
    });
    
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save chat message',
      error: error.message
    });
  }
});

// Save multiple messages (bulk save)
router.post('/save-messages', async (req, res) => {
  try {
    const { roomId, sessionId, messages, userId } = req.body;
    
    if (!roomId || !sessionId || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'roomId, sessionId, and messages array are required'
      });
    }
    
    if (messages.length === 0) {
      return res.json({
        success: true,
        message: 'No messages to save'
      });
    }
    
    // Process messages to ensure they have required fields
    const messagesToSave = messages.map(message => ({
      ...message,
      id: message.id || Date.now().toString() + Math.random(),
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
    }));
    
    // Get existing chat or create new one
    let chat = await AiChat.getChatHistory(roomId, sessionId, userId);
    
    if (!chat) {
      chat = new AiChat({
        roomId,
        sessionId,
        userId,
        messages: messagesToSave
      });
    } else {
      // Replace all messages with the new set
      chat.messages = messagesToSave;
    }
    
    // Keep only the last 100 messages
    if (chat.messages.length > 100) {
      chat.messages = chat.messages.slice(-100);
    }
    
    const savedChat = await chat.save();
    
    res.json({
      success: true,
      message: 'Messages saved successfully',
      chatId: savedChat._id,
      messageCount: savedChat.messages.length
    });
    
  } catch (error) {
    console.error('Error saving chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save chat messages',
      error: error.message
    });
  }
});

// Clear chat history for a room/session
router.delete('/clear/:roomId/:sessionId', async (req, res) => {
  try {
    const { roomId, sessionId } = req.params;
    const { userId } = req.query;
    
    const query = { roomId, sessionId };
    if (userId) {
      query.userId = userId;
    }
    
    const result = await AiChat.deleteOne(query);
    
    res.json({
      success: true,
      message: 'Chat history cleared successfully',
      deleted: result.deletedCount > 0
    });
    
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
});

// Get chat statistics for a room
router.get('/stats/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const stats = await AiChat.aggregate([
      { $match: { roomId } },
      {
        $group: {
          _id: '$roomId',
          totalChats: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          lastActivity: { $max: '$lastActivity' }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalChats: 0,
          totalMessages: 0,
          lastActivity: null
        }
      });
    }
    
    res.json({
      success: true,
      stats: stats[0]
    });
    
  } catch (error) {
    console.error('Error getting chat stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat statistics',
      error: error.message
    });
  }
});

// Cleanup old chats (admin endpoint)
router.post('/cleanup', async (req, res) => {
  try {
    const result = await AiChat.cleanupOldChats();
    
    res.json({
      success: true,
      message: 'Old chats cleaned up successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error cleaning up old chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old chats',
      error: error.message
    });
  }
});

module.exports = router;
