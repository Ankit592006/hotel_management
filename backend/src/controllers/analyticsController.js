const Order = require('../models/Order');

// @desc    Get sales and order analytics
// @route   GET /api/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total Metrics
    const allOrders = await Order.find({ orderStatus: { $ne: 'Cancelled' } });
    const totalOrdersCount = allOrders.length;
    const totalRevenue = allOrders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Today's Metrics
    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // 3. Status Counts
    const statusCounts = {
      Pending: 0,
      Accepted: 0,
      Preparing: 0,
      Ready: 0,
      Served: 0,
      Cancelled: 0
    };

    const rawStatusCounts = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    rawStatusCounts.forEach(item => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    // 4. Payment breakdown
    const paymentBreakdown = {
      Razorpay: 0,
      Counter: 0,
      Paid: 0,
      Unpaid: 0
    };

    allOrders.forEach(o => {
      if (o.paymentMethod === 'Razorpay') paymentBreakdown.Razorpay++;
      if (o.paymentMethod === 'Counter') paymentBreakdown.Counter++;
      if (o.paymentStatus === 'Paid') paymentBreakdown.Paid++;
      else paymentBreakdown.Unpaid++;
    });

    // 5. Popular Items (Top 5)
    const popularItemsAggregation = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalOrdered: { $sum: '$items.quantity' },
          revenueGenerated: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        totalOrdersCount,
        todayOrdersCount,
        statusCounts,
        paymentBreakdown,
        popularItems: popularItemsAggregation,
        averageOrderValue: totalOrdersCount > 0 ? Math.round(totalRevenue / (paymentBreakdown.Paid || 1)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};
