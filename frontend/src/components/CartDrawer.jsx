import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, CreditCard, Banknote, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';
import confetti from 'canvas-confetti';

export const CartDrawer = ({ onOrderPlaced }) => {
  const {
    tableNumber,
    items,
    updateQuantity,
    removeItem,
    updateInstructions,
    customerNotes,
    setCustomerNotes,
    subtotal,
    taxAmount,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    clearCart
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Create order on backend (prices are securely calculated by backend)
      const orderPayload = {
        tableNumber: Number(tableNumber),
        items: items.map((i) => ({
          menuItemId: i._id,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions
        })),
        customerNotes,
        paymentMethod
      };

      const res = await api.createOrder(orderPayload);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to place order');
      }

      const createdOrder = res.data;

      // 2. Handle Razorpay Online Payment Flow
      if (paymentMethod === 'Razorpay') {
        const paymentRes = await api.createPaymentOrder(createdOrder._id);
        const { razorpayOrderId, amount, keyId, isSimulation } = paymentRes.data;

        // Check if we can open real Razorpay modal or run simulated verification
        if (!isSimulation && window.Razorpay && keyId && !keyId.includes('demo')) {
          const options = {
            key: keyId,
            amount: amount,
            currency: 'INR',
            name: 'SmartServe Restaurant',
            description: `Order #${createdOrder.orderNumber} (Table ${tableNumber})`,
            order_id: razorpayOrderId,
            handler: async (response) => {
              try {
                // Verify signature on backend
                await api.verifyPayment({
                  orderId: createdOrder._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });

                confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
                clearCart();
                setIsCartOpen(false);
                onOrderPlaced(createdOrder._id);
              } catch (err) {
                alert('Payment verification failed. Please contact restaurant staff.');
              }
            },
            prefill: {
              name: `Table ${tableNumber} Guest`
            },
            theme: {
              color: '#f59e0b'
            },
            modal: {
              ondismiss: () => {
                // User closed modal without paying -> still keep order and go to tracking page
                clearCart();
                setIsCartOpen(false);
                onOrderPlaced(createdOrder._id);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        } else {
          // Simulated test payment verification
          await api.verifyPayment({
            orderId: createdOrder._id,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: 'simulated_signature'
          });
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        }
      }

      // Successful order
      clearCart();
      setIsCartOpen(false);
      onOrderPlaced(createdOrder._id);
    } catch (err) {
      console.error('Order error:', err);
      setErrorMessage(err.message || 'Something went wrong placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end'
      }}
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="glass-panel animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '92vh',
          backgroundColor: '#0d1322',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Your Order Cart</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Table #{tableNumber} • {items.length} unique dish{items.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <button className="btn-icon" onClick={() => setIsCartOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '13px'
              }}
            >
              {errorMessage}
            </div>
          )}

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <p>Your cart is empty. Add delicious dishes from the menu!</p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {items.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`diet-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                        <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{item.name}</h4>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        ₹{item.price * item.quantity}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ₹{item.price} each
                      </div>

                      {/* Stepper & Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="qty-stepper" style={{ height: '30px' }}>
                          <button onClick={() => updateQuantity(item._id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item._id)}
                          style={{ color: 'var(--text-muted)', padding: '4px' }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Special instruction input */}
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. less spicy, no onion)"
                      value={item.specialInstructions}
                      onChange={(e) => updateInstructions(item._id, e.target.value)}
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        fontSize: '12px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* General Order Note */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Chef or Service Request (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Please bring drinks first, celebratory occasion"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  style={{ fontSize: '13px', padding: '10px 14px' }}
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Choose Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setPaymentMethod('Razorpay')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: paymentMethod === 'Razorpay' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${paymentMethod === 'Razorpay' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: paymentMethod === 'Razorpay' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      <CreditCard size={18} />
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>Razorpay</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>UPI / Cards / NetBanking</span>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('Counter')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: paymentMethod === 'Counter' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${paymentMethod === 'Counter' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: paymentMethod === 'Counter' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      <Banknote size={18} />
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>Pay at Counter</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cash or card after dining</span>
                  </div>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Item Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Restaurant GST (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: '16px',
                    color: 'var(--text-primary)',
                    paddingTop: '8px',
                    borderTop: '1px dashed rgba(255,255,255,0.1)'
                  }}
                >
                  <span>Grand Total</span>
                  <span style={{ color: 'var(--accent-primary)' }}>₹{totalAmount}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Action Footer */}
        {items.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15,23,42,0.95)' }}>
            <button
              className="btn-primary"
              style={{ width: '100%', height: '50px', fontSize: '15px' }}
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <span>{paymentMethod === 'Razorpay' ? `Pay ₹${totalAmount} via Razorpay` : `Place Order (Pay ₹${totalAmount} Later)`}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
              <ShieldCheck size={14} />
              <span>Verified server-side calculation • Safe & encrypted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
