import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  CreditCard,
  PieChart,
  Calendar,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
        <Sparkles className="animate-spin" size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
        <p>Crunching sales analytics and order numbers...</p>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    todayRevenue = 0,
    totalOrdersCount = 0,
    todayOrdersCount = 0,
    averageOrderValue = 0,
    statusCounts = {},
    paymentBreakdown = {},
    popularItems = []
  } = data || {};

  const statCards = [
    {
      title: "Today's Revenue",
      value: `₹${todayRevenue.toLocaleString()}`,
      sub: `${todayOrdersCount} orders placed today`,
      icon: TrendingUp,
      color: '#f59e0b'
    },
    {
      title: 'Total Cumulative Sales',
      value: `₹${totalRevenue.toLocaleString()}`,
      sub: `Across ${totalOrdersCount} all-time orders`,
      icon: DollarSign,
      color: '#10b981'
    },
    {
      title: 'Avg Order Value (AOV)',
      value: `₹${averageOrderValue}`,
      sub: 'Per customer checkout',
      icon: ShoppingBag,
      color: '#3b82f6'
    },
    {
      title: 'Online Payment Adoption',
      value: `${paymentBreakdown.Razorpay ? Math.round((paymentBreakdown.Razorpay / (totalOrdersCount || 1)) * 100) : 0}%`,
      sub: `${paymentBreakdown.Razorpay || 0} via Razorpay`,
      icon: CreditCard,
      color: '#8b5cf6'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Restaurant Sales & Insights</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Financial metrics, dish popularity, and digital payments performance
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchAnalytics}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Hero Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: 'rgba(20, 28, 48, 0.85)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {card.title}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: `${card.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {card.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Popular Dishes */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Award size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Top Selling Dishes</h2>
          </div>

          {popularItems.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No order item data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {popularItems.map((dish, i) => {
                const maxOrdered = popularItems[0]?.totalOrdered || 1;
                const percent = Math.round((dish.totalOrdered / maxOrdered) * 100);

                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700 }}>{dish._id}</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                        {dish.totalOrdered} orders (₹{dish.revenueGenerated})
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'var(--accent-gradient)',
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment & Status Distribution */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <PieChart size={20} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Payment Method Split</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>Razorpay Online</div>
                <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>{paymentBreakdown.Razorpay || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>UPI, Cards & Wallets</div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Pay at Counter</div>
                <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>{paymentBreakdown.Counter || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cash / Waiter EDC</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Kitchen Workflow Pipeline
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>{statusCounts.Pending || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pending</div>
              </div>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.15)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#a78bfa' }}>{statusCounts.Preparing || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cooking</div>
              </div>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{statusCounts.Ready || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ready</div>
              </div>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(100, 116, 139, 0.15)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#94a3b8' }}>{statusCounts.Served || 0}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Served</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
