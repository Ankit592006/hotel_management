import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Eye,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  X,
  FileText
} from 'lucide-react';
import { api } from '../../api/client';

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      console.error('Failed to load history:', err);
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Order Archive & History</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Review historical customer orders, receipts, and payment transactions
        </p>
      </div>

      {/* Filter Row */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '200px' }}>
          <input
            type="number"
            className="input-field"
            placeholder="Filter by Table #"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          style={{ width: '180px' }}
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
          style={{ width: '180px' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="All">All Payment Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending / Unpaid</option>
        </select>

        <button type="submit" className="btn-secondary">
          <Search size={16} />
          <span>Apply Filters</span>
        </button>
      </form>

      {/* Orders Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
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
                <tr key={o._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    #{o.orderNumber}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Table {o.tableNumber}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {o.items?.reduce((sum, i) => sum + i.quantity, 0)} items ({o.items?.length} types)
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                    ₹{o.totalAmount}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`status-pill ${o.orderStatus.toLowerCase()}`}>
                      {o.orderStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: o.paymentStatus === 'Paid' ? 'var(--veg-bg)' : 'rgba(245, 158, 11, 0.15)',
                        color: o.paymentStatus === 'Paid' ? 'var(--veg-color)' : '#f59e0b'
                      }}
                    >
                      {o.paymentStatus} ({o.paymentMethod})
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      className="btn-icon"
                      onClick={() => setSelectedOrder(o)}
                      title="View Receipt"
                      style={{ width: '34px', height: '34px' }}
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

      {/* Receipt Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: '440px', backgroundColor: '#0f172a', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Order #{selectedOrder.orderNumber}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Table {selectedOrder.tableNumber} • {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button className="btn-icon" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity} × {item.name}</span>
                  <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
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

            <div style={{ marginTop: '16px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', fontSize: '12px' }}>
              <div><strong>Payment:</strong> {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</div>
              {selectedOrder.razorpayPaymentId && (
                <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                  Ref: {selectedOrder.razorpayPaymentId}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
