const mongoose = require('mongoose');

const tldrawStateSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  state: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    // FIXED: Proper default TlDraw state structure
    default: function() {
      return {
        store: {},
        schema: {
          schemaVersion: 1,
          storeVersion: 4,
          recordVersions: {
            asset: 1,
            camera: 1,
            document: 1,
            instance: 1,
            instance_page_state: 1,
            page: 1,
            shape: 4,
            instance_presence: 1,
            pointer: 1
          }
        }
      };
    }
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  userCount: {
    type: Number,
    default: 0
  },
  stateVersion: {
    type: Number,
    default: 1
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Add immediate tracking fields
  lastChangeTimestamp: {
    type: Number,
    default: Date.now
  },
  changeCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'tldrawstates',
  // Optimize for immediate writes
  writeConcern: {
    w: 1,
    j: true,
    wtimeout: 1000
  }
});

// Add indexes for better performance
tldrawStateSchema.index({ roomId: 1 });
tldrawStateSchema.index({ lastUpdate: -1 });
tldrawStateSchema.index({ lastChangeTimestamp: -1 });
tldrawStateSchema.index({ isActive: 1 });

// Clean up old states (optional) - increased to 30 days for better persistence
tldrawStateSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Pre-save middleware to update change tracking
tldrawStateSchema.pre('save', function(next) {
  this.lastChangeTimestamp = Date.now();
  this.changeCount = (this.changeCount || 0) + 1;
  next();
});

tldrawStateSchema.pre('findOneAndUpdate', function(next) {
  this.set({ 
    lastChangeTimestamp: Date.now(),
    $inc: { changeCount: 1 }
  });
  next();
});

module.exports = mongoose.model('TldrawState', tldrawStateSchema);
