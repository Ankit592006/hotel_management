import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Receipt,
  XCircle
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ToastProvider';
import { api } from '../../api/client';
import confetti from 'canvas-confetti';

const STATUS_STEPS = [
  { key: 'Pending', label: 'Order Received', desc: 'Sent to restaurant kitchen', icon: Clock },
  { key: 'Accepted', label: 'Accepted', desc: 'Order confirmed by kitchen', icon: BellRing },
  { key: 'Preparing', label: 'Cooking & Preparing', desc: 'Freshly crafting your dishes', icon: ChefHat },
  { key: 'Ready', label: 'Ready to Serve', desc: 'Plated & on its way to table', icon: UtensilsCrossed },
  { key: 'Served', label: 'Served', desc: 'Enjoy your meal!', icon: CheckCircle2 }
];

export const OrderTrackingPage = ({ orderId, onBackToMenu }) => {
  const { socket, joinOrder } = useSocket();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Fetch initial order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.getOrder(orderId);
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
      joinOrder(orderId);
    }
  }, [orderId]);

  // Listen to Socket.IO real-time status updates
  useEffect(() => {
    if (!socket || !orderId) return;

    const handleStatusUpdate = (data) => {
      if (data.orderId === orderId || (order && data._id === order._id)) {
        const nextStatus = data.orderStatus || data.status;
        setOrder((prev) => (prev ? { ...prev, orderStatus: nextStatus } : prev));
        if (nextStatus !== 'Cancelled') {
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        }
      }
    };

    const handlePaymentUpdate = (data) => {
      if (data.orderId === orderId) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: data.paymentStatus,
                razorpayPaymentId: data.razorpayPaymentId || prev.razorpayPaymentId
              }
            : prev
        );
        if (data.paymentStatus === 'Paid') {
          confetti({ particleCount: 60, spread: 60 });
        }
      }
    };

    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('payment_success', handlePaymentUpdate);
    socket.on('payment_status_updated', handlePaymentUpdate);

    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('payment_success', handlePaymentUpdate);
      socket.off('payment_status_updated', handlePaymentUpdate);
    };
  }, [socket, orderId, order]);

  const handlePayNow = async () => {
    if (!order) return;
    setIsPaying(true);

    try {
      const paymentRes = await api.createPaymentOrder(order._id);
      const { razorpayOrderId, amount, keyId, isSimulation } = paymentRes.data;

      if (!isSimulation && window.Razorpay && keyId && !keyId.includes('demo')) {
        const options = {
          key: keyId,
          amount: amount,
          currency: 'INR',
          name: 'SmartServe Restaurant',
          description: `Order #${order.orderNumber}`,
          order_id: razorpayOrderId,
          handler: async (response) => {
            try {
              await api.verifyPayment({
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              confetti({ particleCount: 70, spread: 60 });
              toast.success('Payment verified successfully!');
              setOrder((prev) => ({
                ...prev,
                paymentStatus: 'Paid',
                razorpayPaymentId: response.razorpay_payment_id
              }));
            } catch (err) {
              toast.error('Payment verification failed. Please inform restaurant staff.');
            }
          },
          theme: { color: '#f59e0b' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        const simPayId = `pay_sim_${Date.now()}`;
        await api.verifyPayment({
          orderId: order._id,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: simPayId,
          razorpay_signature: 'simulated_signature'
        });
        confetti({ particleCount: 70, spread: 60 });
        toast.success('Payment completed!');
        setOrder((prev) => ({
          ...prev,
          paymentStatus: 'Paid',
          razorpayPaymentId: simPayId
        }));
      }
    } catch (err) {
      toast.error('Payment processing failed. Please ask the waiter for assistance.');
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)', marginBottom: '14px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Retrieving live order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="customer-layout" style={{ padding: '48px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', color: '#f87171', marginBottom: '14px' }}>{error || 'Order not found'}</h2>
        <button type="button" className="btn-secondary" onClick={() => onBackToMenu(1)}>
          Back to Menu
        </button>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'Cancelled';
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="customer-layout">
      {/* Top Banner */}
      <header
        className="glass-header"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <button
          type="button"
          onClick={() => onBackToMenu(order.tableNumber)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: 600,
            minHeight: '36px'
          }}
        >
          <ArrowLeft size={18} />
          <span>Menu</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="status-pill pending" style={{ fontSize: '11px' }}>
            Table #{order.tableNumber}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-primary)' }}>
            #{order.orderNumber}
          </span>
        </div>
      </header>

      <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        {/* Order Status Hero Card */}
        <div
          className="glass-panel"
          style={{
            padding: '24px 20px',
            textAlign: 'center',
            background: isCancelled
              ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.88) 100%)'
              : 'linear-gradient(180deg, rgba(245, 158, 11, 0.09) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: isCancelled ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(245, 158, 11, 0.28)'
          }}
        >
          <div
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '50%',
              background: isCancelled
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: isCancelled ? '#ffffff' : '#0f172a',
              boxShadow: isCancelled ? '0 8px 24px rgba(239, 68, 68, 0.35)' : '0 8px 24px var(--accent-glow)'
            }}
          >
            {isCancelled ? (
              <XCircle size={32} />
            ) : order.orderStatus === 'Preparing' ? (
              <ChefHat size={30} />
            ) : order.orderStatus === 'Ready' ? (
              <UtensilsCrossed size={30} />
            ) : order.orderStatus === 'Served' ? (
              <CheckCircle2 size={30} />
            ) : (
              <Clock size={30} />
            )}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
            {isCancelled
              ? 'Order Cancelled'
              : order.orderStatus === 'Served'
              ? 'Enjoy Your Meal!'
              : order.orderStatus === 'Ready'
              ? 'Your Order is Ready!'
              : order.orderStatus === 'Preparing'
              ? 'Kitchen is Preparing Your Order'
              : order.orderStatus === 'Accepted'
              ? 'Kitchen Confirmed Order'
              : 'Order Sent to Kitchen'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isCancelled
              ? 'This order was cancelled. Please contact restaurant staff if you have questions.'
              : 'Status updates automatically in real-time'}
          </p>

          {!isCancelled && order.orderStatus !== 'Served' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '14px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: 'var(--accent-primary)',
                fontWeight: 600
              }}
            >
              <Clock size={14} />
              <span>Est. Preparation: ~{order.estimatedPrepTime || 15} mins</span>
            </div>
          )}
        </div>

        {/* Live Stepper Tracker (hidden when cancelled) */}
        {!isCancelled && (
          <div className="glass-panel" style={{ padding: '20px 18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '18px', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
              LIVE ORDER TIMELINE
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              {STATUS_STEPS.map((step, idx) => {
                const isDone = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '17px',
                          top: '36px',
                          bottom: '-18px',
                          width: '2px',
                          backgroundColor: isDone ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                          zIndex: 1
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDone
                          ? 'var(--accent-primary)'
                          : isCurrent
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isDone ? '#0f172a' : isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)',
                        border: `2px solid ${isDone || isCurrent ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.12)'}`,
                        boxShadow: isCurrent ? '0 0 15px var(--accent-glow)' : 'none',
                        zIndex: 2,
                        flexShrink: 0
                      }}
                    >
                      <StepIcon size={17} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: isDone || isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}
                      >
                        {step.label}
                      </h4>
                      <p style={{ fontSize: '12px', color: isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Status & Action Card */}
        <div
          className="glass-panel"
          style={{
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: order.paymentStatus === 'Paid' ? 'rgba(34, 197, 94, 0.07)' : 'rgba(245, 158, 11, 0.07)',
            border: `1px solid ${order.paymentStatus === 'Paid' ? 'rgba(34, 197, 94, 0.32)' : 'rgba(245, 158, 11, 0.32)'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: order.paymentStatus === 'Paid' ? 'var(--veg-color)' : 'var(--accent-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Payment Status</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: order.paymentStatus === 'Paid' ? 'var(--veg-bg)' : 'rgba(245, 158, 11, 0.16)',
                color: order.paymentStatus === 'Paid' ? 'var(--veg-color)' : 'var(--accent-primary)'
              }}
            >
              {order.paymentStatus === 'Paid' ? 'PAID' : 'PAYMENT PENDING'}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {order.paymentStatus === 'Paid' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--veg-color)', flexWrap: 'wrap' }}>
                <ShieldCheck size={16} />
                <span>Verified ({order.razorpayPaymentId || order.paymentMethod})</span>
              </span>
            ) : (
              <span>Payment Method: {order.paymentMethod === 'Razorpay' ? 'Razorpay Online' : 'Pay at Counter'}</span>
            )}
          </div>

          {!isCancelled && order.paymentStatus !== 'Paid' && (
            <button
              type="button"
              className="btn-primary"
              onClick={handlePayNow}
              disabled={isPaying}
              style={{ marginTop: '4px', width: '100%', fontSize: '14px' }}
            >
              {isPaying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              <span>{isPaying ? 'Loading Razorpay...' : `Pay ₹${order.totalAmount} Now Online`}</span>
            </button>
          )}
        </div>

        {/* Itemized Receipt */}
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Receipt size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Order Receipt</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            {order.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span className={`diet-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                  <span>
                    {item.name} <strong style={{ color: 'var(--text-muted)' }}>× {item.quantity}</strong>
                  </span>
                </div>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>₹{item.price * item.quantity}</span>
              </div>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>GST (5%)</span>
              <span>₹{order.taxAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px', color: 'var(--accent-primary)' }}>
              <span>Grand Total</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action button to order more */}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onBackToMenu(order.tableNumber)}
          style={{ width: '100%', padding: '14px', fontSize: '14px' }}
        >
          <UtensilsCrossed size={16} />
          <span>Add More Dishes to Table #{order.tableNumber}</span>
        </button>
      </div>
    </div>
  );
};
