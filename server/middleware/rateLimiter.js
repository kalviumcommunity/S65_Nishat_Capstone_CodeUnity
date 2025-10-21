const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again later.',
      retryAfter: '15 minutes'
    });
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: {
    success: false,
    message: 'Too many AI requests. Please wait before making more AI queries.'
  },
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  handler: (req, res) => {
    console.log(`🤖 AI rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'AI request limit reached. Please wait 1 minute before trying again.',
      limit: 10,
      window: '1 minute',
      tip: 'Consider batching your AI requests for better efficiency'
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  handler: (req, res) => {
    console.log(`🔐 Auth rate limit exceeded for IP: ${req.ip} - Possible brute force attack`);
    res.status(429).json({
      success: false,
      message: 'Too many failed login attempts. Your account has been temporarily locked for security.',
      retryAfter: '15 minutes',
      security: 'If you forgot your password, use the "Forgot Password" option'
    });
  }
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 emails per hour
  message: {
    success: false,
    message: 'Too many emails sent. Please try again later.'
  },
  handler: (req, res) => {
    console.log(`📧 Email rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Email sending limit reached. You can send 5 emails per hour.',
      retryAfter: '1 hour',
      remainingQuota: 0
    });
  }
});

const codeExecutionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 code executions per minute
  message: {
    success: false,
    message: 'Too many code execution requests. Please wait before running more code.'
  },
  handler: (req, res) => {
    console.log(`⚡ Code execution rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Code execution limit reached. Please wait 1 minute.',
      limit: 20,
      window: '1 minute'
    });
  }
});

const fileOperationsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  max: 30, // Limit each IP to 30 file operations per minute
  message: {
    success: false,
    message: 'Too many file operations. Please slow down.'
  },
  handler: (req, res) => {
    console.log(`📁 File operations rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'File operation limit reached. Please wait before performing more file operations.',
      limit: 30,
      window: '1 minute'
    });
  }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 password reset requests per 15 minutes
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.'
  },
  handler: (req, res) => {
    console.log(`🔑 Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please wait 15 minutes before trying again.',
      retryAfter: '15 minutes',
      security: 'This limit protects your account from unauthorized access attempts'
    });
  }
});

const roomCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 room creations per hour
  message: {
    success: false,
    message: 'Too many rooms created. Please try again later.'
  },
  handler: (req, res) => {
    console.log(`[RATE LIMIT] Room creation limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Room creation limit reached. You can create 10 rooms per hour.',
      retryAfter: '1 hour'
    });
  }
});

const createCustomLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const rateLimitMonitor = (req, res, next) => {
  const rateLimit = req.rateLimit;
  if (rateLimit) {
    console.log(`[RATE LIMIT] Status for ${req.ip} on ${req.path}:`, {
      limit: rateLimit.limit,
      current: rateLimit.current,
      remaining: rateLimit.remaining,
      resetTime: new Date(Date.now() + rateLimit.resetTime)
    });
  }
  next();
};

// Export all rate limiters
module.exports = {
  globalLimiter,
  aiLimiter,
  authLimiter,
  emailLimiter,
  codeExecutionLimiter,
  fileOperationsLimiter,
  forgotPasswordLimiter,
  roomCreationLimiter,
  createCustomLimiter,
  rateLimitMonitor
};
