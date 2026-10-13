const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  specialInstructions: {
    type: String,
    default: '',
    trim: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  tableNumber: {
    type: Number,
    required: [true, 'Table number is required'],
    index: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Preparing', 'Ready', 'Served', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['Razorpay', 'Counter'],
    default: 'Counter'
  },
  razorpayOrderId: {
    type: String,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  customerNotes: {
    type: String,
    default: '',
    trim: true
  },
  estimatedPrepTime: {
    type: Number,
    default: 20 // minutes
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
