require("dotenv").config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const File = require('./models/file');
const TldrawState = require('./models/tldrawState');

// Routes
const fileRoutes = require('./routes/files.js');
const aiRoutes = require('./routes/ai-gemini.js');
const aiChatRoutes = require('./routes/aiChat.js');
const emailRoutes = require('./routes/email.js');
const authRoutes = require('./routes/auth.js');

// Middleware
const { globalLimiter, aiLimiter, codeExecutionLimiter, rateLimitMonitor } = require('./middleware/rateLimiter');

// Configuration
const { isRedisAvailable, getCacheStats } = require('./config/redis');
require('./config/database');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(
  cors({
    origin: [
      'https://cunity.vercel.app',
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
app.use(globalLimiter);
app.use(rateLimitMonitor);

console.log('[INFO] Rate limiting enabled for API protection');

// Health check endpoint
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  let dbTest = null;
  try {
    if (mongoStatus === 1) {
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

// Debug endpoint
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

// Cache status endpoint
app.get('/cache-status', async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json({
      success: true,
      redis: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message
    });
  }
});

// Database status endpoint
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

// API routes
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: [
      'https://cunity.vercel.app',
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

// Track active rooms
const usersInRoom = {};
const rooms = new Map();
const roomFiles = new Map();

io.on('connection', (socket) => {
  console.log('[INFO] User connected:', socket.id);

  socket.on('join-room', async (data) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    const username = typeof data === 'object' ? data.username : `User-${socket.id.slice(0, 4)}`;
    const isTldrawConnection = typeof data === 'object' ? data.isTldrawConnection : false;
    
    console.log(`[INFO] Join room: ${roomId} by ${username} (${socket.id}) ${isTldrawConnection ? '[TlDraw]' : '[Main]'}`);
    
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;
    socket.isTldrawConnection = isTldrawConnection;

    if (!usersInRoom[roomId]) {
      usersInRoom[roomId] = [];
    }

    if (!isTldrawConnection) {
      const existingUserIndex = usersInRoom[roomId].findIndex(u => u.socketId === socket.id);
      if (existingUserIndex === -1) {
        usersInRoom[roomId].push({ socketId: socket.id, username });
        console.log(`[SUCCESS] User ${username} added to room ${roomId}. Total users: ${usersInRoom[roomId].length}`);
      } else {
        console.log(`[INFO] User ${username} already exists in room ${roomId}`);
      }
    }

    try {
      let tldrawState = await TldrawState.findOne({ roomId });
      
      if (!tldrawState) {
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
        console.log(`[SUCCESS] TlDraw room created in DB: ${roomId}`);
      }

      console.log('[INFO] Sending initial TlDraw state');
      socket.emit('init-state', tldrawState.state);

      if (!isTldrawConnection) {
        console.log(`[INFO] Sending user list to room ${roomId}:`, usersInRoom[roomId]);
        socket.emit('update-user-list', usersInRoom[roomId]);
        socket.to(roomId).emit('update-user-list', usersInRoom[roomId]);
      }

    } catch (error) {
      console.error('[ERROR] Error handling room join:', error);
      socket.emit('init-state', {
        store: {},
        schema: {
          schemaVersion: 1,
          storeVersion: 4,
          recordVersions: {}
        }
      });
    }

    if (!isTldrawConnection) {
      const roomMessages = rooms.get(roomId) || [];
      socket.emit('chat-history', roomMessages);

      try {
        const files = await File.find({ roomId });
        const fileList = files.map((f) => ({
          fileName: f.fileName,
          content: f.content,
          updatedAt: f.updatedAt,
        }));

        roomFiles.set(roomId, fileList);
        io.to(roomId).emit('files-list-updated', { files: fileList });
      } catch (error) {
        console.error('[ERROR] Error getting files for room:', error);
      }

      socket.to(roomId).emit('user-joined', { username });
      
      const joinMessage = {
        type: 'system',
        username: 'System',
        text: `${username} joined the room`,
        timestamp: new Date().toISOString(),
        roomId
      };
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, []);
      }
      rooms.get(roomId).push(joinMessage);
      
      io.to(roomId).emit('receive-message', joinMessage);
      io.to(roomId).emit('update-user-list', usersInRoom[roomId]);
    }
  });

  socket.on('update', async (data) => {
    const roomId = data.roomId || socket.roomId;
    
    if (!roomId || !data.state) {
      console.log('[ERROR] TlDraw update ignored - missing roomId or state');
      return;
    }

    console.log('[INFO] Received TlDraw update for room:', roomId, 'from:', socket.id);

    try {
      if (!data.state.store || typeof data.state.store !== 'object') {
        console.log('[ERROR] Invalid TlDraw state structure:', typeof data.state.store);
        return;
      }

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
              maxTimeMS: 5000
            }
          );
          break;
        } catch (retryError) {
          retries--;
          console.log(`[ERROR] TlDraw update retry ${3-retries}/3:`, retryError.message);
          if (retries === 0) throw retryError;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (result) {
        console.log('[SUCCESS] TlDraw state updated in MongoDB for room:', roomId, 'version:', result.stateVersion);
        
        socket.to(roomId).emit('update', {
          changes: data.changes,
          state: data.state,
          timestamp: data.timestamp || Date.now(),
          sourceId: socket.id,
          stateVersion: result.stateVersion
        });
        
        console.log('[INFO] Broadcasting TlDraw update to room:', roomId);
      }
      
    } catch (error) {
      console.error('[ERROR] Error updating TlDraw state:', error);
      
      socket.emit('tldraw-error', { 
        message: 'Failed to save drawing', 
        roomId,
        error: error.message,
        shouldReload: true
      });
      
      try {
        const currentState = await TldrawState.findOne({ roomId });
        if (currentState) {
          socket.emit('init-state', currentState.state);
        }
      } catch (recoveryError) {
        console.error('[ERROR] Error during TlDraw recovery:', recoveryError);
      }
    }
  });

  socket.on('file-created', async ({ roomId, fileName, content }) => {
    try {
      const file = await File.create({
        roomId,
        fileName,
        content: content || '',
      });

      const roomFileList = roomFiles.get(roomId) || [];
      roomFileList.push({
        fileName: file.fileName,
        content: file.content,
        updatedAt: file.createdAt,
      });
      roomFiles.set(roomId, roomFileList);

      io.to(roomId).emit('file-created', {
        fileName: file.fileName,
        content: file.content,
        updatedAt: file.createdAt,
      });

      io.to(roomId).emit('files-list-updated', {
        files: roomFileList,
      });
    } catch (error) {
      console.error('[ERROR] Error creating file:', error);
      socket.emit('file-error', {
        error: 'Failed to create file',
        details: error.message,
      });
    }
  });

  socket.on('file-deleted', async ({ roomId, fileName }) => {
    try {
      await File.findOneAndDelete({ roomId, fileName });

      const roomFileList = roomFiles.get(roomId) || [];
      const updatedFileList = roomFileList.filter((f) => f.fileName !== fileName);
      roomFiles.set(roomId, updatedFileList);

      io.to(roomId).emit('file-deleted', { fileName });
      io.to(roomId).emit('files-list-updated', {
        files: updatedFileList,
      });
    } catch (error) {
      console.error('[ERROR] Error deleting file:', error);
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
      const file = await File.findOneAndUpdate(
        { roomId, fileName },
        {
          content,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      const roomFileList = roomFiles.get(roomId) || [];
      const fileIndex = roomFileList.findIndex((f) => f.fileName === fileName);
      if (fileIndex !== -1) {
        roomFileList[fileIndex] = {
          fileName: file.fileName,
          content: file.content,
          updatedAt: file.updatedAt,
        };
      }

      socket.to(roomId).emit('file-updated', {
        fileName,
        content: file.content,
        updatedAt: file.updatedAt,
      });
    } catch (error) {
      console.error('[ERROR] Error saving file:', error);
      socket.emit('file-error', {
        error: 'Failed to save file',
        details: error.message,
      });
    }
  });

  socket.on('send-message', (message) => {
    console.log('[INFO] Received message from client:', message);
    const { roomId } = message;
    if (!roomId) {
      console.log('[ERROR] No roomId provided in message');
      return;
    }
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, []);
    }
    rooms.get(roomId).push(message);
    console.log('[INFO] Broadcasting message to room:', roomId);
    
    io.to(roomId).emit('receive-message', message);
    
    socket.to(roomId).emit('chat-notification', {
      roomId,
      username: message.username,
      text: message.text,
      timestamp: message.timestamp,
    });
  });

  socket.on('get-chat-history', ({ roomId }) => {
    console.log('[INFO] Client requesting chat history for room:', roomId);
    if (!roomId) return;
    const history = rooms.get(roomId) || [];
    console.log('[INFO] Sending chat history:', history.length, 'messages');
    socket.emit('chat-history', history);
  });

  socket.on('disconnect', async () => {
    const roomId = socket.roomId;
    const isTldrawConnection = socket.isTldrawConnection;
    console.log(`[INFO] User disconnecting: ${socket.id} from room: ${roomId} ${isTldrawConnection ? '[TlDraw]' : '[Main]'}`);
    
    if (roomId && usersInRoom[roomId]) {
      if (!isTldrawConnection) {
        const leavingUser = usersInRoom[roomId].find(user => user.socketId === socket.id);
        
        usersInRoom[roomId] = usersInRoom[roomId].filter(
          (user) => user.socketId !== socket.id
        );
        
        console.log(`[INFO] User ${leavingUser?.username} left room ${roomId}. Remaining users: ${usersInRoom[roomId].length}`);
        
        if (usersInRoom[roomId].length === 0) {
          delete usersInRoom[roomId];
        } else {
          socket.to(roomId).emit('update-user-list', usersInRoom[roomId]);
          
          if (leavingUser) {
            socket.to(roomId).emit('user-left', { username: leavingUser.username });
            
            const leaveMessage = {
              type: 'system',
              username: 'System',
              text: `${leavingUser.username} left the room`,
              timestamp: new Date().toISOString(),
              roomId: roomId
            };
            
            if (!rooms.has(roomId)) {
              rooms.set(roomId, []);
            }
            rooms.get(roomId).push(leaveMessage);
            
            socket.to(roomId).emit('receive-message', leaveMessage);
          }
          
          io.to(roomId).emit('update-user-list', usersInRoom[roomId]);
        }
        
        try {
          await TldrawState.findOneAndUpdate(
            { roomId },
            { 
              userCount: usersInRoom[roomId] ? usersInRoom[roomId].length : 0,
              lastUpdate: new Date()
            }
          );
          
          const usersList = usersInRoom[roomId] ? usersInRoom[roomId].map(u => u.socketId) : [];
          io.to(roomId).emit('users-list', usersList);
          
        } catch (error) {
          console.error('[ERROR] Error updating user count:', error);
        }
      }
    }
  });
});

// Code execution endpoint
app.post('/api/execute', codeExecutionLimiter, async (req, res) => {
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
    console.error('[ERROR] Code execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      output: 'Error executing code',
    });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`[SUCCESS] Server running on port ${PORT}`);
});
