const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  acceptCashPayment
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', createOrder);
router.get('/:id', getOrderById);

// Protected Admin / Staff Routes
router.get('/', protect, authorize('admin', 'staff'), getOrders);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus);
router.patch('/:id/payment-status', protect, authorize('admin', 'staff'), updatePaymentStatus);
router.post('/:id/accept-cash', protect, authorize('admin', 'staff'), acceptCashPayment);

module.exports = router;
