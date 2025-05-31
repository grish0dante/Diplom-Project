require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.js');
const itemRoutes = require('./routes/items');
const mongoose = require('mongoose');


const app = express();


app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});


app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);


app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});


app.use((req, res) => {
  console.log('404 Not Found:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  res.status(404).json({ 
    message: 'Not Found',
    path: req.url,
    method: req.method
  });
});


connectDB().then(() => {
  console.log('MongoDB connection established');
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
