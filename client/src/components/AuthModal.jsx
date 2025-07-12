import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaGithub, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import ForgotPassword from './ForgotPassword';

const BACKEND_URL = import.meta.env.PROD 
  ? 'https://s65-nishat-capstone-codeunity-swbt.onrender.com'
  : 'http://localhost:8080';

const AuthModal = ({ isOpen, onClose, onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
    }
  }, [isOpen, isLogin]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    if (!isLogin) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        // Store user data in localStorage
        localStorage.setItem('codeunity_user', JSON.stringify(response.data.user));
        localStorage.setItem('codeunity_token', response.data.token);
        
        // Reset usage tracking for authenticated users
        localStorage.removeItem('codeunity_usage_count');
        
        onAuth(response.data.user);
        onClose();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({
        general: error.response?.data?.message || 'Authentication failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/30 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome Back!' : 'Join CodeUnity'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Login/Signup */}
            <div className="flex mb-6 p-1 bg-gray-800/50 rounded-xl">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLogin
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !isLogin
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <motion.div
                  variants={inputVariants}
                  whileFocus="focus"
                  className="relative"
                >
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all duration-200"
                    placeholder="Enter your username"
                  />
                </motion.div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                )}
              </div>

              {/* Email (only for signup) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <motion.div
                    variants={inputVariants}
                    whileFocus="focus"
                    className="relative"
                  >
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </motion.div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <motion.div
                  variants={inputVariants}
                  whileFocus="focus"
                  className="relative"
                >
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </motion.div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password (only for signup) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <motion.div
                    variants={inputVariants}
                    whileFocus="focus"
                    className="relative"
                  >
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all duration-200"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </motion.div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{errors.general}</p>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </motion.button>

              {/* Forgot Password Link */}
              {isLogin && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Forgot password clicked');
                      alert('Forgot password clicked!'); // Temporary debug
                      setShowForgotPassword(true);
                    }}
                    className="text-sm text-pink-400 hover:text-pink-300 transition-colors underline"
                  >
                    Forgot your password?
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Debug: isLogin={isLogin.toString()}, showForgotPassword={showForgotPassword.toString()}</p>
                </div>
              )}
            </form>

            {/* OAuth Options */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white hover:bg-gray-800 transition-all duration-200"
                >
                  <FaGoogle className="w-4 h-4" />
                  <span className="text-sm">Google</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white hover:bg-gray-800 transition-all duration-200"
                >
                  <FaGithub className="w-4 h-4" />
                  <span className="text-sm">GitHub</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <>
          {console.log('Rendering ForgotPassword component')}
          <ForgotPassword
            onBack={() => setShowForgotPassword(false)}
            onSuccess={() => {
              setShowForgotPassword(false);
              onClose();
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
