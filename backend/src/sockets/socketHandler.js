const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

    // Admin/Staff joins dedicated room (JWT verified)
    socket.on('join_admin', async (tokenArg) => {
      try {
        const token = tokenArg || socket.handshake.auth?.token;
        if (!token) {
          socket.emit('auth_error', { message: 'Authentication token required for admin room' });
          return;
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'smartserve_jwt_secret_dev_key_2026'
        );
        const user = await User.findById(decoded.id).select('role');
        if (!user || !['admin', 'staff'].includes(user.role)) {
          socket.emit('auth_error', { message: 'Unauthorized role for admin room' });
          return;
        }

        socket.join('admin-room');
        console.log(`👨‍🍳 Socket ${socket.id} (${user.role}) joined admin-room`);
      } catch (err) {
        socket.emit('auth_error', { message: 'Invalid or expired token' });
      }
    });

    // Customer joins order tracking room for real-time status changes
    socket.on('join_order', (orderId) => {
      if (orderId) {
        socket.join(`order-${orderId}`);
        console.log(`📱 Socket ${socket.id} joined order-${orderId}`);
      }
    });

    // Customer or Table display joins table room
    socket.on('join_table', (tableNumber) => {
      if (tableNumber) {
        socket.join(`table-${tableNumber}`);
        console.log(`🍽️ Socket ${socket.id} joined table-${tableNumber}`);
      }
    });

    // Ping / Heartbeat
    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected from Socket.IO: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
