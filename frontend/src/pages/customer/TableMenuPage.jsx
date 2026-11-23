import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Star,
  Flame,
  Clock,
  AlertCircle,
  Plus,
  Minus,
  UtensilsCrossed,
  RotateCcw
} from 'lucide-react';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CartDrawer } from '../../components/CartDrawer';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../api/client';

const DishThumbnail = ({ src, alt, isVeg }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="dish-image-wrapper">
      {!imgError && src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '4px'
          }}
        >
          <UtensilsCrossed size={24} />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          left: '6px',
          background: 'rgba(9, 13, 22, 0.78)',
          borderRadius: '5px',
          padding: '2px',
          backdropFilter: 'blur(4px)',
          display: 'flex'
        }}
      >
        <span className={`diet-badge ${isVeg ? 'veg' : 'non-veg'}`} />
      </div>
    </div>
  );
};

export const TableMenuPage = ({ tableNumber, onNavigateToOrder }) => {
  const { setTableNumber, items: cartItems, addItem, updateQuantity, itemCount, totalAmount, setIsCartOpen } = useCart();
  const { socket, joinTable } = useSocket();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set table number in cart context
  useEffect(() => {
    if (tableNumber) {
      setTableNumber(tableNumber);
      joinTable(tableNumber);
    }
  }, [tableNumber]);

  // Fetch Table & Menu data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      if (tableNumber) {
        try {
          await api.getTable(tableNumber);
        } catch (tErr) {
          setError(`Table #${tableNumber} is not registered. Please scan a valid table QR code or inform restaurant staff.`);
          return;
        }
      }

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

  useEffect(() => {
    fetchInitialData();
  }, [tableNumber]);

  // Real-time socket listeners for menu updates (stock, price edits, additions, deletions)
  useEffect(() => {
    if (!socket) return;

    const handleItemCreated = (newItem) => {
      setMenuItems((prev) => [newItem, ...prev]);
      if (newItem.category) {
        setCategories((prev) => (prev.includes(newItem.category) ? prev : [...prev, newItem.category]));
      }
    };

    const handleItemUpdated = (updatedItem) => {
      setMenuItems((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
      );
    };

    const handleItemDeleted = ({ _id }) => {
      setMenuItems((prev) => prev.filter((item) => item._id !== _id));
    };

    socket.on('menu_item_created', handleItemCreated);
    socket.on('menu_item_updated', handleItemUpdated);
    socket.on('menu_item_deleted', handleItemDeleted);
    return () => {
      socket.off('menu_item_created', handleItemCreated);
      socket.off('menu_item_updated', handleItemUpdated);
      socket.off('menu_item_deleted', handleItemDeleted);
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

  const hasActiveFilters = activeCategory !== 'All' || vegOnly || Boolean(searchQuery);

  const resetFilters = () => {
    setActiveCategory('All');
    setVegOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="customer-layout">
      {/* Unified Sticky Shell: Header + Category Pills (zero overlap on any viewport) */}
      <div className="customer-sticky-shell">
        <CustomerHeader
          tableNumber={tableNumber}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
        />

        <nav className="category-strip hide-scrollbar" aria-label="Menu categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </nav>
      </div>

      {/* Menu Dishes Responsive Grid */}
      <div className="menu-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="dish-card" aria-hidden="true">
              <div className="skeleton" style={{ width: '96px', height: '96px', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                <div className="skeleton" style={{ height: '16px', width: '75%' }} />
                <div className="skeleton" style={{ height: '12px', width: '95%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div className="skeleton" style={{ height: '18px', width: '56px' }} />
                  <div className="skeleton" style={{ height: '32px', width: '74px', borderRadius: '999px' }} />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="glass-panel grid-full-span" style={{ textAlign: 'center', padding: '44px 20px' }}>
            <AlertCircle size={34} style={{ margin: '0 auto 12px', color: '#f87171' }} />
            <p style={{ color: '#f87171', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
            <button type="button" className="btn-secondary" onClick={fetchInitialData}>
              <RotateCcw size={15} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel grid-full-span" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
            <UtensilsCrossed size={34} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No dishes match your filters
            </p>
            <p style={{ fontSize: '13px', marginBottom: hasActiveFilters ? '16px' : '0' }}>
              Try another category or clear your search query.
            </p>
            {hasActiveFilters && (
              <button type="button" className="btn-secondary" onClick={resetFilters}>
                <RotateCcw size={15} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const inCart = cartItems.find((i) => i._id === item._id);
            const isSoldOut = !item.isAvailable;

            return (
              <article
                key={item._id}
                className="dish-card"
                style={{ opacity: isSoldOut ? 0.62 : 1 }}
              >
                <DishThumbnail src={item.imageUrl} alt={item.name} isVeg={item.isVeg} />

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.25 }}>
                        {item.name}
                      </h3>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fbbf24',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          flexShrink: 0
                        }}
                      >
                        <Star size={11} fill="#fbbf24" />
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
                        marginBottom: '6px'
                      }}
                    >
                      {item.description}
                    </p>

                    {/* Subtle metadata row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.preparationTime && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} />
                          <span>{item.preparationTime}m</span>
                        </span>
                      )}
                      {item.spicyLevel >= 2 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#fb923c' }}>
                          <Flame size={11} />
                          <span>{item.spicyLevel === 3 ? 'Spicy' : 'Medium'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{item.price}
                    </div>

                    {isSoldOut ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#f87171',
                          background: 'rgba(239, 68, 68, 0.14)',
                          border: '1px solid rgba(239, 68, 68, 0.28)',
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-full)'
                        }}
                      >
                        Sold Out
                      </span>
                    ) : inCart ? (
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{inCart.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.16)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(245, 158, 11, 0.38)',
                          padding: '7px 14px',
                          minHeight: '36px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={14} />
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {itemCount > 0 && (
        <div className="floating-cart-wrap">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="floating-cart-btn pulse-glow"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
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
              </span>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>₹{totalAmount}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px' }}>
              <span>View Cart & Order</span>
              <ShoppingBag size={18} />
            </div>
          </button>
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
