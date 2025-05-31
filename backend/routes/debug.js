const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Item = require('../models/Item');


router.get('/', async (req, res) => {
  try {
    console.log('Debug route accessed');
    
    // Перевірити підключення до БД
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection error',
        state: mongoose.connection.readyState
      });
    }

    // Лист всіх колекцій
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Загальна кількість предметів
    const totalCount = await Item.countDocuments();
    console.log('Total items in database:', totalCount);

    // Отримати всі предмети
    const allItems = await Item.find().limit(5);
    console.log('Sample items:', allItems.map(item => ({
      id: item._id,
      title: item.title,
      user: item.user
    })));

    res.json({
      message: 'Debug successful',
      collections: collections.map(c => c.name),
      totalItems: totalCount,
      sampleItems: allItems,
      mongooseState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('Debug error:', {
      error: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      message: 'Debug failed',
      error: error.message
    });
  }
});

module.exports = router; 