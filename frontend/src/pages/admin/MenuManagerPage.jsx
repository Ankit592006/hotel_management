import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';

export const MenuManagerPage = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Mains',
    imageUrl: '',
    isVeg: true,
    isAvailable: true,
    preparationTime: 15,
    spicyLevel: 1
  });
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [itemsRes, catRes] = await Promise.all([
        api.getMenuItems(),
        api.getCategories()
      ]);
      if (itemsRes.success) setItems(itemsRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories[0] || 'Mains',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      spicyLevel: 1
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl || '',
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || 15,
      spicyLevel: item.spicyLevel || 1
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleToggleStock = async (item) => {
    try {
      const res = await api.toggleItemAvailability(item._id);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i))
        );
      }
    } catch (err) {
      alert(`Failed to toggle availability: ${err.message}`);
    }
  };

  const handleDelete = async (itemId, name) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from the menu?`)) {
      return;
    }
    try {
      const res = await api.deleteMenuItem(itemId);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i._id !== itemId));
      }
    } catch (err) {
      alert(`Failed to delete dish: ${err.message}`);
    }
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.price || !formData.category) {
        throw new Error('Name, category, and price are required.');
      }

      if (editingItem) {
        const res = await api.updateMenuItem(editingItem._id, formData);
        if (res.success) {
          setItems((prev) =>
            prev.map((i) => (i._id === editingItem._id ? res.data : i))
          );
        }
      } else {
        const res = await api.createMenuItem(formData);
        if (res.success) {
          setItems((prev) => [res.data, ...prev]);
          if (!categories.includes(res.data.category)) {
            setCategories((prev) => [...prev, res.data.category]);
          }
        }
      }

      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Title & Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Digital Menu Manager</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Add, update dishes, prices, descriptions, and toggle kitchen availability
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search menu dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['All', ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: activeCategory === c ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
                color: activeCategory === c ? '#0f172a' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '13px',
                border: `1px solid ${activeCategory === c ? 'transparent' : 'var(--border-subtle)'}`
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.25)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 18px' }}>Dish</th>
              <th style={{ padding: '14px 18px' }}>Category</th>
              <th style={{ padding: '14px 18px' }}>Price</th>
              <th style={{ padding: '14px 18px' }}>Diet</th>
              <th style={{ padding: '14px 18px' }}>Stock / Availability</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading menu database...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No dishes found matching your query.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item._id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{item.category}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--accent-primary)' }}>₹{item.price}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`diet-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => handleToggleStock(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: item.isAvailable ? 'var(--veg-bg)' : 'rgba(239, 68, 68, 0.15)',
                        color: item.isAvailable ? 'var(--veg-color)' : '#f87171',
                        border: `1px solid ${item.isAvailable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}
                      title="Click to toggle availability"
                    >
                      {item.isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                    </button>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit dish"
                        style={{ width: '34px', height: '34px' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(item._id, item.name)}
                        title="Delete dish"
                        style={{ width: '34px', height: '34px', color: '#ef4444' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#0f172a',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
                {editingItem ? 'Edit Dish Details' : 'Add New Gourmet Dish'}
              </h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Paneer Tikka Angara"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Starters, Mains, Desserts"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input-field"
                    placeholder="e.g. 320"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Describe ingredients, marinades, flavor notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Image URL
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Dietary Classification
                  </label>
                  <select
                    className="input-field"
                    value={formData.isVeg ? 'veg' : 'non-veg'}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.value === 'veg' })}
                  >
                    <option value="veg">Vegetarian (Veg)</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Est. Cooking Time (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Dish' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
