/**
 * MongoDB Database Configuration
 * Handles MongoDB connection with production-ready settings
 */

const mongoose = require('mongoose');

let isConnected = false;

/**
 * MongoDB connection options
 */
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  heartbeatFrequencyMS: 10000,
  maxConnecting: 2,
  family: 4
};

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
  if (isConnected) {
    console.log('MongoDB: Using existing connection');
    return mongoose.connection;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    console.log('MongoDB: Attempting to connect...');
    console.log('MongoDB: Environment:', process.env.NODE_ENV || 'development');

    mongoose.set('bufferCommands', false);

    await mongoose.connect(MONGODB_URI, mongooseOptions);

    isConnected = true;
    console.log('MongoDB: Connected successfully');
    console.log('MongoDB: Connection state:', mongoose.connection.readyState);

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB: Connection error:', error.message);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB: Connection closed');
  } catch (error) {
    console.error('MongoDB: Error closing connection:', error.message);
    throw error;
  }
};

/**
 * Setup MongoDB event listeners
 */
const setupDatabaseEvents = () => {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB: Connected');
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB: Error:', err.message);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB: Disconnected');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB: Reconnected');
    isConnected = true;
  });

  mongoose.connection.on('timeout', () => {
    console.log('MongoDB: Connection timeout');
  });

  mongoose.connection.on('close', () => {
    console.log('MongoDB: Connection closed');
    isConnected = false;
  });
};

/**
 * Get connection status
 */
const isDatabaseConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  setupDatabaseEvents,
  isDatabaseConnected
};
