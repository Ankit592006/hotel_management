import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './ToastProvider';
import { useModalBehavior } from '../hooks/useModalBehavior';

const COUNTER_MODES = [
  { id: 'Cash', label: 'Cash', icon: Banknote },
  { id: 'Card', label: 'Card / EDC', icon: CreditCard },
  { id: 'UPI', label: 'Counter UPI', icon: Smartphone }
];

export const AcceptCashModal = ({ order, onClose, onSuccess }) => {
  const toast = useToast();
  const [mode, setMode] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useModalBehavior(Boolean(order), onClose);

  useEffect(() => {
    if (order) {
      setMode('Cash');
      setCashReceived(String(order.totalAmount));
      setNotes('');
      setError('');
    }
  }, [order]);

  if (!order) return null;

  const total = Number(order.totalAmount || 0);
  const parsedCash = cashReceived === '' ? total : Number(cashReceived);
  const isCashShort = mode === 'Cash' && (isNaN(parsedCash) || parsedCash < total);
  const changeToReturn = mode === 'Cash' && !isCashShort ? Math.max(0, Math.round((parsedCash - total) * 100) / 100) : 0;

  const quickDenominations = [total, 500, 1000, 2000].filter(
    (val, idx, arr) => val >= total && arr.indexOf(val) === idx
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCashShort) return;

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        mode,
        notes: notes.trim()
      };
      if (mode === 'Cash') {
        payload.cashReceived = parsedCash;
      }

      const res = await api.acceptCashPayment(order._id, payload);
      if (res.success && res.data) {
        toast.success(
          mode === 'Cash' && changeToReturn > 0
            ? `Cash accepted! Return ₹${changeToReturn} change to guest.`
            : `${mode} payment of ₹${total} accepted for #${order.orderNumber}`
        );
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      const msg = err.message || 'Failed to record counter payment';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accept-cash-title"
    >
      <div
        className="modal-panel animate-fade-in"
        style={{ maxWidth: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.16)',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Banknote size={20} />
            </div>
            <div>
              <h2 id="accept-cash-title" style={{ fontSize: '18px', fontWeight: 800 }}>
                Accept Counter Payment
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Order #{order.orderNumber} • Table #{order.tableNumber}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Amount Due Summary */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Amount Payable (incl. 5% GST)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0} items • Status: {order.orderStatus}
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                ₹{total}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Counter Mode Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Payment Collection Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                {COUNTER_MODES.map((m) => {
                  const Icon = m.icon;
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setMode(m.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-md)',
                        background: active ? 'rgba(34, 197, 94, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1.5px solid ${active ? '#22c55e' : 'var(--border-subtle)'}`,
                        color: active ? '#4ade80' : 'var(--text-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      <Icon size={18} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Received & Change Calculator */}
            {mode === 'Cash' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label htmlFor="cash-received-input" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Cash Received from Guest (₹)
                  </label>
                  <input
                    id="cash-received-input"
                    type="number"
                    min={total}
                    step="any"
                    className="input-field"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={`Enter amount ≥ ₹${total}`}
                    style={{ fontSize: '16px', fontWeight: 700 }}
                  />
                </div>

                {/* Quick Denomination Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {quickDenominations.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="btn-secondary"
                      onClick={() => setCashReceived(String(amt))}
                      style={{
                        fontSize: '12px',
                        padding: '5px 12px',
                        minHeight: '32px',
                        borderColor: Number(cashReceived) === amt ? 'var(--accent-primary)' : undefined,
                        color: Number(cashReceived) === amt ? 'var(--accent-primary)' : undefined
                      }}
                    >
                      {amt === total ? `Exact (₹${amt})` : `₹${amt}`}
                    </button>
                  ))}
                </div>

                {/* Change Readout */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isCashShort ? 'rgba(239, 68, 68, 0.14)' : 'rgba(34, 197, 94, 0.12)',
                    border: `1px solid ${isCashShort ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.32)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}
                >
                  <span style={{ color: isCashShort ? '#fca5a5' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {isCashShort ? `Short by ₹${Math.max(0, total - (Number(cashReceived) || 0))}` : 'Change to Return'}
                  </span>
                  {!isCashShort && (
                    <strong style={{ fontSize: '18px', color: '#4ade80' }}>
                      ₹{changeToReturn}
                    </strong>
                  )}
                </div>
              </div>
            )}

            {/* Optional Cashier Note */}
            <div>
              <label htmlFor="cash-notes-input" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Counter Note (Optional)
              </label>
              <input
                id="cash-notes-input"
                type="text"
                className="input-field"
                placeholder="e.g. Paid at reception desk"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || isCashShort}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#052e16',
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.35)'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm ₹{total} {mode}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
