import React from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  MenuSquare,
  QrCode,
  TrendingUp,
  History,
  LogOut,
  Radio,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const AdminLayout = ({ activeTab, setActiveTab, liveOrdersCount = 0, children }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  const navItems = [
    { id: 'orders', label: 'Live Orders', icon: LayoutGrid, badge: liveOrdersCount },
    { id: 'menu', label: 'Menu Items', icon: MenuSquare },
    { id: 'tables', label: 'Tables & QR Codes', icon: QrCode },
    { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp },
    { id: 'history', label: 'Order History', icon: History }
  ];

  return (
    <div className="admin-layout">
      {/* Top Navigation Bar */}
      <header className="admin-navbar glass-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {/* Brand */}
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
                boxShadow: '0 4px 14px var(--accent-glow)'
              }}
            >
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.1 }}>SmartServe</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Management Dashboard
              </span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="admin-nav-links" style={{ display: 'flex' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`admin-nav-tab ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 6px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Socket.IO Real-time Connection Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: isConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isConnected ? '#22c55e' : '#ef4444',
              border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
            title={isConnected ? 'Real-time WebSocket active' : 'Connecting to WebSocket...'}
          >
            <Radio size={14} className={isConnected ? 'pulse-glow' : ''} />
            <span>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>

          {/* User profile info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{user?.name || 'Manager'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role || 'Admin'}
              </div>
            </div>
            <button
              onClick={logout}
              className="btn-icon"
              title="Sign Out"
              style={{ color: '#ef4444' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Pane */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar for SmartPhones & iOS */}
      <nav className="admin-mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`admin-mobile-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '12px',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
  );
};
