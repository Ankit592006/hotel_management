const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { getRazorpayInstance } = require('../config/razorpay');
const { releaseTableIfSettled } = require('./orderController');

const safeCompareHex = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Public
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot initiate payment for a cancelled order'
      });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(order.totalAmount * 100);
    let razorpayOrderId;

    if (razorpay) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${order.orderNumber}`,
        notes: {
          orderId: order._id.toString(),
          tableNumber: order.tableNumber.toString(),
          orderNumber: order.orderNumber
        }
      };

      const razorpayOrder = await razorpay.orders.create(options);
      razorpayOrderId = razorpayOrder.id;
    } else {
      razorpayOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    order.razorpayOrderId = razorpayOrderId;
    order.paymentMethod = 'Razorpay';
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        orderId: order._id,
        razorpayOrderId,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'created'
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated_demo',
        isSimulation: !razorpay
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify
// @access  Public
const verifyPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot verify payment for a cancelled order'
      });
    }

    // Prevent order-ID swap fraud: ensure razorpay_order_id belongs strictly to THIS order
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Razorpay order ID does not match this order'
      });
    }

    // Idempotency check
    if (order.paymentStatus === 'Paid') {
      return res.json({
        success: true,
        message: 'Order was already verified as Paid',
        data: order
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    let isValidSignature = false;

    if (secret && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValidSignature = safeCompareHex(generatedSignature, razorpay_signature);
    } else if (!secret && razorpay_order_id.startsWith('order_sim_')) {
      isValidSignature = true;
    }

    if (!isValidSignature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'failed'
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Signature & ownership verified
    order.paymentStatus = 'Paid';
    order.paymentMethod = 'Razorpay';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'captured',
        verifiedAt: new Date()
      }
    );

    const io = req.app.get('io');
    await releaseTableIfSettled(order.tableNumber, io);

    if (io) {
      io.to(`order-${order._id.toString()}`).emit('payment_success', {
        orderId: order._id,
        paymentStatus: 'Paid',
        razorpayPaymentId: razorpay_payment_id
      });
      io.to('admin-room').emit('order_status_updated', order);
    }

    res.json({
      success: true,
      message: 'Payment verified and confirmed successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook for asynchronous server-to-server confirmation
// @route   POST /api/payments/webhook
// @access  Public (Strictly validated with webhook secret signature)
const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({ message: 'Webhook secret is not configured on server' });
    }

    const receivedSignature = req.headers['x-razorpay-signature'];
    if (!receivedSignature) {
      return res.status(400).json({ message: 'Missing webhook signature header' });
    }

    const bodyPayload = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyPayload)
      .digest('hex');

    if (!safeCompareHex(expectedSignature, receivedSignature)) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload && payload.payment ? payload.payment.entity : null;
      const razorpayOrderId = paymentEntity ? paymentEntity.order_id : null;
      const razorpayPaymentId = paymentEntity ? paymentEntity.id : null;

      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.paymentStatus !== 'Paid' && order.orderStatus !== 'Cancelled') {
          order.paymentStatus = 'Paid';
          order.razorpayPaymentId = razorpayPaymentId;
          await order.save();

          await Payment.findOneAndUpdate(
            { razorpayOrderId },
            {
              status: 'captured',
              razorpayPaymentId,
              webhookPayload: req.body,
              verifiedAt: new Date()
            }
          );

          const io = req.app.get('io');
          await releaseTableIfSettled(order.tableNumber, io);

          if (io) {
            io.to(`order-${order._id.toString()}`).emit('payment_success', {
              orderId: order._id,
              paymentStatus: 'Paid',
              razorpayPaymentId
            });
            io.to('admin-room').emit('order_status_updated', order);
          }
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook
};
