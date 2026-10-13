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
import { UtensilsCrossed, QrCode, Shield, Sparkles, ArrowRight } from 'lucide-react';

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
        onBackToMenu={() => {
          // If previous table is known, navigate there, else default to Table 1
          navigate('/table/1');
        }}
      />
    );
  }

  // 3. Admin Route: /admin
  if (currentPath.startsWith('/admin')) {
    if (!isAuthenticated) {
      return <AdminLoginPage onLoginSuccess={() => navigate('/admin')} />;
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
        {adminTab === 'analytics' && <AnalyticsPage />}
        {adminTab === 'history' && <OrderHistoryPage />}
      </AdminLayout>
    );
  }

  // 4. Default Home Landing: SmartServe Portal Launcher
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '44px 32px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid var(--border-glow)'
        }}
      >
        {/* Brand Icon */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            boxShadow: '0 8px 30px var(--accent-glow)',
            marginBottom: '20px'
          }}
        >
          <UtensilsCrossed size={36} />
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
          SmartServe
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>
          Production-Ready QR Restaurant Ordering & Real-Time Management System with Razorpay Payments & Socket.IO.
        </p>

        {/* Quick Launch Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          {/* Customer Experience Link */}
          <div
            onClick={() => navigate('/table/1')}
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1.5px solid rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}
              >
                <QrCode size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Simulate Customer QR Scan</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Launch digital menu as guest at Table #1
                </p>
              </div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--accent-primary)' }} />
          </div>

          {/* Admin Dashboard Link */}
          <div
            onClick={() => navigate('/admin')}
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1.5px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa'
                }}
              >
                <Shield size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Kitchen & Admin Dashboard</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Live orders, menu CRUD, QR stands, and sales analytics
                </p>
              </div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Table Selector Pills */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Or test specific dining table QR URL directly:
          </p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => navigate(`/table/${num}`)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
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
