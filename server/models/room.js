const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: String,
    required: true, // Username of room creator
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    maxUsers: {
      type: Number,
      default: 50
    },
    allowInvites: {
      type: Boolean,
      default: true // Only current participants can invite
    }
  },
  participants: [{
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  inviteHistory: [{
    invitedBy: String,
    invitedEmail: String,
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  collection: 'rooms'
});

RoomSchema.index({ createdBy: 1 });
RoomSchema.index({ 'participants.username': 1 });

// Instance methods
RoomSchema.methods.addParticipant = function(username) {
  const existingParticipant = this.participants.find(p => p.username === username);
  if (!existingParticipant) {
    this.participants.push({ username, isActive: true });
  } else {
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
  }
  return this.save();
};

RoomSchema.methods.removeParticipant = function(username) {
  const participant = this.participants.find(p => p.username === username);
  if (participant) {
    participant.isActive = false;
  }
  return this.save();
};

RoomSchema.methods.isParticipant = function(username) {
  return this.participants.some(p => p.username === username && p.isActive);
};

RoomSchema.methods.canInvite = function(username) {
  // Only active participants can invite others
  return this.isParticipant(username) && this.settings.allowInvites;
};

RoomSchema.methods.addInvite = function(invitedBy, invitedEmail) {
  this.inviteHistory.push({ invitedBy, invitedEmail });
  return this.save();
};

// Static methods
RoomSchema.statics.findByRoomId = function(roomId) {
  return this.findOne({ roomId });
};

RoomSchema.statics.createRoom = function(roomId, createdBy, settings = {}) {
  const defaultSettings = {
    isPrivate: false,
    maxUsers: 50,
    allowInvites: true
  };
  
  return this.create({
    roomId,
    createdBy,
    settings: { ...defaultSettings, ...settings },
    participants: [{ username: createdBy, isActive: true }]
  });
};

module.exports = mongoose.model('Room', RoomSchema);
