const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: false, // Anonymous users can also have chats
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    id: String,
    type: {
      type: String,
      enum: ['user', 'ai', 'question', 'answer', 'explanation', 'debug', 'completion', 'conversion', 'help', 'error'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    aiService: String, // 'openai', 'huggingface', 'intelligent-fallback'
    code: String, // Optional code context
    fileName: String // Optional file context
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
aiChatSchema.index({ roomId: 1, sessionId: 1 });
aiChatSchema.index({ roomId: 1, userId: 1 });
aiChatSchema.index({ lastActivity: 1 }); // For cleanup of old chats

// Update lastActivity on save
aiChatSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Static method to cleanup old chats (older than 30 days)
aiChatSchema.statics.cleanupOldChats = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({ lastActivity: { $lt: thirtyDaysAgo } });
};

// Static method to get chat history for a room/session
aiChatSchema.statics.getChatHistory = function(roomId, sessionId, userId = null) {
  const query = { roomId, sessionId };
  if (userId) {
    query.userId = userId;
  }
  return this.findOne(query);
};

// Static method to save chat message
aiChatSchema.statics.saveMessage = async function(roomId, sessionId, message, userId = null) {
  const query = { roomId, sessionId };
  if (userId) {
    query.userId = userId;
  }
  
  let chat = await this.findOne(query);
  
  if (!chat) {
    chat = new this({
      roomId,
      sessionId,
      userId,
      messages: []
    });
  }
  
  // Add the new message
  chat.messages.push(message);
  
  // Keep only the last 100 messages to prevent the document from getting too large
  if (chat.messages.length > 100) {
    chat.messages = chat.messages.slice(-100);
  }
  
  return await chat.save();
};

module.exports = mongoose.model('AiChat', aiChatSchema);
