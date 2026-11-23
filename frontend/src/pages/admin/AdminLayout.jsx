import React from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  MenuSquare,
  QrCode,
  TrendingUp,
  History,
  LogOut,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const AdminLayout = ({ activeTab, setActiveTab, liveOrdersCount = 0, children }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: 'orders', label: 'Live Orders', mobileLabel: 'Orders', icon: LayoutGrid, badge: liveOrdersCount },
    { id: 'menu', label: 'Menu Items', mobileLabel: 'Menu', icon: MenuSquare },
    { id: 'tables', label: 'Tables & QR', mobileLabel: 'Tables', icon: QrCode },
    ...(isAdmin ? [{ id: 'analytics', label: 'Analytics', mobileLabel: 'Stats', icon: TrendingUp }] : []),
    { id: 'history', label: 'Order History', mobileLabel: 'History', icon: History }
  ];

  return (
    <div className="admin-layout">
      {/* Top Navigation Bar */}
      <header className="admin-navbar glass-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: 0 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
                boxShadow: '0 4px 14px var(--accent-glow)',
                flexShrink: 0
              }}
            >
              <UtensilsCrossed size={19} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.1 }}>SmartServe</h2>
              <span className="admin-brand-sub">Management Dashboard</span>
            </div>
          </div>

          {/* Desktop Nav Tabs (hidden cleanly via CSS below 1024px) */}
          <nav className="admin-nav-links" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`admin-nav-tab ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Socket Status & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: 'var(--radius-full)',
              background: isConnected ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)',
              color: isConnected ? '#4ade80' : '#f87171',
              border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.32)' : 'rgba(239, 68, 68, 0.32)'}`,
              whiteSpace: 'nowrap'
            }}
            title={isConnected ? 'Real-time WebSocket active' : 'Connecting to WebSocket...'}
          >
            <Radio size={13} className={isConnected ? 'pulse-glow' : ''} />
            <span className="sync-label-full">{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
            <span className="sync-label-short">{isConnected ? 'LIVE' : 'OFF'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="admin-user-meta">
              <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>{user?.name || 'Manager'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role || 'Admin'}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-icon"
              title="Sign Out"
              aria-label="Sign Out"
              style={{ color: '#f87171', width: '38px', height: '38px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="admin-main">
        {children}
      </main>

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <nav
        className="admin-mobile-nav"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        aria-label="Mobile admin navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`admin-mobile-tab ${isActive ? 'active' : ''}`}
            >
              <span className="admin-mobile-icon-wrap">
                <Icon size={20} />
                {item.badge > 0 && (
                  <span className="admin-mobile-badge">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
