const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  email: {
    type: String,
    sparse: true, // Allow null/undefined for users who haven't linked accounts
    lowercase: true,
    trim: true
  },
  // OAuth provider data (optional)
  oauth: {
    google: {
      id: String,
      email: String,
      name: String,
      picture: String
    },
    github: {
      id: String,
      username: String,
      email: String,
      avatar_url: String
    },
    discord: {
      id: String,
      username: String,
      email: String,
      avatar: String
    }
  },
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light', 'auto'],
      default: 'dark'
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true }
    }
  },
  // Room history for authenticated users
  roomHistory: [{
    roomId: String,
    roomName: String,
    lastAccessed: { type: Date, default: Date.now },
    role: { type: String, enum: ['creator', 'participant'], default: 'participant' }
  }],
  // Usage tracking for pricing
  usage: {
    roomsCreated: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now }
  },
  // Subscription info (for future pricing features)
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'team', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled'],
      default: 'active'
    },
    expiresAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ 'oauth.google.id': 1 });
UserSchema.index({ 'oauth.github.id': 1 });
UserSchema.index({ 'oauth.discord.id': 1 });

// Instance methods
UserSchema.methods.addRoomToHistory = function(roomId, roomName, role = 'participant') {
  const existingRoom = this.roomHistory.find(r => r.roomId === roomId);
  if (existingRoom) {
    existingRoom.lastAccessed = new Date();
    existingRoom.role = role;
  } else {
    this.roomHistory.unshift({ roomId, roomName, role });
    // Keep only last 50 rooms
    if (this.roomHistory.length > 50) {
      this.roomHistory = this.roomHistory.slice(0, 50);
    }
  }
  this.usage.totalSessions += 1;
  this.usage.lastActiveAt = new Date();
  return this.save();
};

UserSchema.methods.linkOAuthProvider = function(provider, data) {
  if (!this.oauth) this.oauth = {};
  this.oauth[provider] = data;
  if (data.email && !this.email) {
    this.email = data.email;
  }
  return this.save();
};

UserSchema.methods.canCreateRoom = function() {
  // Free tier limits
  if (this.subscription.tier === 'free') {
    return this.usage.roomsCreated < 10; // Free users can create 10 rooms
  }
  return true; // Paid users have unlimited rooms
};

UserSchema.methods.getDisplayInfo = function() {
  return {
    username: this.username,
    email: this.email,
    subscription: this.subscription.tier,
    avatar: this.oauth?.google?.picture || 
            this.oauth?.github?.avatar_url || 
            this.oauth?.discord?.avatar || 
            null
  };
};

// Static methods
UserSchema.statics.findByOAuth = function(provider, id) {
  const query = {};
  query[`oauth.${provider}.id`] = id;
  return this.findOne(query);
};

UserSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

module.exports = mongoose.model('User', UserSchema);
