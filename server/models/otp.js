const mongoose = require('mongoose');

// Production-ready OTP storage using MongoDB with TTL
const OTPSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    index: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  attempts: { 
    type: Number, 
    default: 0,
    max: 3
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 600 // 10 minutes TTL - MongoDB will auto-delete
  }
});

// Compound index for better performance
OTPSchema.index({ email: 1, createdAt: 1 });

const OTP = mongoose.model('OTP', OTPSchema);

module.exports = OTP;
