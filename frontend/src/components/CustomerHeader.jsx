import React from 'react';
import { Search, UtensilsCrossed, Sparkles, X } from 'lucide-react';

export const CustomerHeader = ({
  tableNumber,
  searchQuery,
  setSearchQuery,
  vegOnly,
  setVegOnly
}) => {
  return (
    <header className="customer-header-inner">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              boxShadow: '0 4px 12px var(--accent-glow)',
              flexShrink: 0
            }}
          >
            <UtensilsCrossed size={19} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.15 }}>SmartServe</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Gourmet Dining Experience
            </p>
          </div>
        </div>

        {tableNumber && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(245, 158, 11, 0.16)',
              border: '1px solid rgba(245, 158, 11, 0.34)',
              color: 'var(--accent-primary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Sparkles size={13} />
            <span>Table #{tableNumber}</span>
          </div>
        )}
      </div>

      {/* Search & Veg Filter Row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search dishes, drinks..."
            aria-label="Search menu dishes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '36px',
              paddingRight: searchQuery ? '36px' : '12px',
              minHeight: '42px',
              height: '42px',
              fontSize: '14px'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Veg-only toggle */}
        <button
          type="button"
          onClick={() => setVegOnly(!vegOnly)}
          aria-pressed={vegOnly}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 12px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: vegOnly ? 'var(--veg-bg)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${vegOnly ? 'var(--veg-color)' : 'var(--border-subtle)'}`,
            color: vegOnly ? 'var(--veg-color)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <span className="diet-badge veg" style={{ transform: 'scale(0.85)' }} />
          <span>Veg</span>
        </button>
      </div>
    </header>
  );
};
