const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection URI:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diplom');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diplom', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    console.log('MongoDB connected successfully:', {
      host: conn.connection.host,
      port: conn.connection.port,
      name: conn.connection.name,
      state: conn.connection.readyState
    });

    await mongoose.connection.db.admin().ping();
    console.log('MongoDB ping successful');


    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', {
        error: err.message,
        name: err.name,
        stack: err.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', {
        error: err.message,
        name: err.name,
        stack: err.stack
      });
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', {
      error: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    throw error;
  }
};

module.exports = connectDB;