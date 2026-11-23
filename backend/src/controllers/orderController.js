const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const MAX_ITEMS_PER_ORDER = 50;
const MAX_QTY_PER_ITEM = 50;

// Strict order status state machine
const ALLOWED_STATUS_TRANSITIONS = {
  Pending: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Served', 'Cancelled'],
  Served: [],
  Cancelled: []
};

// Helper to generate readable Order Number: e.g. ORD-6821
const generateOrderNumber = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${randomSuffix}`;
};

// Helper: Free a table only when it has NO active orders AND NO unpaid served orders
const releaseTableIfSettled = async (tableNumber, io) => {
  const unresolvedOrdersCount = await Order.countDocuments({
    tableNumber,
    $or: [
      { orderStatus: { $in: ['Pending', 'Accepted', 'Preparing', 'Ready'] } },
      { orderStatus: 'Served', paymentStatus: { $ne: 'Paid' } }
    ]
  });

  if (unresolvedOrdersCount === 0) {
    const table = await Table.findOne({ tableNumber });
    if (table && table.status === 'occupied') {
      table.status = 'available';
      await table.save();
      if (io) io.emit('table_status_updated', table);
    }
  }
};

// @desc    Create new customer order (with server-side price snapshot)
// @route   POST /api/orders
// @access  Public (Customer)
const createOrder = async (req, res, next) => {
  try {
    const { tableNumber, items, customerNotes, paymentMethod } = req.body;

    const parsedTableNumber = Number(tableNumber);
    if (!Number.isInteger(parsedTableNumber) || parsedTableNumber < 1) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive table number is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty items array is required'
      });
    }

    if (items.length > MAX_ITEMS_PER_ORDER) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_ITEMS_PER_ORDER} items allowed per order`
      });
    }

    // 1. Verify table exists and is active
    const table = await Table.findOne({ tableNumber: parsedTableNumber, isActive: true });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table #${parsedTableNumber} not found`
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

      const rawQty = parseInt(cartItem.quantity, 10);
      if (isNaN(rawQty) || rawQty < 1 || rawQty > MAX_QTY_PER_ITEM) {
        return res.status(400).json({
          success: false,
          message: `Quantity for "${dbItem.name}" must be between 1 and ${MAX_QTY_PER_ITEM}`
        });
      }

      const quantity = rawQty;
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
        specialInstructions: cartItem.specialInstructions ? String(cartItem.specialInstructions).trim().slice(0, 200) : ''
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
      tableNumber: parsedTableNumber,
      items: sanitizedItems,
      subtotal,
      taxAmount,
      totalAmount,
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod: paymentMethod === 'Razorpay' ? 'Razorpay' : 'Counter',
      customerNotes: customerNotes ? String(customerNotes).trim().slice(0, 300) : '',
      estimatedPrepTime: maxPrepTime + 5
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
// @access  Private (Admin / Staff)
const getOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, tableNumber, date, limit = 100 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    if (tableNumber) {
      const parsedTable = Number(tableNumber);
      if (!isNaN(parsedTable)) {
        query.tableNumber = parsedTable;
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 500);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit);

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

// @desc    Update order status (enforces state machine)
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin / Staff)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = Object.keys(ALLOWED_STATUS_TRANSITIONS);

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

    if (order.orderStatus === status) {
      return res.json({ success: true, data: order });
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[order.orderStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition order from "${order.orderStatus}" to "${status}".`
      });
    }

    order.orderStatus = status;
    await order.save();

    const io = req.app.get('io');

    // Release table only if all active AND unpaid served orders on this table are settled
    if (status === 'Served' || status === 'Cancelled') {
      await releaseTableIfSettled(order.tableNumber, io);
    }

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
// @access  Private (Admin / Staff)
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

    if (order.orderStatus === 'Cancelled' && paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark a cancelled order as Paid'
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    const io = req.app.get('io');

    // If counter order was already served and is now paid, release table if all orders settled
    if (paymentStatus === 'Paid') {
      await releaseTableIfSettled(order.tableNumber, io);
    }

    if (io) {
      const payload = {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        razorpayPaymentId: order.razorpayPaymentId
      };
      io.to(`order-${order._id.toString()}`).emit('payment_status_updated', payload);
      if (paymentStatus === 'Paid') {
        io.to(`order-${order._id.toString()}`).emit('payment_success', payload);
      }
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
  updatePaymentStatus,
  releaseTableIfSettled
};
