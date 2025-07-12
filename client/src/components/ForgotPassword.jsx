import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaEnvelope, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import config from '../config';

const ForgotPassword = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Timer for OTP expiry
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${config.backendUrl}/api/auth/forgot-password`, {
        email
      }, {
        timeout: 15000, // 15 second timeout for production
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess('OTP sent to your email!');
        setStep(2);
        setTimeLeft(600); // 10 minutes
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (error.response?.status === 429) {
        setError('Too many requests. Please wait before trying again.');
      } else if (error.response?.status === 404) {
        setError('No account found with this email address.');
      } else {
        setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const otpString = otp.join('');
    
    // Client-side OTP validation
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(otpString)) {
      setError('OTP must contain only numbers');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${config.backendUrl}/api/auth/verify-otp`, {
        email,
        otp: otpString
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setSuccess('OTP verified successfully!');
        setStep(3);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.message || 'Invalid OTP');
        
        // Reset OTP inputs on failure
        if (error.response.data.message?.includes('Too many failed attempts')) {
          setOtp(['', '', '', '', '', '']);
          setStep(1); // Go back to email step
        }
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${config.backendUrl}/api/auth/reset-password`, {
        resetToken,
        newPassword
      });

      if (response.data.success) {
        setSuccess('Password reset successfully!');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.backendUrl}/api/auth/resend-otp`, {
        email
      });

      if (response.data.success) {
        setSuccess('New OTP sent to your email!');
        setTimeLeft(600);
        setOtp(['', '', '', '', '', '']);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  console.log('ForgotPassword component rendering, step:', step);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <FaArrowLeft className="text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            <p className="text-gray-400 text-sm">
              {step === 1 && "Enter your email to get started"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Create your new password"}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-2 rounded-full flex-1 transition-colors ${
                num <= step
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4"
            >
              <p className="text-green-400 text-sm">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Email */}
        {step === 1 && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleEmailSubmit}
          >
            <div className="space-y-4">
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleOtpSubmit}
          >
            <div className="space-y-6">
              <div>
                <p className="text-gray-400 text-sm mb-4">
                  Enter the 6-digit OTP sent to {email}
                </p>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-center text-lg focus:outline-none focus:border-purple-500 transition-colors"
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>

              {timeLeft > 0 && (
                <p className="text-gray-400 text-sm text-center">
                  OTP expires in {formatTime(timeLeft)}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || timeLeft > 540} // Disable for first 60 seconds
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handlePasswordSubmit}
          >
            <div className="space-y-4">
              <div className="relative">
                <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="relative">
                <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
