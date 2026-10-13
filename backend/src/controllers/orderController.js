const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

// Helper to generate readable Order Number: e.g. ORD-6821
const generateOrderNumber = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${randomSuffix}`;
};

// @desc    Create new customer order (with server-side price snapshot)
// @route   POST /api/orders
// @access  Public (Customer)
const createOrder = async (req, res, next) => {
  try {
    const { tableNumber, items, customerNotes, paymentMethod } = req.body;

    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table number and non-empty items array are required'
      });
    }

    // 1. Verify table exists
    const table = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table #${tableNumber} not found`
      });
    }

    // 2. Fetch all menu items from DB and snapshot verified prices
    const itemIds = items.map(i => i.menuItemId || i._id);
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds } });

    const menuMap = new Map();
    dbMenuItems.forEach(item => {
      menuMap.set(item._id.toString(), item);
    });

    let subtotal = 0;
    const sanitizedItems = [];
    let maxPrepTime = 15;

    for (const cartItem of items) {
      const idStr = (cartItem.menuItemId || cartItem._id || '').toString();
      const dbItem = menuMap.get(idStr);

      if (!dbItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found in menu: ${cartItem.name || idStr}`
        });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${dbItem.name}" is currently sold out and cannot be ordered.`
        });
      }

      const quantity = Math.max(1, parseInt(cartItem.quantity, 10) || 1);
      const linePrice = dbItem.price;
      const lineTotal = linePrice * quantity;
      subtotal += lineTotal;

      if (dbItem.preparationTime && dbItem.preparationTime > maxPrepTime) {
        maxPrepTime = dbItem.preparationTime;
      }

      sanitizedItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: linePrice,
        quantity,
        isVeg: dbItem.isVeg,
        specialInstructions: cartItem.specialInstructions ? cartItem.specialInstructions.trim() : ''
      });
    }

    // 5% GST tax calculation
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + taxAmount;

    // Create unique order number
    let orderNumber = generateOrderNumber();
    let collisionCheck = await Order.findOne({ orderNumber });
    while (collisionCheck) {
      orderNumber = generateOrderNumber();
      collisionCheck = await Order.findOne({ orderNumber });
    }

    const order = await Order.create({
      orderNumber,
      tableNumber: Number(tableNumber),
      items: sanitizedItems,
      subtotal,
      taxAmount,
      totalAmount,
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod: paymentMethod === 'Razorpay' ? 'Razorpay' : 'Counter',
      customerNotes: customerNotes ? customerNotes.trim() : '',
      estimatedPrepTime: maxPrepTime + 5 // buffer
    });

    // Mark table as occupied
    table.status = 'occupied';
    await table.save();

    // Broadcast new order to admin room via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('new_order', {
        order,
        message: `New Order #${order.orderNumber} received for Table ${order.tableNumber}!`,
        playAudio: true
      });
      io.emit('table_status_updated', table);
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders with filtering and pagination
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, tableNumber, date, limit = 100 } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    if (tableNumber) {
      query.tableNumber = Number(tableNumber);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details (for tracking)
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Served', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = status;
    await order.save();

    // If order is Served or Cancelled, check if all active orders on table are finished
    if (status === 'Served' || status === 'Cancelled') {
      const pendingOrders = await Order.find({
        tableNumber: order.tableNumber,
        orderStatus: { $in: ['Pending', 'Accepted', 'Preparing', 'Ready'] }
      });

      if (pendingOrders.length === 0) {
        const table = await Table.findOne({ tableNumber: order.tableNumber });
        if (table && table.status === 'occupied') {
          table.status = 'available';
          await table.save();
          const io = req.app.get('io');
          if (io) io.emit('table_status_updated', table);
        }
      }
    }

    // Broadcast status change to customer tracking room and admin room
    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id.toString()}`).emit('order_status_updated', {
        orderId: order._id,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt
      });
      io.to('admin-room').emit('order_status_updated', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status manually (e.g. Counter payment marked paid)
// @route   PATCH /api/orders/:id/payment-status
// @access  Private (Admin)
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!['Pending', 'Paid', 'Failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order-${order._id.toString()}`).emit('payment_status_updated', {
        orderId: order._id,
        paymentStatus: order.paymentStatus
      });
      io.to('admin-room').emit('order_status_updated', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus
};
