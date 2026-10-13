import React from 'react';
import { Search, UtensilsCrossed, Sparkles } from 'lucide-react';

export const CustomerHeader = ({
  tableNumber,
  searchQuery,
  setSearchQuery,
  vegOnly,
  setVegOnly
}) => {
  return (
    <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 40, padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              boxShadow: '0 4px 12px var(--accent-glow)'
            }}
          >
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.1 }}>SmartServe</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gourmet Dining Experience</p>
          </div>
        </div>

        {tableNumber && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-primary)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            <Sparkles size={14} />
            <span>Table #{tableNumber}</span>
          </div>
        )}
      </div>

      {/* Search & Veg Filter Row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search dishes, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '42px', fontSize: '14px' }}
          />
        </div>

        {/* Veg-only toggle */}
        <button
          onClick={() => setVegOnly(!vegOnly)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: vegOnly ? 'var(--veg-bg)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${vegOnly ? 'var(--veg-color)' : 'var(--border-subtle)'}`,
            color: vegOnly ? 'var(--veg-color)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          <span className="diet-badge veg" style={{ transform: 'scale(0.85)' }} />
          <span>Veg</span>
        </button>
      </div>
    </header>
  );
};
