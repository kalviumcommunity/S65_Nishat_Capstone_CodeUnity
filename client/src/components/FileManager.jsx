import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFile, FiTrash2, FiPlus, FiEdit2 } from 'react-icons/fi';

const FileExplorer = ({
  fileTree = [],
  onFileClick,
  onAdd,
  onRename,
  onDelete,
  currentFile,
  className = ''
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newItemName.trim() && !isLoading) {
      setIsLoading(true);
      try {
        await onAdd(newItemName.trim(), 'file');
        setNewItemName('');
        setIsCreating(false);
      } catch (error) {
        console.error('Error creating file:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelCreate = () => {
    if (!isLoading) {
      setIsCreating(false);
      setNewItemName('');
    }
  };

  const handleRename = async (e, oldFileName) => {
    e.preventDefault();
    if (renameValue.trim() && !isLoading && renameValue !== oldFileName) {
      setIsLoading(true);
      try {
        await onRename(oldFileName, renameValue.trim());
        setRenamingFile(null);
        setRenameValue('');
      } catch (error) {
        console.error('Error renaming file:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startRename = (fileName) => {
    if (!isLoading) {
      setRenamingFile(fileName);
      setRenameValue(fileName);
    }
  };

  const cancelRename = () => {
    if (!isLoading) {
      setRenamingFile(null);
      setRenameValue('');
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Add File Button */}
      {!isCreating && (
        <div className="p-4 border-b border-pink-500/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreating(true)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 text-pink-400 hover:from-pink-500/20 hover:to-purple-600/20 hover:border-pink-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus className="w-4 h-4" />
            <span className="font-medium">New File</span>
          </motion.button>
        </div>
      )}

      {/* File Creation Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-b border-pink-500/10 bg-pink-500/5"
          >
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="filename.js"
                disabled={isLoading}
                className="w-full bg-black/20 backdrop-blur-sm border border-pink-500/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </motion.button>
                <motion.button
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  type="button"
                  onClick={cancelCreate}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg bg-gray-700/30 text-gray-300 hover:bg-gray-600/30 border border-gray-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {fileTree.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FiFile className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm text-gray-300">No files yet</p>
            <p className="text-xs text-gray-500 mt-1">Create your first file to get started</p>
          </div>
        ) : (
          fileTree.filter(item => item.type !== 'folder').map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`group ${renamingFile === item.name ? 'bg-pink-500/5' : ''}`}
            >
              {renamingFile === item.name ? (
                // Rename Mode
                <div className="px-3 py-2.5">
                  <form onSubmit={(e) => handleRename(e, item.name)} className="space-y-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-black/20 backdrop-blur-sm border border-pink-500/20 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Renaming...
                          </>
                        ) : (
                          'Rename'
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        type="button"
                        onClick={cancelRename}
                        disabled={isLoading}
                        className="px-2 py-1.5 text-xs rounded-lg bg-gray-700/30 text-gray-300 hover:bg-gray-600/30 border border-gray-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </form>
                </div>
              ) : (
                // Normal Mode
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  currentFile === item.name
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/40 shadow-lg shadow-pink-500/10'
                    : 'hover:bg-pink-500/5 border border-transparent hover:border-pink-500/20'
                }`}>
                  <button
                    onClick={() => onFileClick(item.name)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <FiFile className={`w-4 h-4 shrink-0 ${
                      currentFile === item.name ? 'text-pink-400' : 'text-gray-400 group-hover:text-pink-400'
                    } transition-colors duration-200`} />
                    <span className={`truncate text-sm ${
                      currentFile === item.name ? 'text-white font-medium' : 'text-gray-300 group-hover:text-white'
                    } transition-colors duration-200`}>
                      {item.name}
                    </span>
                  </button>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Rename button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(item.name);
                      }}
                      className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 border border-transparent hover:border-blue-400/20 transition-all duration-200"
                      title="Rename file"
                    >
                      <FiEdit2 className="w-3 h-3" />
                    </motion.button>
                    
                    {/* Delete button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${item.name}"?`)) {
                          onDelete(item.name);
                        }
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all duration-200"
                      title="Delete file"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
