import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaUserMinus, FaInfoCircle, FaTimes } from 'react-icons/fa';

const NotificationToast = ({ notification, onClose }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'user-joined': return <FaUserPlus className="text-green-400" size={16} />;
      case 'user-left': return <FaUserMinus className="text-red-400" size={16} />;
      default: return <FaInfoCircle className="text-blue-400" size={16} />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'user-joined': 
        return 'from-green-500/20 via-emerald-500/20 to-teal-500/20 border-green-400/30';
      case 'user-left': 
        return 'from-red-500/20 via-pink-500/20 to-rose-500/20 border-red-400/30';
      default: 
        return 'from-blue-500/20 via-cyan-500/20 to-indigo-500/20 border-blue-400/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={`bg-gradient-to-r ${getColors(notification.type)} backdrop-blur-xl border rounded-xl p-4 shadow-lg max-w-sm w-full`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon(notification.type)}
          <div>
            <p className="text-white font-medium">{notification.title}</p>
            <p className="text-white/70 text-sm">{notification.message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white/80 transition-colors"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </motion.div>
  );
};

const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showUserJoined = useCallback((username) => {
    addNotification({
      type: 'user-joined',
      title: 'User Joined',
      message: `${username} joined the room`
    });
  }, [addNotification]);

  const showUserLeft = useCallback((username) => {
    addNotification({
      type: 'user-left',
      title: 'User Left',
      message: `${username} left the room`
    });
  }, [addNotification]);

  const NotificationContainerComponent = useCallback(() => (
    <NotificationContainer
      notifications={notifications}
      removeNotification={removeNotification}
    />
  ), [notifications, removeNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    showUserJoined,
    showUserLeft,
    NotificationContainer: NotificationContainerComponent
  };
};

export default NotificationContainer;
