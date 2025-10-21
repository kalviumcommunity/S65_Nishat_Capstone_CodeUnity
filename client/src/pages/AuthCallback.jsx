import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthCallback = ({ onAuth }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      setTimeout(() => {
        navigate('/');
      }, 3000);
      return;
    }

    if (token && username) {
      try {
        // Store user data in localStorage
        const userData = {
          username: decodeURIComponent(username),
          email: email ? decodeURIComponent(email) : '',
        };
        
        localStorage.setItem('codeunity_user', JSON.stringify(userData));
        localStorage.setItem('codeunity_token', token);
        localStorage.removeItem('codeunity_usage_count');

        // Notify parent component of authentication
        if (onAuth) {
          onAuth(userData);
        }

        // Redirect to home
        setTimeout(() => {
          navigate('/');
          window.location.reload(); // Reload to update auth state
        }, 500);
      } catch (err) {
        console.error('Error processing OAuth callback:', err);
        setError('Failed to process authentication');
      }
    } else {
      setError('Invalid authentication response');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [searchParams, navigate, onAuth]);

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-red-500 mb-4">{error}</h1>
          <p className="text-gray-400">Redirecting to home...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-white mb-2">Completing Sign In</h1>
        <p className="text-gray-400">Please wait while we authenticate you...</p>
      </motion.div>
    </div>
  );
};

export default AuthCallback;
