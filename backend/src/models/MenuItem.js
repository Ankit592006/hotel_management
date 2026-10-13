const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dish name is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  preparationTime: {
    type: Number,
    default: 15, // in minutes
    min: 1
  },
  spicyLevel: {
    type: Number,
    default: 1, // 0: Mild, 1: Medium, 2: Hot, 3: Extra Hot
    min: 0,
    max: 3
  },
  rating: {
    type: Number,
    default: 4.8,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
