
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/user');
const Room = require('../models/room');
const OTP = require('../models/otp');
const router = express.Router();

// Import rate limiters from middleware
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');
const requestCounts = new Map();

// Configure nodemailer with production settings
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true, // Enable connection pooling for production
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 14, // Max 14 emails per second (Gmail limit)
    secure: false, // Use TLS
    requireTLS: true
  });
};

const transporter = createTransporter();

// Production-ready rate limiting middleware
const rateLimitForgotPassword = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const email = req.body.email;
  const key = `${clientIP}-${email}`;
  
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3; // Max 3 requests per 15 minutes per IP+email combo
  
  // Clean old entries
  for (const [k, v] of requestCounts.entries()) {
    if (now - v.firstRequest > windowMs) {
      requestCounts.delete(k);
    }
  }
  
  const requestData = requestCounts.get(key);
  
  if (!requestData) {
    requestCounts.set(key, { count: 1, firstRequest: now });
    next();
  } else if (requestData.count < maxRequests) {
    requestData.count++;
    next();
  } else {
    return res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please try again later.'
    });
  }
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Sign up route with rate limiting
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    if (username.length < 2 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 2 and 30 characters'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username ? 'Username already exists' : 'Email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription.tier,
        avatar: null
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login route with rate limiting (protects against brute force attacks)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Update last active
    user.usage.lastActiveAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription.tier,
        avatar: user.oauth?.google?.picture || 
                user.oauth?.github?.avatar_url || 
                user.oauth?.discord?.avatar || 
                null
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription.tier,
        avatar: user.oauth?.google?.picture || 
                user.oauth?.github?.avatar_url || 
                user.oauth?.discord?.avatar || 
                null,
        roomHistory: user.roomHistory,
        usage: user.usage
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const user = req.user;

    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription.tier,
        avatar: user.oauth?.google?.picture || 
                user.oauth?.github?.avatar_url || 
                user.oauth?.discord?.avatar || 
                null
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add room to user's history
router.post('/room-history', authenticateToken, async (req, res) => {
  try {
    const { roomId, roomName, role } = req.body;
    const user = req.user;

    await user.addRoomToHistory(roomId, roomName || roomId, role || 'participant');

    res.json({
      success: true,
      message: 'Room added to history'
    });
  } catch (error) {
    console.error('Room history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's room history
router.get('/room-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('roomHistory');
    res.json({
      success: true,
      roomHistory: user.roomHistory
    });
  } catch (error) {
    console.error('Room history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (client-side only, but we can track it server-side)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Update last active time
    req.user.usage.lastActiveAt = new Date();
    await req.user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      subscription: req.user.subscription.tier,
      avatar: req.user.oauth?.google?.picture || 
              req.user.oauth?.github?.avatar_url || 
              req.user.oauth?.discord?.avatar || 
              null
    }
  });
});

// Forgot password - request OTP with enhanced rate limiting
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database with TTL
    const otpRecord = new OTP({
      email,
      otp,
      attempts: 0
    });
    await otpRecord.save();

    // Send OTP email with production-ready error handling
    const mailOptions = {
      from: {
        name: 'CodeUnity',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'CodeUnity - Password Reset OTP',
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #111827;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">CodeUnity Password Reset</h1>
          </div>
          <div style="background: #1f2937; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #374151;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 20px;">Reset Your Password</h2>
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.5;">
              Hi <strong style="color: white;">${user.username}</strong>,<br><br>
              You requested to reset your password for your CodeUnity account. Use the OTP below to verify your identity:
            </p>
            <div style="background: #374151; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #4b5563;">
              <h3 style="color: #ec4899; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: monospace; font-weight: bold;">${otp}</h3>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">
              This OTP will expire in 10 minutes for security reasons.<br>
              If you didn't request this reset, please ignore this email.
            </p>
            <div style="background: #1f2937; border: 1px solid #ec4899; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="color: #fbbf24; font-size: 14px; margin: 0;">
                <strong>Security Notice:</strong> Never share this OTP with anyone. CodeUnity support will never ask for your OTP.
              </p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            © 2025 CodeUnity. All rights reserved.
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent successfully to ${email}`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't expose email errors to client for security
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email address',
      // Don't expose email in production for security
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    // Get stored OTP from database
    const storedOTP = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired. Please request a new one.'
      });
    }

    // Check attempts
    if (storedOTP.attempts >= 3) {
      await OTP.deleteMany({ email });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      await storedOTP.save();
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.`
      });
    }

    // OTP verified successfully
    // Generate a temporary reset token with enhanced security
    const resetToken = jwt.sign(
      { 
        email, 
        purpose: 'password_reset',
        timestamp: Date.now(),
        // Add additional entropy for security
        nonce: crypto.randomBytes(16).toString('hex')
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Remove OTP from database
    await OTP.deleteMany({ email });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
      expiresIn: '15 minutes'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    // Enhanced password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password must be less than 128 characters'
      });
    }

    // Verify reset token with enhanced validation
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'password_reset') {
        throw new Error('Invalid token purpose');
      }

      // Check token age (additional security)
      const tokenAge = Date.now() - decoded.timestamp;
      if (tokenAge > 15 * 60 * 1000) { // 15 minutes
        throw new Error('Token expired');
      }

    } catch (error) {
      console.error('Reset token verification error:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Find user
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password with higher salt rounds for production
    const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    user.usage.lastActiveAt = new Date(); // Update last active
    await user.save();

    // Log security event (optional - for audit trail)
    console.log(`Password reset successful for user: ${user.username} (${user.email}) at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resend OTP with rate limiting
router.post('/resend-otp', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Generate new OTP
    const otp = generateOTP();

    // Store new OTP in database
    const otpRecord = new OTP({
      email,
      otp,
      attempts: 0
    });
    await otpRecord.save();

    // Send OTP email
    const mailOptions = {
      from: {
        name: 'CodeUnity',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'CodeUnity - Password Reset OTP (Resent)',
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #111827;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">CodeUnity Password Reset</h1>
          </div>
          <div style="background: #1f2937; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #374151;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 20px;">Your New OTP</h2>
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.5;">
              Hi <strong style="color: white;">${user.username}</strong>,<br><br>
              Here's your new OTP for password reset:
            </p>
            <div style="background: #374151; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #4b5563;">
              <h3 style="color: #ec4899; margin: 0; font-size: 32px; letter-spacing: 5px; font-family: monospace; font-weight: bold;">${otp}</h3>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">
              This OTP will expire in 10 minutes for security reasons.
            </p>
            <div style="background: #1f2937; border: 1px solid #ec4899; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="color: #fbbf24; font-size: 14px; margin: 0;">
                <strong>Security Notice:</strong> Never share this OTP with anyone. CodeUnity support will never ask for your OTP.
              </p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            © 2025 CodeUnity. All rights reserved.
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Resent OTP successfully to ${email}`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'New OTP sent to your email address',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.'
    });
  }
});

module.exports = router;
