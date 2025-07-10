import React from 'react';
import { motion } from 'framer-motion';
import codeunityLogo from '../assets/logo.png';
import { FaDesktop, FaLaptop } from 'react-icons/fa';

function MobileError() {
  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      {/* Animated background matching landing page */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        {/* Animated geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-pink-500/5 to-purple-600/5 rounded-3xl transform rotate-45 animate-pulse"></div>
        <div className="absolute bottom-40 right-32 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-pink-600/5 rounded-2xl transform -rotate-12 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-pink-400/5 to-purple-500/5 rounded-xl transform rotate-12 animate-pulse delay-2000"></div>
        
        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/10 to-transparent transform rotate-12 origin-left"></div>
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/10 to-transparent transform -rotate-12 origin-right"></div>
        
        {/* Radial glows */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-radial from-pink-500/3 via-pink-500/1 to-transparent rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-radial from-purple-500/3 via-purple-500/1 to-transparent rounded-full"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            {/* Logo */}
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="relative flex items-center gap-4">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-600/20 blur-xl rounded-full"></div>
                <img 
                  src={codeunityLogo} 
                  alt="CodeUnity" 
                  className="relative h-16 w-auto object-contain rounded-xl"
                />
                <div className="relative">
                  <h2 className="text-2xl font-bold tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
                      CODE
                    </span>
                    <span className="text-white"> UNITY</span>
                  </h2>
                </div>
              </div>
            </motion.div>
            
            {/* Title */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-white">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
                  Desktop
                </span>
                <span className="text-white"> Experience Required</span>
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                CodeUnity's collaborative features are optimized for desktop devices. 
                Please switch to a desktop browser to access the full editor experience.
              </p>
            </motion.div>

            {/* Feature Card */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-600/10 blur-xl rounded-2xl"></div>
              <motion.div 
                className="relative bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-pink-500/20 shadow-xl shadow-black/20"
                whileHover={{ 
                  scale: 1.02,
                  borderColor: 'rgba(236, 72, 153, 0.4)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 30px rgba(236, 72, 153, 0.1)'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-center gap-6 mb-6">
                  <motion.div
                    className="p-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <FaDesktop className="w-6 h-6 text-pink-400" />
                  </motion.div>
                  <div className="text-gray-400 text-xl">+</div>
                  <motion.div
                    className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <FaLaptop className="w-6 h-6 text-purple-400" />
                  </motion.div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  For the best collaborative coding experience, use a desktop or laptop computer with a modern web browser.
                </p>
              </motion.div>
            </motion.div>

            {/* Bottom Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-xs text-gray-500"
            >
              Real-time collaboration • AI assistance • Live whiteboard
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MobileError;
