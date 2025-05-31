const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  description_big: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  modelUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Архітектура', 'Меблі', 'Техніка', 'Іграшки', 'Інше']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

itemSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema); 