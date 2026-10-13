const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

    // Admin joins dedicated room for live incoming orders & status updates
    socket.on('join_admin', () => {
      socket.join('admin-room');
      console.log(`👨‍🍳 Socket ${socket.id} joined admin-room`);
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
