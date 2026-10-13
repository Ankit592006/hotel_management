import React, { useState, useEffect } from 'react';
import {
  Clock,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  Volume2,
  Filter,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../api/client';

const STATUS_FILTERS = ['Active', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Served', 'All'];

export const LiveOrdersPage = ({ onOrdersCountChange }) => {
  const { socket, joinAdmin, playChime } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  // Fetch initial orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({ limit: 100 });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    joinAdmin();
  }, []);

  // Update badge count
  useEffect(() => {
    const activeCount = orders.filter((o) =>
      ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.orderStatus)
    ).length;
    if (onOrdersCountChange) onOrdersCountChange(activeCount);
  }, [orders, onOrdersCountChange]);

  // Socket.IO event listeners for live incoming orders
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      console.log('🔔 Live Order Received in Admin:', data);
      playChime();

      setOrders((prev) => [data.order, ...prev]);

      // Trigger visual banner
      setNewOrderAlert(`New Order #${data.order.orderNumber} for Table ${data.order.tableNumber}!`);
      setTimeout(() => setNewOrderAlert(null), 8000);
    };

    const handleStatusUpdated = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o))
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdated);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdated);
    };
  }, [socket, playChime]);

  // Status progression action
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Payment status toggle (e.g. Counter Payment cash received)
  const handleMarkPaid = async (orderId) => {
    try {
      const res = await api.updatePaymentStatus(orderId, 'Paid');
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: 'Paid' } : o))
        );
      }
    } catch (err) {
      alert(`Failed to update payment status: ${err.message}`);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (filter === 'Active') {
      return ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(order.orderStatus);
    }
    if (filter === 'All') return true;
    return order.orderStatus === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'pending';
      case 'Accepted': return 'accepted';
      case 'Preparing': return 'preparing';
      case 'Ready': return 'ready';
      case 'Served': return 'served';
      case 'Cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  const getTimeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div>
      {/* Top Controls & Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Live Kitchen & Floor Board</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time table orders feed • Instant status dispatch
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-secondary" onClick={playChime} title="Test Sound Chime">
            <Volume2 size={16} />
            <span>Test Chime</span>
          </button>
          <button className="btn-secondary" onClick={fetchOrders} title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Visual New Order Alert Popup */}
      {newOrderAlert && (
        <div
          className="glass-panel pulse-glow animate-slide-up"
          style={{
            marginBottom: '20px',
            padding: '14px 20px',
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(234, 88, 12, 0.2) 100%)',
            border: '1.5px solid var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={22} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>{newOrderAlert}</span>
          </div>
          <button className="btn-icon" onClick={() => setNewOrderAlert(null)} style={{ width: '32px', height: '32px' }}>
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          marginBottom: '24px',
          paddingBottom: '4px'
        }}
      >
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              background: filter === s ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
              color: filter === s ? '#0f172a' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              border: `1px solid ${filter === s ? 'transparent' : 'var(--border-subtle)'}`,
              transition: 'all 0.2s ease'
            }}
          >
            {s} {s === 'Active' ? `(${orders.filter((o) => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.orderStatus)).length})` : ''}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}
        >
          <UtensilsCrossed size={42} style={{ margin: '0 auto 14px', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No orders in "{filter}"</h3>
          <p style={{ fontSize: '13px' }}>Incoming orders will appear here automatically with live audio alerts.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredOrders.map((order) => {
            const statusClass = getStatusColor(order.orderStatus);

            return (
              <div
                key={order._id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderTop: `4px solid var(--status-${statusClass})`,
                  backgroundColor: 'rgba(20, 28, 48, 0.85)'
                }}
              >
                {/* Header: Table & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          background: 'var(--accent-gradient)',
                          color: '#0f172a',
                          fontSize: '15px',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        TABLE #{order.tableNumber}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        #{order.orderNumber}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <Clock size={13} />
                      <span>{getTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>

                  <span className={`status-pill ${statusClass}`}>
                    {order.orderStatus}
                  </span>
                </div>

                {/* Customer Overall Notes */}
                {order.customerNotes && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px dashed rgba(245, 158, 11, 0.3)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      color: 'var(--accent-primary)'
                    }}
                  >
                    <strong>Guest Note:</strong> "{order.customerNotes}"
                  </div>
                )}

                {/* Items List */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`diet-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                          <span style={{ fontWeight: 700 }}>
                            {item.quantity} × {item.name}
                          </span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>₹{item.price * item.quantity}</span>
                      </div>
                      {item.specialInstructions && (
                        <span style={{ fontSize: '11px', color: 'var(--accent-primary)', paddingLeft: '22px', fontStyle: 'italic' }}>
                          ↳ Req: {item.specialInstructions}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bill & Payment Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Total: </span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>₹{order.totalAmount}</strong>
                  </div>

                  {/* Payment Badge & Mark Paid button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {order.paymentStatus === 'Paid' ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--veg-color)',
                          background: 'var(--veg-bg)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}
                      >
                        ✓ PAID ({order.paymentMethod})
                      </span>
                    ) : (
                      <>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#f59e0b',
                            background: 'rgba(245, 158, 11, 0.15)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          UNPAID ({order.paymentMethod})
                        </span>
                        <button
                          onClick={() => handleMarkPaid(order._id)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#fff',
                            background: 'rgba(34, 197, 94, 0.25)',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          title="Mark paid in cash/card at counter"
                        >
                          Mark Paid
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progression Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {order.orderStatus === 'Pending' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleUpdateStatus(order._id, 'Accepted')}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <BellRing size={16} />
                      <span>Accept Order</span>
                    </button>
                  )}

                  {order.orderStatus === 'Accepted' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleUpdateStatus(order._id, 'Preparing')}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <ChefHat size={16} />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {order.orderStatus === 'Preparing' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleUpdateStatus(order._id, 'Ready')}
                      style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                      <UtensilsCrossed size={16} />
                      <span>Mark Ready to Serve</span>
                    </button>
                  )}

                  {order.orderStatus === 'Ready' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleUpdateStatus(order._id, 'Served')}
                      style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Mark Served</span>
                    </button>
                  )}

                  {order.orderStatus !== 'Served' && order.orderStatus !== 'Cancelled' && (
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        if (confirm(`Are you sure you want to cancel Order #${order.orderNumber}?`)) {
                          handleUpdateStatus(order._id, 'Cancelled');
                        }
                      }}
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '10px 14px' }}
                      title="Cancel Order"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
