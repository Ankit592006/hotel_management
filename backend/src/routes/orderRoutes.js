const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', createOrder);
router.get('/:id', getOrderById);

// Protected Admin Routes
router.get('/', protect, authorize('admin', 'staff'), getOrders);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus);
router.patch('/:id/payment-status', protect, authorize('admin', 'staff'), updatePaymentStatus);

module.exports = router;
