import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import MonacoEditor from '@monaco-editor/react';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import FileExplorer from '../components/FileManager';
import axios from 'axios';
import _ from 'lodash';
import UserList from '../components/UserList';
import CodeRunner from '../components/CodeExecution/CodeRunner';
import { getTemplateForFile } from '../utils/codeTemplates';
import CopilotPanel from '../components/Copilot/CopilotPanel';
import MobileError from '../components/MobileError.jsx';
import TldrawWithRealtime from '../components/TldrawWithRealtime';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../components/NotificationToast';
import { FaShare, FaCopy, FaEnvelope, FaCheck, FaTimes, FaFolder, FaUsers, FaPaintBrush, FaComments, FaRobot } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';

const BACKEND_URL = import.meta.env.PROD 
  ? 'https://s65-nishat-capstone-codeunity-swbt.onrender.com'
  : 'http://localhost:8080';

// Add this helper function at the top of your file
const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'ts': 'typescript',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'rs': 'rust',
    'kt': 'kotlin',
    'swift': 'swift',
    'md': 'markdown',
    'txt': 'plaintext'
  };
  return languageMap[extension] || 'plaintext';
};

const Editor = () => {
  const { roomId } = useParams();
  const { state } = useLocation();
  
  const socketRef = useRef(null);
  const [code, setCode] = useState('// Start typing...');
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('files');
  const [files, setFiles] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize ref after state declaration
  const activeTabRef = useRef(activeTab);

  // Sharing functionality
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    recipientName: '',
    message: ''
  });
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Notification system
  const { NotificationContainer } = useNotifications();

  // Create persistent debounced save function
  const debouncedSaveRef = useRef();
  
  // Initialize debounced save functionality
  useEffect(() => {
    debouncedSaveRef.current = _.debounce(async (fileName, content) => {
      if (!fileName || !roomId) return;
      try {
        await axios.post(`${BACKEND_URL}/api/files/${roomId}`, {
          name: fileName,
          content: content,
        });
        
        // Notify other users in the room
        socketRef.current?.emit('file-updated', {
          roomId,
          fileName,
          content
        });
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }, 1000);

    return () => {
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [roomId]);

  // Wrapper function to call the debounced save
  const saveToServer = useCallback((fileName, content) => {
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current(fileName, content);
    }
  }, []);

  // Sharing functions
  const handleCopyRoomId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy room ID:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [roomId]);

  const handleShareViaEmail = useCallback(async () => {
    if (!emailForm.recipientEmail) {
      alert('Please enter recipient email address');
      return;
    }

    setEmailSending(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/email/share-room`, {
        recipientEmail: emailForm.recipientEmail,
        recipientName: emailForm.recipientName,
        senderName: state?.username,
        roomId: roomId,
        message: emailForm.message
      });

      if (response.data.success) {
        setEmailSuccess(true);
        setEmailForm({ recipientEmail: '', recipientName: '', message: '' });
        setTimeout(() => {
          setEmailSuccess(false);
          setShowShareModal(false);
        }, 2000);
      } else {
        alert(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(error.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  }, [emailForm, roomId, state?.username]);

  const fetchFiles = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/files/${roomId}`);
      // response.data.files is an array of { fileName, content, ... }
      const filesData = {};
      response.data.files.forEach(file => {
        filesData[file.fileName] = file.content;
      });
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  }, [roomId]);



  const handleFileClick = useCallback(async (fileName) => {
    try {
      let fileContent = files[fileName];
      
      if (!fileContent) {
        // File not in local state, fetch it
        const response = await axios.get(`${BACKEND_URL}/api/files/${roomId}/${fileName}`);
        fileContent = response.data.content;
        
        // Update files state
        setFiles(prev => ({
          ...prev,
          [fileName]: fileContent
        }));
      }

      setCurrentFile(fileName);
      setCode(fileContent);
      localStorage.setItem('lastOpenedFile', fileName);
      
      // No longer emit file-opened; navigation is local only
    } catch (error) {
      console.error('Error opening file:', error);
    }
  }, [files, roomId]);

  // Then define effects
  useEffect(() => {
    if (roomId) {
      fetchFiles();
    }
  }, [roomId, fetchFiles]);

  // Socket initialization and event handling
  useEffect(() => {
    if (!roomId || !state?.username) return;

    // Initialize socket connection
    socketRef.current = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      path: '/socket.io/', // Explicitly set the socket.io path
      forceNew: true // Force a new connection
    });

    const socket = socketRef.current;

    // Clean up any existing listeners to prevent duplicates
    socket.removeAllListeners();

    socket.on('connect', () => {
      socket.emit('join-room', { roomId, username: state.username });
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socket.on('update-user-list', (userList) => {
      setUsers(userList.map(u => u.username));
    });

    // User join/leave notification events - handled in chat as system messages
    socket.on('user-joined', () => {
      // Join notifications are now sent as system messages in chat
    });

    socket.on('user-left', () => {
      // Leave notifications are now sent as system messages in chat
    });

    // File-related socket events
    socket.on('files-list-updated', ({ files }) => {
      const filesData = {};
      files.forEach(file => {
        filesData[file.fileName] = file.content;
      });
      setFiles(filesData);
    });

    socket.on('file-created', ({ fileName, content }) => {
      setFiles(prev => ({
        ...prev,
        [fileName]: content
      }));
    });

    socket.on('file-deleted', ({ fileName }) => {
      setFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fileName];
        return newFiles;
      });

      setCurrentFile(prev => prev === fileName ? null : prev);
      if (localStorage.getItem('lastOpenedFile') === fileName) {
        localStorage.removeItem('lastOpenedFile');
      }
    });

    // Listen for both immediate updates and saved updates
    socket.on('file-content-change', ({ fileName, content }) => {
      setFiles(prev => ({
        ...prev,
        [fileName]: content
      }));
      setCurrentFile(prev => {
        if (prev === fileName) {
          setCode(content);
        }
        return prev;
      });
    });

    socket.on('file-updated', ({ fileName, content }) => {
      setFiles(prev => ({
        ...prev,
        [fileName]: content
      }));
      setCurrentFile(prev => {
        if (prev === fileName) {
          setCode(content);
        }
        return prev;
      });
    });

    // --- CHAT NOTIFICATION HANDLER ---
    socket.on('chat-notification', () => {
      // Don't show notifications if chat is visible (either in chat tab or TlDraw mode)
      setUnreadCount(prev => (activeTabRef.current !== 'chat' && activeTabRef.current !== 'draw') ? prev + 1 : prev);
    });

    // Chat unread message tracking
    socket.on('receive-message', () => {
      // Only increment unread count if chat is not visible (not in chat tab or TlDraw mode)
      if (activeTabRef.current !== 'chat' && activeTabRef.current !== 'draw') {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Reset unread count when chat tab becomes active
    socket.on('user-typing', () => {
      // Handle typing indicators if needed
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [roomId, state?.username]);

  useEffect(() => {
    // Reset unread count when chat is visible (either in chat tab or TlDraw mode)
    if (activeTab === 'chat' || activeTab === 'draw') {
      setUnreadCount(0);
    }
  }, [activeTab]);

  // Update activeTabRef when activeTab changes
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Handle escape key to close share modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showShareModal) {
        setShowShareModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showShareModal]);

  // Add this useEffect to load the last opened file
  useEffect(() => {
    const lastOpenedFile = localStorage.getItem('lastOpenedFile');
    if (lastOpenedFile && files[lastOpenedFile]) {
      handleFileClick(lastOpenedFile);
    }
  }, [files, handleFileClick]); // Include handleFileClick in dependencies

  const handleAddNode = async (fileName, type = 'file', retryCount = 0) => {
    console.log('🚀 Creating file:', fileName, 'type:', type, 'retry:', retryCount);
    console.log('📍 Room ID:', roomId);
    console.log('🌐 Backend URL:', BACKEND_URL);
    
    if (!roomId) {
      alert('❌ Error: No room ID found. Please refresh the page and try again.');
      return;
    }
    
    if (!fileName || fileName.trim() === '') {
      alert('❌ Error: Please enter a valid filename.');
      return;
    }
    
    try {
      const template = getTemplateForFile(fileName);
      console.log('📄 Generated template for', fileName, ':', template?.substring(0, 50) + '...');
      
      console.log('🔄 Sending request to backend...');
      
      // Check server health first if this is a retry
      if (retryCount > 0) {
        try {
          const healthCheck = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
          console.log('🏥 Health check:', healthCheck.data);
          if (healthCheck.data?.mongodb?.status !== 'connected') {
            throw new Error('Database not ready');
          }
        } catch (healthError) {
          console.warn('⚠️ Health check failed:', healthError.message);
          throw new Error('Server not ready for requests');
        }
      }
      
      // First update MongoDB through the API
      const response = await axios.post(`${BACKEND_URL}/api/files/${roomId}`, {
        name: fileName,
        content: template,
        roomId
      }, {
        timeout: 35000, // 35 second timeout for production
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ API response received:', response.data);

      if (response.data.success) {
        // Update local state immediately
        const fileContent = response.data.content || template;
        setFiles(prev => ({
          ...prev,
          [fileName]: fileContent
        }));
        
        // Emit socket event for real-time sync
        socketRef.current?.emit('file-created', {
          roomId,
          fileName,
          content: fileContent
        });
        
        // Set as current file and update editor
        setCurrentFile(fileName);
        setCode(fileContent);
        console.log('🎉 File created successfully:', fileName);
        
        // Show success message
        alert(`✅ File "${fileName}" created successfully!`);
      } else {
        console.error('❌ API returned success: false', response.data);
        alert(`❌ Failed to create file: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error creating file:', error);
      console.error('🔍 Error details:', error.response?.data);
      
      let errorMessage = 'Failed to create file.';
      let shouldRetry = false;
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '⏱️ Request timed out. The server might be starting up or under heavy load.';
        shouldRetry = true;
      } else if (error.response) {
        // Server responded with error status
        const serverError = error.response.data;
        if (serverError?.type === 'MongoTimeoutError' || serverError?.message?.includes('timeout')) {
          errorMessage = '🔄 Database is busy or starting up. This is common in serverless environments.';
          shouldRetry = serverError?.retry !== false;
        } else if (serverError?.message?.includes('connection') || serverError?.message?.includes('network')) {
          errorMessage = '🔌 Database connection issue. Retrying...';
          shouldRetry = serverError?.retry !== false;
        } else if (serverError?.message?.includes('unavailable')) {
          errorMessage = '🚫 Database temporarily unavailable. Please wait a moment.';
          shouldRetry = true;
        } else {
          errorMessage = `🚫 Server error: ${serverError?.message || error.message}`;
          shouldRetry = serverError?.retry === true;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = '🌐 Network error: Unable to reach the server. Please check your connection.';
        shouldRetry = true;
      } else if (error.message === 'Server not ready for requests') {
        errorMessage = '🔧 Server is starting up. Please wait a moment.';
        shouldRetry = true;
      } else {
        // Something else happened
        errorMessage = `⚠️ Unexpected error: ${error.message}`;
      }
      
      // Offer retry for certain errors
      if (shouldRetry && retryCount < 2) {
        const retryMessage = `${errorMessage}\n\nWould you like to try again? (Attempt ${retryCount + 1}/3)`;
        if (confirm(retryMessage)) {
          console.log(`🔄 Retrying file creation... (attempt ${retryCount + 1})`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 2000 + (retryCount * 1000)));
          return handleAddNode(fileName, type, retryCount + 1);
        }
      } else if (retryCount >= 2) {
        errorMessage = `❌ Failed to create file after 3 attempts. This might be due to server startup delays in production. Please wait a few minutes and try again.`;
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteNode = async (fileName) => {
    try {
      if (!fileName || !roomId) {
        console.error('Missing fileName or roomId:', { fileName, roomId });
        return;
      }

      const response = await axios.delete(`${BACKEND_URL}/api/files/${roomId}/${fileName}`);

      if (response.data.success) {
        // Remove from files state
        setFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[fileName];
          return newFiles;
        });

        // Clear editor if deleted file was open
        if (currentFile === fileName) {
          setCurrentFile(null);
          setCode('');
          localStorage.removeItem('lastOpenedFile');
        }

        // Notify other users
        socketRef.current?.emit('file-deleted', {
          roomId,
          fileName
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Failed to delete file: ${error.message}`);
    }
  };

  // Add this useEffect to handle file cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup function
      const lastOpenedFile = localStorage.getItem('lastOpenedFile');
      if (lastOpenedFile && !files[lastOpenedFile]) {
        localStorage.removeItem('lastOpenedFile');
      }
    };
  }, [files]);

  const handleCodeChanges = useCallback((value) => {
    if (!currentFile || !socketRef.current) return;

    // Update local state
    setCode(value);
    setFiles(prev => ({
      ...prev,
      [currentFile]: value,
    }));

    // Emit code change immediately for real-time sync
    socketRef.current.emit('file-content-change', {
      roomId,
      fileName: currentFile,
      content: value,
    });

    // Save to server with debounce (this will emit file-updated event)
    saveToServer(currentFile, value);
  }, [currentFile, roomId, saveToServer]);

  // Handle code insertion from AI
  const handleCodeInsert = useCallback((codeToInsert) => {
    if (!currentFile) {
      alert('Please select a file first before inserting code.');
      return;
    }

    // Insert code at the end of current content (with proper spacing)
    const currentContent = code || '';
    const separator = currentContent.trim() ? '\n\n' : '';
    const newContent = currentContent + separator + codeToInsert;
    
    // Update the editor
    handleCodeChanges(newContent);
  }, [currentFile, code, handleCodeChanges]);

  const handleRunCode = async () => {
    if (!currentFile || !code) return null;

    try {
      const fileExt = currentFile.split('.').pop();
      const response = await axios.post(`${BACKEND_URL}/api/execute`, {
        language: fileExt,
        code: code
      });

      if (response.data.output) {
        socketRef.current.emit('code-output', {
          roomId,
          output: response.data.output
        });
      }

      return response; // Return the response so CodeRunner can access it
    } catch (error) {
      console.error('Error executing code:', error);
      socketRef.current.emit('code-output', {
        roomId,
        output: `Error: ${error.message}`
      });
      throw error; // Throw the error so CodeRunner can handle it
    }
  };

  // Render active tab content with minimal design
  const renderActiveTab = () => {
    const panelConfig = {
      files: { title: 'File Explorer', icon: FaFolder, color: 'blue' },
      users: { title: 'Active Users', icon: FaUsers, color: 'green' },
      draw: { title: 'Whiteboard', icon: FaPaintBrush, color: 'purple' },
      chat: { title: 'Code Chat', icon: FaComments, color: 'pink' },
      copilot: { title: 'AI Assistant', icon: FaRobot, color: 'purple' }
    };

    const config = panelConfig[activeTab];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <div className="h-full flex flex-col">
        {/* Minimal Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/30 bg-pink-500/5">
          <div className="flex items-center gap-3">
            <IconComponent className={`w-4 h-4 ${
              config.color === 'pink' ? 'text-pink-400' :
              config.color === 'purple' ? 'text-purple-400' :
              config.color === 'blue' ? 'text-blue-400' :
              'text-green-400'
            }`} />
            <div>
              <span className="font-medium text-white text-sm">{config.title}</span>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  config.color === 'pink' ? 'bg-pink-500' :
                  config.color === 'purple' ? 'bg-purple-500' :
                  config.color === 'blue' ? 'bg-blue-500' :
                  'bg-green-500'
                } animate-pulse`}></div>
                <span className="text-xs text-gray-400">
                  {activeTab === 'users' ? `${users.length} online` : 'Live'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {activeTab === 'files' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const fileName = prompt('Enter file name:');
                if (fileName) {
                  handleAddNode(fileName, 'file');
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 hover:from-pink-500/30 hover:to-purple-600/30 transition-all duration-200"
            >
              <FiPlus className="w-3 h-3" />
              <span className="text-xs font-medium">New</span>
            </motion.button>
          )}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-hidden p-1">
          {activeTab === 'files' && (
            <div className="h-full bg-black/20 backdrop-blur-xl border border-pink-500/20 rounded-xl overflow-hidden">
              <FileExplorer
                fileTree={Object.keys(files).map((name) => ({
                name,
                type: 'file',
                content: files[name]
              }))}
              currentFile={currentFile}
              onFileClick={handleFileClick}
              onAdd={handleAddNode}
              onDelete={handleDeleteNode}
              className="h-full p-4"
            />
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="h-full bg-black/20 backdrop-blur-xl border border-pink-500/20 rounded-xl overflow-hidden">
              <UserList 
                users={users} 
                currentUser={state?.username}
                className="h-full p-4" 
              />
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="h-full bg-black/20 backdrop-blur-xl border border-pink-500/20 rounded-xl overflow-hidden">
              <div className="h-full flex flex-col">
              <ChatBox
                socket={socketRef.current}
                roomId={roomId}
                username={state?.username}
                onMessageReceived={() => {
                  // Reset unread count when in chat
                  if (activeTab === 'chat') {
                    setUnreadCount(0);
                  }
                }}
                className="h-full"
              />
              </div>
            </div>
          )}
          
          {activeTab === 'copilot' && (
            <div className="h-full bg-black/20 backdrop-blur-xl border border-pink-500/20 rounded-xl overflow-hidden">
              <CopilotPanel
                currentFile={currentFile}
                code={code}
                onCodeInsert={handleCodeInsert}
                roomId={roomId}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileError />;
  }

  return (
    <div className="h-screen overflow-hidden bg-black">
      {/* Animated background matching landing page */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        {/* Animated geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-3xl transform rotate-45 animate-pulse"></div>
        <div className="absolute bottom-40 right-32 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-2xl transform -rotate-12 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-pink-400/10 to-purple-500/10 rounded-xl transform rotate-12 animate-pulse delay-2000"></div>
        
        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent transform rotate-12 origin-left"></div>
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent transform -rotate-12 origin-right"></div>
        
        {/* Radial glows */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-radial from-pink-500/5 via-pink-500/2 to-transparent rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-purple-500/5 via-purple-500/2 to-transparent rounded-full"></div>
      </div>

      {/* Main Content */}
      <div className="relative flex h-full">
        {/* Minimal Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-16 bg-black/80 backdrop-blur-xl border-r border-gray-800/50"
        >
          <Sidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadCount={unreadCount}
          />
        </motion.div>

        {/* Main Editor Area */}
        <div className="flex-1 flex p-4 gap-4">
          {/* Left Panel - Hidden when TlDraw is active */}
          {activeTab !== 'draw' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-80 bg-black/30 backdrop-blur-xl border-2 border-pink-500/40 rounded-2xl overflow-hidden shadow-xl shadow-pink-500/10"
            >
              <div className="h-full overflow-y-auto">
                {renderActiveTab()}
              </div>
            </motion.div>
          )}

          {/* Center Area - Code Editor or TlDraw */}
          <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-xl border-2 border-pink-500/40 rounded-2xl overflow-hidden shadow-xl shadow-pink-500/10">
            {/* Header */}
            <motion.div 
              className="h-14 px-6 flex items-center justify-between border-b border-pink-500/20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4">
                <h1 className="text-white font-semibold text-lg">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
                    Code
                  </span>
                  <span className="text-white">Unity</span>
                </h1>
                
                {activeTab === 'draw' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse"></div>
                    <span className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-700/30 text-sm text-gray-300">
                      Collaborative Whiteboard
                    </span>
                  </div>
                ) : currentFile && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse"></div>
                    <span className="px-3 py-1 rounded-lg bg-gray-900/50 border border-gray-700/30 text-sm text-gray-300 font-mono">
                      {currentFile}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShareModal(true)}
                  className="p-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 text-purple-400 transition-all duration-200 group"
                  title="Share"
                >
                  <FaShare className="w-4 h-4 group-hover:animate-pulse" />
                </motion.button>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 p-4">
              {activeTab === 'draw' ? (
                /* TlDraw Whiteboard */
                <div className="h-full rounded-lg border-2 border-pink-500/40 overflow-hidden bg-black/30 backdrop-blur-sm shadow-lg shadow-pink-500/10">
                  <TldrawWithRealtime
                    socket={socketRef.current}
                    roomId={roomId}
                    isPersistent={true}
                    className="h-full w-full"
                  />
                </div>
              ) : (
                /* Code Editor */
                <div className="h-full rounded-lg border-2 border-pink-500/40 overflow-hidden bg-black/30 backdrop-blur-sm shadow-lg shadow-pink-500/10">
                  <CodeRunner 
                    currentFile={currentFile} 
                    code={code}
                    onRunCode={handleRunCode}
                  >
                    <MonacoEditor
                      height="100%"
                      language={currentFile ? getLanguageFromFileName(currentFile) : 'javascript'}
                      theme="vs-dark"
                      defaultValue={code}
                      onChange={(value) => {
                        if (value !== code) handleCodeChanges(value);
                      }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        automaticLayout: true,
                        background: 'rgba(0, 0, 0, 0.8)',
                        padding: { top: 20, bottom: 20, left: 20, right: 20 },
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                          useShadows: false,
                          verticalScrollbarSize: 8,
                          horizontalScrollbarSize: 8
                        },
                        lineHeight: 1.6,
                        letterSpacing: 0.5,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: true,
                        renderWhitespace: "none",
                        glyphMargin: false,
                        renderLineHighlight: "all",
                        contextmenu: true,
                        mouseWheelZoom: true,
                        quickSuggestions: true,
                        roundedSelection: true,
                        wordWrap: "on",
                        bracketPairColorization: { enabled: true },
                        guides: {
                          bracketPairs: true,
                          indentation: true
                        }
                      }}
                      key={currentFile}
                    />
                  </CodeRunner>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat when TlDraw is active */}
          {activeTab === 'draw' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-80 bg-black/20 backdrop-blur-xl border-2 border-pink-500/40 rounded-xl overflow-hidden shadow-xl shadow-black/20"
            >
              <div className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800/30 bg-pink-500/5">
                  <div className="flex items-center gap-3">
                    <FaComments className="w-4 h-4 text-pink-400" />
                    <div>
                      <span className="font-medium text-white text-sm">Code Chat</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
                        <span className="text-xs text-gray-400">Live</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Chat Content */}
                <div className="flex-1 overflow-hidden">
                  <ChatBox
                    socket={socketRef.current}
                    roomId={roomId}
                    username={state?.username}
                    onMessageReceived={() => {
                      // Reset unread count when in chat
                      setUnreadCount(0);
                    }}
                    className="h-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Notification Container */}
      <NotificationContainer />
      
      {/* Notification Container */}
      <NotificationContainer />
      
      {/* Share Modal - Portal style overlay */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/30 rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                    <FaShare className="text-pink-400" />
                    Share Room
                  </h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-white/50 hover:text-white/80 transition-colors p-1"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Room ID Display */}
                <div className="mb-6 p-4 bg-black/30 rounded-lg border border-gray-700/30">
                  <p className="text-sm text-gray-400 mb-2">Room ID</p>
                  <p className="text-white font-mono text-sm break-all">{roomId}</p>
                </div>

                {/* Share Options */}
                <div className="space-y-4">
                  <button
                    onClick={handleCopyRoomId}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-300 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all duration-300"
                  >
                    {copySuccess ? <FaCheck className="w-5 h-5" /> : <FaCopy className="w-5 h-5" />}
                    <span>
                      {copySuccess ? 'Copied to Clipboard!' : 'Copy Room ID'}
                    </span>
                  </button>                    {/* Email Sharing Form */}
                  <div className="border border-gray-700/30 rounded-lg p-4 bg-black/20">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <FaEnvelope className="w-4 h-4" />
                      Send Email Invitation
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <input
                          type="email"
                          placeholder="Recipient's email address *"
                          value={emailForm.recipientEmail}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30"
                          required
                        />
                      </div>
                      
                      <div>
                        <input
                          type="text"
                          placeholder="Recipient's name (optional)"
                          value={emailForm.recipientName}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, recipientName: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30"
                        />
                      </div>
                      
                      <div>
                        <textarea
                          placeholder="Personal message (optional)"
                          value={emailForm.message}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 resize-none"
                        />
                      </div>
                      
                      <button
                        onClick={handleShareViaEmail}
                        disabled={emailSending || !emailForm.recipientEmail}
                        className={`w-full flex items-center justify-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                          emailSuccess 
                            ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                            : emailSending || !emailForm.recipientEmail
                            ? 'bg-gray-600/30 border border-gray-500/30 text-gray-400 cursor-not-allowed'
                            : 'bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500/20 hover:border-pink-500/30'
                        }`}
                      >
                        {emailSending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending...</span>
                          </>
                        ) : emailSuccess ? (
                          <>
                            <FaCheck className="w-5 h-5" />
                            <span>Email Sent!</span>
                          </>
                        ) : (
                          <>
                            <FaEnvelope className="w-5 h-5" />
                            <span>Send Invitation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="mt-6 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                  <p className="text-pink-300 text-sm">
                    💡 Share the room URL with your team members to collaborate in real-time!
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Editor;
