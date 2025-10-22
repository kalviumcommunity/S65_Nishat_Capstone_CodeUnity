const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  // Keep existing roomId string for backwards compatibility
  roomId: {
    type: String,
    required: true
  },
  // New reference to Room document
  roomRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false,
    index: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  // Keep owner as string (username) for backwards compatibility
  owner: {
    type: String,
    required: false
  },
  // New reference to User
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
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
// Pre-save hook to populate refs if possible without breaking existing behavior
FileSchema.pre('save', async function(next) {
  try {
    // Populate roomRef if not set
    if (!this.roomRef && this.roomId) {
      const Room = require('./room');
      const room = await Room.findOne({ roomId: this.roomId });
      if (room) this.roomRef = room._id;
    }

    // Populate ownerId if owner string is present
    if (!this.ownerId && this.owner) {
      const User = require('./user');
      const user = await User.findOne({ username: this.owner });
      if (user) this.ownerId = user._id;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('File', FileSchema);
