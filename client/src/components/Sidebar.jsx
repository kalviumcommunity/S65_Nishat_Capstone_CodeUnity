import React from 'react';
import { motion } from 'framer-motion';
import { FaFolder, FaUsers, FaPaintBrush, FaComments, FaRobot, FaLock } from 'react-icons/fa';
import codeunityLogo from '../assets/logo.png';

const SideBar = ({ activeTab, setActiveTab, unreadCount }) => {
  const isAuthenticated = !!localStorage.getItem('codeunity_token');
  const usageCount = parseInt(localStorage.getItem('codeunity_usage_count') || '0', 10);
  const isLimitReached = usageCount >= 3;

  const tabs = [
    { id: 'files', icon: FaFolder, label: 'Files', restricted: false },
    { id: 'users', icon: FaUsers, label: 'Users', restricted: !isAuthenticated && isLimitReached },
    { id: 'draw', icon: FaPaintBrush, label: 'Draw', restricted: !isAuthenticated && isLimitReached },
    { id: 'chat', icon: FaComments, label: 'Chat', badge: unreadCount, restricted: !isAuthenticated && isLimitReached },
    { id: 'copilot', icon: FaRobot, label: 'AI', restricted: !isAuthenticated && isLimitReached }
  ];

  return (
    <div className="h-full flex flex-col items-center py-6 relative">
      {/* Logo/Brand */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
          <img 
            src={codeunityLogo} 
            alt="CodeUnity" 
            className="w-8 h-8 object-contain rounded-lg"
          />
        </div>
      </motion.div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-3 flex-1">
        {tabs.map((tab, index) => (
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="relative"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !tab.restricted && setActiveTab(tab.id)}
              disabled={tab.restricted}
              className={`
                relative w-12 h-12 rounded-xl flex items-center justify-center 
                transition-all duration-300 group
                ${activeTab === tab.id
                  ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 shadow-lg shadow-pink-500/10'
                  : tab.restricted
                  ? 'hover:bg-gray-800/20 border border-transparent text-gray-600 cursor-not-allowed'
                  : 'hover:bg-gray-800/30 border border-transparent hover:border-gray-700/30 text-gray-400 hover:text-white'
                }
              `}
              title={tab.restricted ? `${tab.label} (Premium)` : tab.label}
            >
              <tab.icon className={`w-4 h-4 transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-pink-400 scale-110' 
                  : tab.restricted 
                  ? 'text-gray-600' 
                  : 'text-gray-400 group-hover:text-white group-hover:scale-105'
              }`} />
              
              {/* Active indicator */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full"
                  initial={false}
                />
              )}
              
              {/* Badge for chat */}
              {tab.badge > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-white text-xs font-medium">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                </motion.div>
              )}
              
              {/* Restriction indicator */}
              {tab.restricted && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <FaLock className="w-2 h-2 text-black" />
                </div>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Bottom accent */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 w-8 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"
      />
    </div>
  );
};

export default SideBar;
