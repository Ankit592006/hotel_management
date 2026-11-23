import React, { useState, useEffect } from 'react';
import {
  Clock,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ToastProvider';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { api } from '../../api/client';

const STATUS_FILTERS = ['Active', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Served', 'All'];

export const LiveOrdersPage = ({ onOrdersCountChange }) => {
  const { socket, joinAdmin, playChime } = useSocket();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({ limit: 100 });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch live orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    joinAdmin();
  }, []);

  useEffect(() => {
    const activeCount = orders.filter((o) =>
      ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.orderStatus)
    ).length;
    if (onOrdersCountChange) onOrdersCountChange(activeCount);
  }, [orders, onOrdersCountChange]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      playChime();
      setOrders((prev) => [data.order, ...prev]);
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setBusyOrderId(orderId);
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        toast.success(`Order marked as ${newStatus}`);
      }
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleMarkPaid = async (orderId) => {
    try {
      setBusyOrderId(orderId);
      const res = await api.updatePaymentStatus(orderId, 'Paid');
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: 'Paid' } : o))
        );
        toast.success('Payment marked as Paid');
      }
    } catch (err) {
      toast.error(`Failed to update payment status: ${err.message}`);
    } finally {
      setBusyOrderId(null);
    }
  };

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
      {/* Top Controls */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Kitchen & Floor Board</h1>
          <p className="page-subtitle">Real-time table orders feed • Instant status dispatch</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={playChime} title="Test Sound Chime">
            <Volume2 size={16} />
            <span>Test Chime</span>
          </button>
          <button type="button" className="btn-secondary" onClick={fetchOrders} title="Refresh">
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
            marginBottom: '18px',
            padding: '14px 18px',
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.24) 0%, rgba(234, 88, 12, 0.18) 100%)',
            border: '1.5px solid var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Sparkles size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>{newOrderAlert}</span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setNewOrderAlert(null)}
            aria-label="Dismiss alert"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          marginBottom: '20px',
          paddingBottom: '4px'
        }}
      >
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`category-pill ${filter === s ? 'active' : ''}`}
          >
            {s} {s === 'Active' ? `(${orders.filter((o) => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.orderStatus)).length})` : ''}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <UtensilsCrossed size={40} style={{ margin: '0 auto 14px', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No orders in "{filter}"</h3>
          <p style={{ fontSize: '13px' }}>Incoming orders will appear here automatically with live audio alerts.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))',
            gap: '16px'
          }}
        >
          {filteredOrders.map((order) => {
            const statusClass = getStatusColor(order.orderStatus);
            const isBusy = busyOrderId === order._id;

            return (
              <div
                key={order._id}
                className="glass-panel"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderTop: `4px solid var(--status-${statusClass})`,
                  backgroundColor: 'rgba(20, 28, 48, 0.88)'
                }}
              >
                {/* Header: Table & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span
                        style={{
                          background: 'var(--accent-gradient)',
                          color: '#0f172a',
                          fontSize: '14px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        TABLE #{order.tableNumber}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        #{order.orderNumber}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      <span>{getTimeAgo(order.createdAt)}</span>
                    </div>
                  </div>

                  <span className={`status-pill ${statusClass}`}>{order.orderStatus}</span>
                </div>

                {/* Customer Overall Notes */}
                {order.customerNotes && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px dashed rgba(245, 158, 11, 0.32)',
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
                    background: 'rgba(0, 0, 0, 0.26)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span className={`diet-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                          <span style={{ fontWeight: 700 }}>
                            {item.quantity} × {item.name}
                          </span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                      {item.specialInstructions && (
                        <span style={{ fontSize: '11px', color: 'var(--accent-primary)', paddingLeft: '24px', fontStyle: 'italic' }}>
                          ↳ Req: {item.specialInstructions}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bill & Payment Row (wraps cleanly on narrow screens) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Total: </span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>₹{order.totalAmount}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {order.paymentStatus === 'Paid' ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--veg-color)',
                          background: 'var(--veg-bg)',
                          padding: '4px 9px',
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
                            color: '#fbbf24',
                            background: 'rgba(245, 158, 11, 0.16)',
                            padding: '4px 9px',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          UNPAID ({order.paymentMethod})
                        </span>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleMarkPaid(order._id)}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: 'rgba(34, 197, 94, 0.25)',
                            border: '1px solid rgba(34, 197, 94, 0.45)',
                            padding: '4px 10px',
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
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  {order.orderStatus === 'Pending' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(order._id, 'Accepted')}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <BellRing size={16} />
                      <span>Accept Order</span>
                    </button>
                  )}

                  {order.orderStatus === 'Accepted' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(order._id, 'Preparing')}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <ChefHat size={16} />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {order.orderStatus === 'Preparing' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(order._id, 'Ready')}
                      style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' }}
                    >
                      <UtensilsCrossed size={16} />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {order.orderStatus === 'Ready' && (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={isBusy}
                      onClick={() => handleUpdateStatus(order._id, 'Served')}
                      style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', color: '#ffffff' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Mark Served</span>
                    </button>
                  )}

                  {order.orderStatus !== 'Served' && order.orderStatus !== 'Cancelled' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={isBusy}
                      onClick={() => setCancelTarget(order)}
                      style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.35)', padding: '10px 14px' }}
                      title="Cancel Order"
                      aria-label={`Cancel order #${order.orderNumber}`}
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

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Cancel Customer Order?"
        message={
          cancelTarget
            ? `Are you sure you want to cancel Order #${cancelTarget.orderNumber} for Table #${cancelTarget.tableNumber}? The guest will be notified immediately.`
            : ''
        }
        confirmLabel="Yes, Cancel Order"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          const target = cancelTarget;
          setCancelTarget(null);
          if (target) handleUpdateStatus(target._id, 'Cancelled');
        }}
      />
    </div>
  );
};
