const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  versionKey: false, // Don't include __v field
  collection: 'files' // Explicitly set collection name
});

// Compound index for faster queries and ensuring uniqueness
FileSchema.index({ roomId: 1, fileName: 1 }, { 
  unique: true,
  background: true 
});

// Add instance method to get file info
FileSchema.methods.toFileInfo = function() {
  return {
    fileName: this.fileName,
    content: this.content,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt
  };
};

// Add static method to get files by room
FileSchema.statics.getByRoom = async function(roomId) {
  return this.find({ roomId }).sort({ fileName: 1 });
};

module.exports = mongoose.model('File', FileSchema);
