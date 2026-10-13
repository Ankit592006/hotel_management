const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook
} = require('../controllers/paymentController');

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', razorpayWebhook);

module.exports = router;
