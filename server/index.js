const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const File = require('./models/file');
const TldrawState = require('./models/tldrawState'); // Add this import
require('dotenv').config();
const fileRoutes = require('./routes/files.js');
const aiRoutes = require('./routes/ai-gemini.js'); // Gemini-only AI router
const aiChatRoutes = require('./routes/aiChat.js'); // AI chat persistence routes
const emailRoutes = require('./routes/email.js'); // Email routes

// Connect to MongoDB with enhanced production configuration
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

console.log('🔄 Attempting to connect to MongoDB...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');

// Disable global buffering at the mongoose level - CRITICAL for production
mongoose.set('bufferCommands', false);

// Enhanced MongoDB connection options for production stability  
const mongooseOptions = {
  // Connection timeouts
  serverSelectionTimeoutMS: 60000, // 60 seconds for server selection
  connectTimeoutMS: 60000, // 60 seconds for initial connection
  socketTimeoutMS: 60000, // 60 seconds for socket operations
  
  // Mongoose-specific buffering configuration
  bufferCommands: false, // Disable mongoose buffering
  
  // Connection pool settings
  maxPoolSize: 10, // Maximum number of connections
  minPoolSize: 1, // Minimum number of connections (reduce for serverless)
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  
  // Reliability settings
  retryWrites: true, // Enable retryable writes
  retryReads: true, // Enable retryable reads
  w: 'majority', // Write concern
  
  // Heartbeat settings
  heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds
  
  // Additional serverless optimizations
  maxConnecting: 2, // Limit concurrent connections
  family: 4 // Use IPv4
};

mongoose
  .connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('📡 Database connection is ready for requests');
    console.log(`🔗 Connection state: ${mongoose.connection.readyState}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('� Full error:', err);
    console.error('🔄 Application will exit and restart...');
    setTimeout(() => {
      process.exit(1); // Exit and let the platform restart the service
    }, 3000);
  });

// Handle connection events with enhanced logging
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
  console.log(`📊 Connection state: ${mongoose.connection.readyState}`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
  console.error('🔍 Error type:', err.name);
  console.error('📊 Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
  console.log('📊 Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
  console.log('📊 Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('timeout', () => {
  console.log('⏰ MongoDB connection timeout');
});

mongoose.connection.on('close', () => {
  console.log('🚪 MongoDB connection closed');
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: [
      'https://cu-sandy.vercel.app',
      'https://cuni.vercel.app',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  // Test database connectivity
  let dbTest = null;
  try {
    if (mongoStatus === 1) {
      // Simple ping to test actual connectivity
      await mongoose.connection.db.admin().ping();
      dbTest = 'success';
    } else {
      dbTest = 'not_connected';
    }
  } catch (error) {
    dbTest = `error: ${error.message}`;
  }
  
  const healthData = {
    status: mongoStatus === 1 ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    mongodb: {
      status: statusMap[mongoStatus] || 'unknown',
      readyState: mongoStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      test: dbTest
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    }
  };
  
  const httpStatus = mongoStatus === 1 ? 200 : 503;
  res.status(httpStatus).json(healthData);
});

// Debug endpoint that works even when MongoDB is down
app.get('/debug', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      mongodb_uri_exists: !!process.env.MONGODB_URI,
      mongodb_uri_preview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@').substring(0, 80) + '...' : 
        'NOT_SET'
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    mongoose: {
      version: mongoose.version,
      connection_state: mongoStatus,
      connection_status: statusMap[mongoStatus] || 'unknown',
      host: mongoose.connection.host || 'not_connected',
      name: mongoose.connection.name || 'not_connected'
    }
  };

  res.json(debugInfo);
});

// Database connection status endpoint
app.get('/db-status', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    if (mongoStatus !== 1) {
      return res.status(503).json({
        connected: false,
        readyState: mongoStatus,
        message: 'Database not connected'
      });
    }
    
    // Test with a simple operation
    await mongoose.connection.db.admin().ping();
    
    res.json({
      connected: true,
      readyState: mongoStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      message: 'Database is connected and responsive'
    });
  } catch (error) {
    res.status(503).json({
      connected: false,
      error: error.message,
      message: 'Database connection test failed'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CodeUnity API Server',
    status: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/email', emailRoutes);

const io = new Server(server, {
  cors: {
    origin: [
      'https://cu-sandy.vercel.app',
      'https://cuni.vercel.app',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  path: '/socket.io/',
  transports: ['polling', 'websocket'],
  pingTimeout: 30000,
  pingInterval: 10000,
  upgradeTimeout: 15000,
  allowUpgrades: true,
  cookie: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// Track active rooms and their file lists
const usersInRoom = {};
const rooms = new Map();
const roomFiles = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async (data) => {
    // Handle both formats: string roomId or object with roomId
    const roomId = typeof data === 'string' ? data : data.roomId;
    const username = typeof data === 'object' ? data.username : `User-${socket.id.slice(0, 4)}`;
    const isTldrawConnection = typeof data === 'object' ? data.isTldrawConnection : false;
    
    // FIXED: Prevent duplicate joins
    if (socket.roomId === roomId) {
      console.log('🔄 User already in room:', roomId);
      return;
    }
    
    console.log(`🚪 Join room: ${roomId} by ${username} (${socket.id}) ${isTldrawConnection ? '[TlDraw]' : '[Main]'}`);
    
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;
    socket.isTldrawConnection = isTldrawConnection;

    if (!usersInRoom[roomId]) {
      usersInRoom[roomId] = [];
    }

    // FIXED: Only add main connections to user list, not TlDraw connections
    if (!isTldrawConnection) {
      const existingUser = usersInRoom[roomId].find(u => u.socketId === socket.id);
      if (!existingUser) {
        usersInRoom[roomId].push({ socketId: socket.id, username });
      }
    }

    // MongoDB-based TlDraw room handling
    try {
      let tldrawState = await TldrawState.findOne({ roomId });
      
      if (!tldrawState) {
        // FIXED: Better default TlDraw state
        const emptyTldrawState = {
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

        tldrawState = new TldrawState({
          roomId,
          state: emptyTldrawState,
          userCount: usersInRoom[roomId].length,
          stateVersion: 1
        });
        await tldrawState.save();
        console.log(`✅ TlDraw room created in DB: ${roomId}`);
      }

      // FIXED: Send initial state to all connections, but only send user list to main connections
      console.log('📤 Sending initial TlDraw state');
      socket.emit('init-state', tldrawState.state);

      // Only send user list to main connections
      if (!isTldrawConnection) {
        const usersList = usersInRoom[roomId].map(u => u.socketId);
        socket.emit('users-list', usersList);
        socket.to(roomId).emit('users-list', usersList);
      }

    } catch (error) {
      console.error('❌ Error handling room join:', error);
      // Send empty state on error
      socket.emit('init-state', {
        store: {},
        schema: {
          schemaVersion: 1,
          storeVersion: 4,
          recordVersions: {}
        }
      });
    }

    // Send existing messages and file list to the joining user (only for main connections)
    if (!isTldrawConnection) {
    const roomMessages = rooms.get(roomId) || [];
    socket.emit('chat-history', roomMessages);

    // Get latest file list from database and broadcast
    try {
      const files = await File.find({ roomId });
      const fileList = files.map((f) => ({
        fileName: f.fileName,
        content: f.content,
        updatedAt: f.updatedAt,
      }));

      // Store current file list in memory
      roomFiles.set(roomId, fileList);

      // Send to all clients in room
      io.to(roomId).emit('files-list-updated', { files: fileList });
    } catch (error) {
      console.error('Error getting files for room:', error);
    }

    // Notify other users that someone joined (not the user who joined)
    socket.to(roomId).emit('user-joined', { username });
    
    // Add system message to chat about user joining
    const joinMessage = {
      type: 'system',
      username: 'System',
      text: `${username} joined the room`,
      timestamp: new Date().toISOString(),
      roomId
    };
    
    // Save system message to room history
    if (!rooms.has(roomId)) {
      rooms.set(roomId, []);
    }
    rooms.get(roomId).push(joinMessage);
    
    // Broadcast join message to all users in room (including the one who joined)
    io.to(roomId).emit('receive-message', joinMessage);
    
    // Update user list for all users in room
    io.to(roomId).emit('update-user-list', usersInRoom[roomId]);
    }
  });

  // FIXED: Improved update handling with better error recovery
  socket.on('update', async (data) => {
    const roomId = data.roomId || socket.roomId;
    
    if (!roomId || !data.state) {
      console.log('❌ TlDraw update ignored - missing roomId or state');
      return;
    }

    console.log('📥 Received TlDraw update for room:', roomId, 'from:', socket.id);

    try {
      // FIXED: Better state validation
      if (!data.state.store || typeof data.state.store !== 'object') {
        console.log('❌ Invalid TlDraw state structure:', typeof data.state.store);
        return;
      }

      // Update state in MongoDB with retry logic
      let retries = 3;
      let result = null;
      
      while (retries > 0 && !result) {
        try {
          result = await TldrawState.findOneAndUpdate(
            { roomId },
            {
              state: data.state,
              lastUpdate: new Date(),
              $inc: { stateVersion: 1 }
            },
            { 
              new: true, 
              upsert: true,
              runValidators: true,
              maxTimeMS: 5000 // 5 second timeout
            }
          );
          break;
        } catch (retryError) {
          retries--;
          console.log(`❌ TlDraw update retry ${3-retries}/3:`, retryError.message);
          if (retries === 0) throw retryError;
          await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
        }
      }

      if (result) {
        console.log('💾 TlDraw state updated in MongoDB for room:', roomId, 'version:', result.stateVersion);
        
        // FIXED: Broadcast to all users in the room (exclude sender)
        socket.to(roomId).emit('update', {
          changes: data.changes,
          state: data.state,
          timestamp: data.timestamp || Date.now(),
          sourceId: socket.id,
          stateVersion: result.stateVersion
        });
        
        console.log('📡 Broadcasting TlDraw update to room:', roomId);
      }
      
    } catch (error) {
      console.error('❌ Error updating TlDraw state:', error);
      
      // Send error to client for recovery
      socket.emit('tldraw-error', { 
        message: 'Failed to save drawing', 
        roomId,
        error: error.message,
        shouldReload: true // Indicate client should request fresh state
      });
      
      // Try to send current state for recovery
      try {
        const currentState = await TldrawState.findOne({ roomId });
        if (currentState) {
          socket.emit('init-state', currentState.state);
        }
      } catch (recoveryError) {
        console.error('❌ Error during TlDraw recovery:', recoveryError);
      }
    }
  });

  socket.on('file-created', async ({ roomId, fileName, content }) => {
    try {
      // First save to MongoDB
      const file = await File.create({
        roomId,
        fileName,
        content: content || '',
      });

      // Update room's file list in memory
      const roomFileList = roomFiles.get(roomId) || [];
      roomFileList.push({
        fileName: file.fileName,
        content: file.content,
        updatedAt: file.createdAt,
      });
      roomFiles.set(roomId, roomFileList);

      // Broadcast to ALL clients in the room
      io.to(roomId).emit('file-created', {
        fileName: file.fileName,
        content: file.content,
        updatedAt: file.createdAt,
      });

      // Also send updated file list
      io.to(roomId).emit('files-list-updated', {
        files: roomFileList,
      });
    } catch (error) {
      console.error('Error creating file:', error);
      socket.emit('file-error', {
        error: 'Failed to create file',
        details: error.message,
      });
    }
  });

  socket.on('file-deleted', async ({ roomId, fileName }) => {
    try {
      // Delete from MongoDB
      await File.findOneAndDelete({ roomId, fileName });

      // Update room's file list in memory
      const roomFileList = roomFiles.get(roomId) || [];
      const updatedFileList = roomFileList.filter((f) => f.fileName !== fileName);
      roomFiles.set(roomId, updatedFileList);

      // Broadcast deletion to all clients
      io.to(roomId).emit('file-deleted', { fileName });

      // Send updated file list
      io.to(roomId).emit('files-list-updated', {
        files: updatedFileList,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      socket.emit('file-error', {
        error: 'Failed to delete file',
        details: error.message,
      });
    }
  });

  socket.on('file-content-change', ({ roomId, fileName, content }) => {
    socket.to(roomId).emit('file-content-change', {
      fileName,
      content,
      timestamp: Date.now(),
    });
  });

  socket.on('file-updated', async ({ roomId, fileName, content }) => {
    try {
      // Update file in MongoDB after debounce
      const file = await File.findOneAndUpdate(
        { roomId, fileName },
        {
          content,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Update room's file list in memory
      const roomFileList = roomFiles.get(roomId) || [];
      const fileIndex = roomFileList.findIndex((f) => f.fileName === fileName);
      if (fileIndex !== -1) {
        roomFileList[fileIndex] = {
          fileName: file.fileName,
          content: file.content,
          updatedAt: file.updatedAt,
        };
      }

      // Confirm save to other clients
      socket.to(roomId).emit('file-updated', {
        fileName,
        content: file.content,
        updatedAt: file.updatedAt,
      });
    } catch (error) {
      console.error('Error saving file:', error);
      socket.emit('file-error', {
        error: 'Failed to save file',
        details: error.message,
      });
    }
  });

  // --- CHAT SOCKET EVENTS ---
  socket.on('send-message', (message) => {
    console.log('Received message from client:', message);
    const { roomId } = message;
    if (!roomId) {
      console.log('No roomId provided in message');
      return;
    }
    // Save message to room history (per room)
    if (!rooms.has(roomId)) {
      rooms.set(roomId, []);
    }
    rooms.get(roomId).push(message);
    console.log('Broadcasting message to room:', roomId);
    // Broadcast to all users in the room (including sender)
    io.to(roomId).emit('receive-message', message);
    // Send notification to all users in the room except sender
    socket.to(roomId).emit('chat-notification', {
      roomId,
      username: message.username,
      text: message.text,
      timestamp: message.timestamp,
    });
  });

  socket.on('get-chat-history', ({ roomId }) => {
    console.log('Client requesting chat history for room:', roomId);
    if (!roomId) return;
    const history = rooms.get(roomId) || [];
    console.log('Sending chat history:', history.length, 'messages');
    socket.emit('chat-history', history);
  });

  socket.on('disconnect', async () => {
    const roomId = socket.roomId;
    const isTldrawConnection = socket.isTldrawConnection;
    console.log(`🔌 User disconnecting: ${socket.id} from room: ${roomId} ${isTldrawConnection ? '[TlDraw]' : '[Main]'}`);
    
    if (roomId && usersInRoom[roomId]) {
      // Only remove from user list if it's a main connection
      if (!isTldrawConnection) {
        const leavingUser = usersInRoom[roomId].find(user => user.socketId === socket.id);
        
        usersInRoom[roomId] = usersInRoom[roomId].filter(
          (user) => user.socketId !== socket.id
        );
        
        if (usersInRoom[roomId].length === 0) {
          delete usersInRoom[roomId];
        } else {
          // Notify remaining users that someone left
          if (leavingUser) {
            socket.to(roomId).emit('user-left', { username: leavingUser.username });
            
            // Add system message to chat about user leaving
            const leaveMessage = {
              type: 'system',
              username: 'System',
              text: `${leavingUser.username} left the room`,
              timestamp: new Date().toISOString(),
              roomId: roomId
            };
            
            // Save system message to room history
            if (!rooms.has(roomId)) {
              rooms.set(roomId, []);
            }
            rooms.get(roomId).push(leaveMessage);
            
            // Broadcast leave message to remaining users
            socket.to(roomId).emit('receive-message', leaveMessage);
          }
          
          // Update user list for remaining users
          io.to(roomId).emit('update-user-list', usersInRoom[roomId]);
        }
        
        // Update user count in MongoDB
        try {
          await TldrawState.findOneAndUpdate(
            { roomId },
            { 
              userCount: usersInRoom[roomId] ? usersInRoom[roomId].length : 0,
              lastUpdate: new Date()
            }
          );
          
          // Send updated user list to remaining users
          const usersList = usersInRoom[roomId] ? usersInRoom[roomId].map(u => u.socketId) : [];
          io.to(roomId).emit('users-list', usersList);
          
        } catch (error) {
          console.error('❌ Error updating user count:', error);
        }
      }
    }
  });
});

app.post('/api/execute', async (req, res) => {
  try {
    const { language, code } = req.body;

    const languageMap = {
      js: 'javascript',
      py: 'python3',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      ts: 'typescript',
      go: 'go',
      rb: 'ruby',
      php: 'php',
      rs: 'rust',
      kt: 'kotlin',
      swift: 'swift',
    };

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: languageMap[language] || language,
        version: '*',
        files: [
          {
            content: code,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.run) {
      res.json({
        success: true,
        output: data.run.output || data.run.stderr,
      });
    } else {
      throw new Error('Execution failed');
    }
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      output: 'Error executing code',
    });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
