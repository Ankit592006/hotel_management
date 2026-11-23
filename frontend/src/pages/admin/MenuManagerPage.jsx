import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  X
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastProvider';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useModalBehavior } from '../../hooks/useModalBehavior';

const MenuThumb = ({ src, alt }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          flexShrink: 0
        }}
      >
        <UtensilsCrossed size={18} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
    />
  );
};

export const MenuManagerPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  useModalBehavior(isModalOpen, () => setIsModalOpen(false));

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
      toast.error('Failed to load menu items.');
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
        toast.info(`${item.name} marked as ${item.isAvailable ? 'Sold Out' : 'In Stock'}`);
      }
    } catch (err) {
      toast.error(`Failed to toggle availability: ${err.message}`);
    }
  };

  const handleDelete = async (item) => {
    try {
      const res = await api.deleteMenuItem(item._id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i._id !== item._id));
        toast.success(`Deleted "${item.name}" from menu`);
      }
    } catch (err) {
      toast.error(`Failed to delete dish: ${err.message}`);
    }
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      if (!formData.name || formData.price === '' || !formData.category) {
        throw new Error('Name, category, and price are required.');
      }

      if (editingItem) {
        const res = await api.updateMenuItem(editingItem._id, formData);
        if (res.success) {
          setItems((prev) =>
            prev.map((i) => (i._id === editingItem._id ? res.data : i))
          );
          toast.success(`Updated "${res.data.name}"`);
        }
      } else {
        const res = await api.createMenuItem(formData);
        if (res.success) {
          setItems((prev) => [res.data, ...prev]);
          if (!categories.includes(res.data.category)) {
            setCategories((prev) => [...prev, res.data.category]);
          }
          toast.success(`Added "${res.data.name}" to menu`);
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Menu Manager</h1>
          <p className="page-subtitle">Add, update dishes, prices, and toggle kitchen availability</p>
        </div>

        {isAdmin && (
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add New Dish</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '420px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search menu dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', paddingRight: search ? '36px' : '14px' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                padding: '4px'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['All', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`category-pill ${activeCategory === c ? 'active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="glass-panel desktop-table-view" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
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
                <tr key={item._id} className="admin-table-row">
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <MenuThumb src={item.imageUrl} alt={item.name} />
                      <div style={{ minWidth: 0 }}>
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
                      type="button"
                      onClick={() => handleToggleStock(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: item.isAvailable ? 'var(--veg-bg)' : 'rgba(239, 68, 68, 0.16)',
                        color: item.isAvailable ? 'var(--veg-color)' : '#f87171',
                        border: `1px solid ${item.isAvailable ? 'rgba(34, 197, 94, 0.32)' : 'rgba(239, 68, 68, 0.32)'}`
                      }}
                    >
                      {item.isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                    </button>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {isAdmin ? (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit dish"
                          aria-label={`Edit ${item.name}`}
                          style={{ width: '36px', height: '36px' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete dish"
                          aria-label={`Delete ${item.name}`}
                          style={{ width: '36px', height: '36px', color: '#f87171' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>View / Stock Only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (< 768px — zero sideways scrolling) */}
      <div className="mobile-card-list">
        {loading ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading menu database...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No dishes found matching your query.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item._id} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <MenuThumb src={item.imageUrl} alt={item.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span className={`diet-badge ${item.isVeg ? 'veg' : 'non-veg'}`} />
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>₹{item.price}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {item.category}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => handleToggleStock(item)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: item.isAvailable ? 'var(--veg-bg)' : 'rgba(239, 68, 68, 0.16)',
                    color: item.isAvailable ? 'var(--veg-color)' : '#f87171',
                    border: `1px solid ${item.isAvailable ? 'rgba(34, 197, 94, 0.32)' : 'rgba(239, 68, 68, 0.32)'}`
                  }}
                >
                  {item.isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                </button>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn-icon" onClick={() => handleOpenEdit(item)} aria-label={`Edit ${item.name}`} style={{ width: '36px', height: '36px' }}>
                      <Edit2 size={15} />
                    </button>
                    <button type="button" className="btn-icon" onClick={() => setDeleteTarget(item)} aria-label={`Delete ${item.name}`} style={{ width: '36px', height: '36px', color: '#f87171' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)} role="dialog" aria-modal="true" aria-label="Dish form">
          <div className="modal-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '19px', fontWeight: 800 }}>
                {editingItem ? 'Edit Dish Details' : 'Add New Gourmet Dish'}
              </h2>
              <button type="button" className="btn-icon" onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {modalError && (
                  <div
                    role="alert"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      fontSize: '13px'
                    }}
                  >
                    {modalError}
                  </div>
                )}

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

                <div className="responsive-form-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="e.g. Starters, Mains"
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

                <div className="responsive-form-grid">
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
              </div>

              <div className="modal-footer">
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

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Menu Dish?"
        message={deleteTarget ? `Permanently delete "${deleteTarget.name}" from the restaurant menu? This cannot be undone.` : ''}
        confirmLabel="Delete Dish"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) handleDelete(target);
        }}
      />
    </div>
  );
};
