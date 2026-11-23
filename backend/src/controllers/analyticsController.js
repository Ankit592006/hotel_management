const Order = require('../models/Order');

// Compute start of today in the restaurant's local timezone (defaults to IST UTC+5:30 = +330 mins)
const getRestaurantTodayStartUTC = () => {
  const offsetMinutes = Number(process.env.RESTAURANT_TZ_OFFSET_MINUTES ?? 330);
  const nowUtcMs = Date.now();
  const localNow = new Date(nowUtcMs + offsetMinutes * 60 * 1000);
  localNow.setUTCHours(0, 0, 0, 0);
  return new Date(localNow.getTime() - offsetMinutes * 60 * 1000);
};

// @desc    Get sales and order analytics (MongoDB aggregation, timezone-aware)
// @route   GET /api/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const todayStart = getRestaurantTodayStartUTC();

    const [result] = await Order.aggregate([
      {
        $facet: {
          summary: [
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            {
              $group: {
                _id: null,
                totalOrdersCount: { $sum: 1 },
                totalRevenue: {
                  $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$totalAmount', 0] }
                },
                todayOrdersCount: {
                  $sum: { $cond: [{ $gte: ['$createdAt', todayStart] }, 1, 0] }
                },
                todayRevenue: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gte: ['$createdAt', todayStart] }, { $eq: ['$paymentStatus', 'Paid'] }] },
                      '$totalAmount',
                      0
                    ]
                  }
                },
                razorpayCount: {
                  $sum: { $cond: [{ $eq: ['$paymentMethod', 'Razorpay'] }, 1, 0] }
                },
                counterCount: {
                  $sum: { $cond: [{ $eq: ['$paymentMethod', 'Counter'] }, 1, 0] }
                },
                paidCount: {
                  $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] }
                },
                unpaidCount: {
                  $sum: { $cond: [{ $ne: ['$paymentStatus', 'Paid'] }, 1, 0] }
                }
              }
            }
          ],
          statusCounts: [
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
          ],
          popularItems: [
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.name',
                totalOrdered: { $sum: '$items.quantity' },
                // Count revenue strictly from Paid orders so it matches totalRevenue
                revenueGenerated: {
                  $sum: {
                    $cond: [
                      { $eq: ['$paymentStatus', 'Paid'] },
                      { $multiply: ['$items.price', '$items.quantity'] },
                      0
                    ]
                  }
                }
              }
            },
            { $sort: { totalOrdered: -1 } },
            { $limit: 6 }
          ]
        }
      }
    ]);

    const summary = (result && result.summary && result.summary[0]) || {
      totalOrdersCount: 0,
      totalRevenue: 0,
      todayOrdersCount: 0,
      todayRevenue: 0,
      razorpayCount: 0,
      counterCount: 0,
      paidCount: 0,
      unpaidCount: 0
    };

    const statusCounts = {
      Pending: 0,
      Accepted: 0,
      Preparing: 0,
      Ready: 0,
      Served: 0,
      Cancelled: 0
    };

    (result?.statusCounts || []).forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    const paymentBreakdown = {
      Razorpay: summary.razorpayCount,
      Counter: summary.counterCount,
      Paid: summary.paidCount,
      Unpaid: summary.unpaidCount
    };

    res.json({
      success: true,
      data: {
        totalRevenue: summary.totalRevenue,
        todayRevenue: summary.todayRevenue,
        totalOrdersCount: summary.totalOrdersCount,
        todayOrdersCount: summary.todayOrdersCount,
        statusCounts,
        paymentBreakdown,
        popularItems: result?.popularItems || [],
        averageOrderValue: summary.paidCount > 0 ? Math.round(summary.totalRevenue / summary.paidCount) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};
