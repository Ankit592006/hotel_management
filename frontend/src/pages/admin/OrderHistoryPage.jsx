import React, { useState, useEffect } from 'react';
import { Search, Eye, X, Receipt } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import { useModalBehavior } from '../../hooks/useModalBehavior';

export const OrderHistoryPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useModalBehavior(Boolean(selectedOrder), () => setSelectedOrder(null));

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (paymentFilter !== 'All') params.paymentStatus = paymentFilter;
      if (tableFilter) params.tableNumber = tableFilter;

      const res = await api.getOrders(params);
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      toast.error('Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div>
      {/* Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Archive & History</h1>
          <p className="page-subtitle">Review historical customer orders, receipts, and payment transactions</p>
        </div>
      </div>

      {/* Responsive Filter Grid */}
      <form onSubmit={handleSearchSubmit} className="filter-grid">
        <input
          type="number"
          min="1"
          className="input-field"
          placeholder="Filter by Table #"
          aria-label="Filter by table number"
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
        />

        <select
          className="input-field"
          aria-label="Filter by order status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Order Statuses</option>
          <option value="Served">Served</option>
          <option value="Ready">Ready</option>
          <option value="Preparing">Preparing</option>
          <option value="Accepted">Accepted</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          className="input-field"
          aria-label="Filter by payment status"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="All">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending / Unpaid</option>
        </select>

        <button type="submit" className="btn-secondary" style={{ width: '100%' }}>
          <Search size={16} />
          <span>Apply Filters</span>
        </button>
      </form>

      {/* Desktop Orders Table */}
      <div className="glass-panel desktop-table-view" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.25)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 18px' }}>Order #</th>
              <th style={{ padding: '14px 18px' }}>Table</th>
              <th style={{ padding: '14px 18px' }}>Date & Time</th>
              <th style={{ padding: '14px 18px' }}>Items</th>
              <th style={{ padding: '14px 18px' }}>Total Amount</th>
              <th style={{ padding: '14px 18px' }}>Order Status</th>
              <th style={{ padding: '14px 18px' }}>Payment</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading order archive...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No orders found matching the selected filters.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="admin-table-row">
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    #{o.orderNumber}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.07)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Table {o.tableNumber}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    {o.items?.reduce((sum, i) => sum + i.quantity, 0)} items ({o.items?.length} types)
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    ₹{o.totalAmount}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`status-pill ${o.orderStatus.toLowerCase()}`}>{o.orderStatus}</span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 9px',
                        borderRadius: 'var(--radius-full)',
                        whiteSpace: 'nowrap',
                        background: o.paymentStatus === 'Paid' ? 'var(--veg-bg)' : 'rgba(245, 158, 11, 0.16)',
                        color: o.paymentStatus === 'Paid' ? 'var(--veg-color)' : '#fbbf24'
                      }}
                    >
                      {o.paymentStatus} ({o.paymentMethod})
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setSelectedOrder(o)}
                      title="View Receipt"
                      aria-label={`View receipt for order #${o.orderNumber}`}
                      style={{ width: '36px', height: '36px' }}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Order Cards (< 768px) */}
      <div className="mobile-card-list">
        {loading ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading order archive...
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No orders found matching the selected filters.
          </div>
        ) : (
          orders.map((o) => (
            <div key={o._id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '15px' }}>#{o.orderNumber}</span>
                  <span style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    Table {o.tableNumber}
                  </span>
                </div>
                <span className={`status-pill ${o.orderStatus.toLowerCase()}`}>{o.orderStatus}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span>{o.items?.reduce((sum, i) => sum + i.quantity, 0)} items</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '16px' }}>₹{o.totalAmount}</strong>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: o.paymentStatus === 'Paid' ? 'var(--veg-bg)' : 'rgba(245, 158, 11, 0.16)',
                      color: o.paymentStatus === 'Paid' ? 'var(--veg-color)' : '#fbbf24'
                    }}
                  >
                    {o.paymentStatus} ({o.paymentMethod})
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedOrder(o)}
                  style={{ fontSize: '12px', padding: '6px 12px', minHeight: '34px' }}
                >
                  <Receipt size={14} />
                  <span>Receipt</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scroll-Safe Receipt Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)} role="dialog" aria-modal="true" aria-label="Order receipt">
          <div className="modal-panel animate-fade-in" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Order #{selectedOrder.orderNumber}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Table {selectedOrder.tableNumber} • {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setSelectedOrder(null)} aria-label="Close receipt">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <span>{item.quantity} × {item.name}</span>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>GST (5%)</span>
                  <span>₹{selectedOrder.taxAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px', color: 'var(--accent-primary)', paddingTop: '4px' }}>
                  <span>Grand Total</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                <div><strong>Payment:</strong> {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</div>
                {selectedOrder.razorpayPaymentId && (
                  <div style={{ marginTop: '4px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    Ref: {selectedOrder.razorpayPaymentId}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
