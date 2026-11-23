import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TableMenuPage } from './pages/customer/TableMenuPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { LiveOrdersPage } from './pages/admin/LiveOrdersPage';
import { MenuManagerPage } from './pages/admin/MenuManagerPage';
import { TablesManagerPage } from './pages/admin/TablesManagerPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { OrderHistoryPage } from './pages/admin/OrderHistoryPage';
import { UtensilsCrossed, QrCode, Shield, ArrowRight } from 'lucide-react';

export const App = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [adminTab, setAdminTab] = useState('orders');
  const [liveOrdersCount, setLiveOrdersCount] = useState(0);

  // Sync route on popstate
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // 1. Customer Table Route: /table/:tableNumber
  const tableMatch = currentPath.match(/^\/table\/(\d+)/);
  if (tableMatch) {
    const tableNumber = parseInt(tableMatch[1], 10);
    return (
      <TableMenuPage
        tableNumber={tableNumber}
        onNavigateToOrder={(orderId) => navigate(`/order/${orderId}`)}
      />
    );
  }

  // 2. Customer Order Tracking Route: /order/:orderId
  const orderMatch = currentPath.match(/^\/order\/([a-zA-Z0-9_-]+)/);
  if (orderMatch) {
    const orderId = orderMatch[1];
    return (
      <OrderTrackingPage
        orderId={orderId}
        onBackToMenu={(tableNum) => {
          navigate(`/table/${tableNum || 1}`);
        }}
      />
    );
  }

  // 3. Admin Route: /admin
  if (currentPath.startsWith('/admin')) {
    if (!isAuthenticated) {
      return (
        <AdminLoginPage
          onLoginSuccess={() => navigate('/admin')}
          onBackToPortal={() => navigate('/')}
        />
      );
    }

    return (
      <AdminLayout
        activeTab={adminTab}
        setActiveTab={setAdminTab}
        liveOrdersCount={liveOrdersCount}
      >
        {adminTab === 'orders' && (
          <LiveOrdersPage onOrdersCountChange={setLiveOrdersCount} />
        )}
        {adminTab === 'menu' && <MenuManagerPage />}
        {adminTab === 'tables' && <TablesManagerPage />}
        {adminTab === 'analytics' && (
          user?.role === 'admin' ? <AnalyticsPage /> : <LiveOrdersPage onOrdersCountChange={setLiveOrdersCount} />
        )}
        {adminTab === 'history' && <OrderHistoryPage />}
      </AdminLayout>
    );
  }

  // 4. Default Home Landing: SmartServe Portal Launcher
  return (
    <div className="portal-shell">
      <div className="glass-panel portal-card animate-fade-in">
        {/* Brand Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            boxShadow: '0 8px 30px var(--accent-glow)',
            marginBottom: '18px'
          }}
        >
          <UtensilsCrossed size={32} />
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 800, marginBottom: '8px' }}>
          SmartServe
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.55 }}>
          QR Restaurant Ordering & Real-Time Kitchen Management System with Razorpay Payments & Socket.IO.
        </p>

        {/* Quick Launch Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            className="portal-launch-btn primary"
            onClick={() => navigate('/table/1')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0
                }}
              >
                <QrCode size={22} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Simulate Customer QR Scan
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Launch digital menu as guest at Table #1
                </div>
              </div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          </button>

          <button
            type="button"
            className="portal-launch-btn secondary"
            onClick={() => navigate('/admin')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa',
                  flexShrink: 0
                }}
              >
                <Shield size={22} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Kitchen & Admin Dashboard
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Live orders, menu CRUD, QR stands, and sales analytics
                </div>
              </div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>
        </div>

        {/* Table Selector Pills */}
        <div style={{ marginTop: '26px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Or test a specific dining table QR URL directly:
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => navigate(`/table/${num}`)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px', minHeight: '36px' }}
              >
                Table {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
