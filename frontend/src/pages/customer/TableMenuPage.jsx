import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Flame, AlertCircle, Sparkles, Plus, Minus } from 'lucide-react';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CartDrawer } from '../../components/CartDrawer';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../api/client';

export const TableMenuPage = ({ tableNumber, onNavigateToOrder }) => {
  const { setTableNumber, items: cartItems, addItem, updateQuantity, itemCount, totalAmount, setIsCartOpen } = useCart();
  const { socket, joinTable } = useSocket();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableInfo, setTableInfo] = useState(null);
  const [error, setError] = useState('');

  // Set table number in cart context
  useEffect(() => {
    if (tableNumber) {
      setTableNumber(tableNumber);
      joinTable(tableNumber);
    }
  }, [tableNumber]);

  // Fetch Table & Menu data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch table details
        if (tableNumber) {
          try {
            const tableRes = await api.getTable(tableNumber);
            if (tableRes.success) {
              setTableInfo(tableRes.data);
            }
          } catch (tErr) {
            console.warn('Table fetch notice:', tErr.message);
          }
        }

        // Fetch Menu Items & Categories
        const [itemsRes, catRes] = await Promise.all([
          api.getMenuItems(),
          api.getCategories()
        ]);

        if (itemsRes.success) {
          setMenuItems(itemsRes.data);
        }
        if (catRes.success) {
          setCategories(['All', ...catRes.data]);
        }
      } catch (err) {
        setError('Failed to load menu. Please refresh or inform restaurant staff.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [tableNumber]);

  // Real-time socket listener for menu item stock changes
  useEffect(() => {
    if (!socket) return;

    const handleItemUpdated = (updatedItem) => {
      setMenuItems((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
      );
    };

    socket.on('menu_item_updated', handleItemUpdated);

    return () => {
      socket.off('menu_item_updated', handleItemUpdated);
    };
  }, [socket]);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (activeCategory !== 'All' && item.category !== activeCategory) {
      return false;
    }
    if (vegOnly && !item.isVeg) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="customer-layout">
      {/* Header */}
      <CustomerHeader
        tableNumber={tableNumber}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        vegOnly={vegOnly}
        setVegOnly={setVegOnly}
      />

      {/* Category Navigation Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px 16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'sticky',
          top: '125px',
          zIndex: 30,
          background: 'rgba(9, 13, 22, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: activeCategory === cat ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
              color: activeCategory === cat ? '#0f172a' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              whiteSpace: 'nowrap',
              border: `1px solid ${activeCategory === cat ? 'transparent' : 'var(--border-subtle)'}`,
              boxShadow: activeCategory === cat ? '0 2px 10px var(--accent-glow)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Dishes Responsive Grid */}
      <div className="menu-grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <Sparkles className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
            <p>Loading chef's fresh menu...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#f87171' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 10px' }} />
            <p>{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            <p>No dishes match your filter criteria.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const inCart = cartItems.find((i) => i._id === item._id);
            const isSoldOut = !item.isAvailable;

            return (
              <div
                key={item._id}
                className="dish-card"
                style={{ opacity: isSoldOut ? 0.6 : 1 }}
              >
                {/* Image Section */}
                <div className="dish-image-wrapper">
                  <img src={item.imageUrl} alt={item.name} loading="lazy" />
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(0,0,0,0.65)',
                      borderRadius: '4px',
                      padding: '2px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <span className={`diet-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>{item.name}</h3>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        <Star size={12} fill="#f59e0b" />
                        <span>{item.rating || 4.8}</span>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '8px'
                      }}
                    >
                      {item.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{item.price}
                    </div>

                    {isSoldOut ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.12)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}
                      >
                        Sold Out
                      </span>
                    ) : inCart ? (
                      <div className="qty-stepper">
                        <button onClick={() => updateQuantity(item._id, -1)}>
                          <Minus size={14} />
                        </button>
                        <span>{inCart.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addItem(item)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Plus size={14} />
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {itemCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '520px',
            zIndex: 60
          }}
        >
          <div
            onClick={() => setIsCartOpen(true)}
            className="pulse-glow"
            style={{
              background: 'var(--accent-gradient)',
              borderRadius: 'var(--radius-full)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(245, 158, 11, 0.45)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 800
                }}
              >
                {itemCount}
              </div>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>₹{totalAmount}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px' }}>
              <span>View Cart & Order</span>
              <ShoppingBag size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        onOrderPlaced={(orderId) => {
          if (onNavigateToOrder) {
            onNavigateToOrder(orderId);
          }
        }}
      />
    </div>
  );
};
