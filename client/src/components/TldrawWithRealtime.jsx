import React, { useEffect, useRef, useState } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export default function TldrawWithRealtime({ socket, roomId, onError, isPersistent = false, isBackground = false }) {
  const editorRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const isUpdatingRef = useRef(false);
  const lastStateRef = useRef(null);
  const drawingTimeoutRef = useRef(null);
  const hasJoinedRoomRef = useRef(false);
  const connectionRef = useRef(null); // Store connection state

  useEffect(() => {
    if (!socket) return;

    console.log('🔧 Setting up TlDraw socket listeners for room:', roomId, 'persistent:', isPersistent, 'background:', isBackground);

    const handleConnect = () => {
      console.log('✅ TlDraw socket connected');
      setIsConnected(true);
      setIsInitialized(false);
      
      // Only join room once per socket, not per component mount
      if (roomId && (!hasJoinedRoomRef.current || !isPersistent)) {
        console.log('🚪 Joining TlDraw room:', roomId);
        socket.emit('join-room', { 
          roomId, 
          username: `TlDraw-${Date.now().toString().slice(-4)}`,
          isTldrawConnection: true
        });
        hasJoinedRoomRef.current = true;
      }
    };

    const handleDisconnect = () => {
      console.log('❌ TlDraw socket disconnected');
      setIsConnected(false);
      if (!isPersistent) {
        setIsInitialized(false);
        hasJoinedRoomRef.current = false;
      }
    };

    const handleInitState = (initialState) => {
      console.log('📥 TlDraw received initial state:', !!initialState);
      
      if (initialState && !isUpdatingRef.current) {
        // Store state even in background mode
        connectionRef.current = {
          state: initialState,
          timestamp: Date.now()
        };
        
        // Only apply to editor if not in background
        if (!isBackground && editorRef.current) {
          try {
            isUpdatingRef.current = true;
            
            if (initialState.store && typeof initialState.store === 'object') {
              console.log('✅ Loading TlDraw initial state');
              editorRef.current.store.loadSnapshot(initialState);
              lastStateRef.current = initialState;
            }
            
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 100);
          } catch (error) {
            console.error('❌ Error loading TlDraw initial state:', error);
            isUpdatingRef.current = false;
          }
        }
        
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
        console.log('✅ TlDraw ready - no initial state');
      }
    };

    // FIXED: Hide user info from frontend, only sync drawing changes
    const handleUpdate = ({ state, sourceId }) => {
      if (!sourceId || sourceId === socket.id || isUpdatingRef.current) return;
      
      // Store state even in background mode
      if (state) {
        connectionRef.current = {
          state: state,
          timestamp: Date.now()
        };
        lastStateRef.current = state;
      }
      
      // Only apply to editor if not in background and not drawing
      if (!isBackground && editorRef.current && !isDrawing) {
        console.log('📥 TlDraw applying update');
        
        try {
          isUpdatingRef.current = true;
          
          const currentState = editorRef.current.store.getSnapshot();
          const stateChanged = JSON.stringify(currentState) !== JSON.stringify(state);
          
          if (stateChanged && state) {
            editorRef.current.store.loadSnapshot(state);
          }
          
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 25);
          
        } catch (error) {
          console.error('❌ Error applying TlDraw update:', error);
          isUpdatingRef.current = false;
        }
      }
    };

    // Don't show user list updates to frontend
    const handleUsersList = (usersList) => {
      // Only log, don't update UI
      console.log('👥 TlDraw users updated (hidden from UI):', usersList?.length || 0);
    };

    const handleTldrawError = (error) => {
      console.error('TlDraw error from server:', error);
      if (onError) onError(error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('init-state', handleInitState);
    socket.on('update', handleUpdate);
    socket.on('users-list', handleUsersList);
    socket.on('tldraw-error', handleTldrawError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (!isPersistent) {
        console.log('🧹 Cleaning up TlDraw socket listeners');
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('init-state', handleInitState);
        socket.off('update', handleUpdate);
        socket.off('users-list', handleUsersList);
        socket.off('tldraw-error', handleTldrawError);
        hasJoinedRoomRef.current = false;
      }
    };
  }, [socket, roomId, isDrawing, isPersistent, isBackground, onError]);

  const handleMount = (editor) => {
    console.log('🎨 TlDraw editor mounted, background:', isBackground);
    editorRef.current = editor;

    if (isBackground) {
      return; // Don't set up interactions in background mode
    }

    // Apply stored state if available from connection
    if (connectionRef.current?.state && !isUpdatingRef.current) {
      try {
        isUpdatingRef.current = true;
        editor.store.loadSnapshot(connectionRef.current.state);
        lastStateRef.current = connectionRef.current.state;
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      } catch (error) {
        console.error('❌ Error applying stored TlDraw state:', error);
        isUpdatingRef.current = false;
      }
    }

    if (!socket || !roomId) {
      console.log('❌ No socket or roomId available for TlDraw');
      return;
    }

    // FIXED: Don't join room again if already joined
    if (!hasJoinedRoomRef.current && socket.connected) {
      socket.emit('join-room', { 
        roomId, 
        username: `User-${Date.now().toString().slice(-4)}` 
      });
      hasJoinedRoomRef.current = true;
    }

    // FIXED: Add drawing detection to prevent updates during drawing
    const container = editor.getContainer();
    
    const handlePointerDown = () => {
      console.log('🎯 Drawing started');
      setIsDrawing(true);
      if (drawingTimeoutRef.current) {
        clearTimeout(drawingTimeoutRef.current);
      }
    };
    
    const handlePointerMove = (e) => {
      if (e.buttons > 0) { // Any button pressed while moving
        setIsDrawing(true);
        if (drawingTimeoutRef.current) {
          clearTimeout(drawingTimeoutRef.current);
        }
      }
    };
    
    const handlePointerUp = () => {
      console.log('🎯 Drawing ended');
      if (drawingTimeoutRef.current) {
        clearTimeout(drawingTimeoutRef.current);
      }
      // Reduced delay for faster state updates
      drawingTimeoutRef.current = setTimeout(() => {
        setIsDrawing(false);
        console.log('✅ Drawing state cleared');
      }, 100); // Reduced from 200ms to 100ms
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);

    // Send changes with simple debouncing
    let updateTimeout = null;
    const unsubscribe = editor.store.listen((entry) => {
      const { changes } = entry;
      if (!changes || changes.length === 0 || isUpdatingRef.current) return;

      console.log('📤 Local changes detected');

      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        const snapshot = editor.store.getSnapshot();
        
        // Only send if state actually changed
        if (JSON.stringify(snapshot) !== JSON.stringify(lastStateRef.current)) {
          console.log('📤 Sending update to server');
          socket.emit('update', {
            changes,
            state: snapshot,
            timestamp: Date.now(),
            roomId,
            sourceId: socket.id
          });
          lastStateRef.current = snapshot;
        }
      }, 150); // Reduced from 300ms to 150ms for better responsiveness
    }, { source: 'user' });

    return () => {
      console.log('🧹 Cleaning up editor listeners');
      unsubscribe();
      
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      
      if (updateTimeout) clearTimeout(updateTimeout);
      if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
    };
  };

  if (!socket) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-white text-lg">
          TlDraw connection unavailable
        </div>
      </div>
    );
  }

  // Don't render anything in background mode
  if (isBackground) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {!isConnected && (
        <div className="absolute top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Disconnected - Reconnecting...
          </span>
        </div>
      )}
      
      {!isInitialized && isConnected && (
        <div className="absolute top-4 right-4 z-50 bg-orange-500 text-white px-4 py-2 rounded shadow-lg">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Initializing...
          </span>
        </div>
      )}
      
      {/* Hide user count as requested */}
      <div className="absolute top-4 left-4 z-50 bg-black/70 backdrop-blur text-white px-4 py-2 rounded shadow-lg">
        <span className="text-sm flex items-center gap-3">
          <span>Room: <span className="text-blue-400 font-mono">{roomId}</span></span>
          <span>•</span>
          <span className={`flex items-center gap-1 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {isDrawing && (
            <>
              <span>•</span>
              <span className="text-yellow-400">Drawing...</span>
            </>
          )}
        </span>
      </div>
      
      <Tldraw
        onMount={handleMount}
        className="h-full w-full"
        autoFocus={false}
      />
    </div>
  );
}
