import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// ────────────────────────────────────────────────────────────
// MR DASHBOARD
// ────────────────────────────────────────────────────────────
function MRDashboard() {
  const fullName = localStorage.getItem('fullName') || 'MR';
  const [todaysVisits, setTodaysVisits] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ total: 0, completed: 0, pending: 0, ordersToday: 0, samplesIssued: 0, notifications: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [visitsRes, ordersRes, samplesRes, notifRes] = await Promise.all([
          fetch('/api/visits?period=daily'),
          fetch('/api/orders?period=daily'),
          fetch('/api/samples'),
          fetch('/api/notifications?limit=50')
        ]);
        const visits: any[] = visitsRes.ok ? await visitsRes.json() : [];
        const orders: any[] = ordersRes.ok ? await ordersRes.json() : [];
        const samples: any[] = samplesRes.ok ? await samplesRes.json() : [];
        const notifs: any[] = notifRes.ok ? await notifRes.json() : [];

        const userId = Number(localStorage.getItem('userId'));
        const myVisits = visits.filter((v: any) => v.repId === userId || !userId);
        const myOrders = orders.filter((o: any) => o.repId === userId || !userId);
        const mySamples = samples.filter((s: any) => s.issuedByRepId === userId || !userId);

        setTodaysVisits(myVisits);
        setKpis({
          total: myVisits.length,
          completed: myVisits.filter((v: any) => v.status === 'completed' || v.status === 'approved').length,
          pending: myVisits.filter((v: any) => !['completed', 'approved'].includes(v.status || '')).length,
          ordersToday: myOrders.length,
          samplesIssued: mySamples.length,
          notifications: notifs.length
        });
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusColor = (status?: string) => {
    if (!status) return 'var(--muted)';
    if (['completed', 'approved'].includes(status)) return '#16a34a';
    if (status === 'in_progress') return 'var(--accent)';
    return 'var(--warm)';
  };

  const statusLabel = (status?: string) => {
    if (!status || status === 'draft') return 'Pending';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'completed' || status === 'approved') return 'Completed';
    return status;
  };

  return (
    <div>
      <section className="hero" style={{ marginBottom: 24 }}>
        <div className="hero-kicker">MR Workspace</div>
        <div className="hero-grid">
          <div>
            <h1>Welcome, {fullName}.</h1>
            <p>Here's your field overview for today. Stay on track with your visit schedule.</p>
          </div>
        </div>
      </section>

      <div className="dashboard-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card"><div className="stat-label">Today's Visits</div><div className="stat-value">{kpis.total}</div></div>
        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value" style={{ color: '#16a34a' }}>{kpis.completed}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: 'var(--warm)' }}>{kpis.pending}</div></div>
        <div className="stat-card"><div className="stat-label">Orders Today</div><div className="stat-value">{kpis.ordersToday}</div></div>
        <div className="stat-card"><div className="stat-label">Samples Issued</div><div className="stat-value">{kpis.samplesIssued}</div></div>
        <div className="stat-card"><div className="stat-label">Notifications</div><div className="stat-value">{kpis.notifications}</div></div>
      </div>

      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="page-toolbar" style={{ marginBottom: 14 }}>
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>📅 Today's Schedule</h3>
          <Link to="/visits" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>View All →</Link>
        </div>
        {todaysVisits.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
            <p style={{ margin: 0 }}>No visits logged today. <Link to="/visits" style={{ color: 'var(--accent)' }}>Log your first visit →</Link></p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {todaysVisits.map((visit, idx) => (
              <div key={visit.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 12, alignItems: 'center', padding: '14px 18px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{idx + 1}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{visit.doctor?.name || 'Unknown Doctor'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{visit.doctor?.specialty || visit.notes || 'No notes'}</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatTime(visit.checkInAt || visit.visitDate)}</div>
                <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: `${statusColor(visit.status)}1a`, color: statusColor(visit.status), whiteSpace: 'nowrap' }}>{statusLabel(visit.status)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { to: '/visits', icon: '🏥', label: 'Log a Visit' },
          { to: '/orders', icon: '📦', label: 'Create Order' },
          { to: '/samples', icon: '💊', label: 'Issue Sample' },
          { to: '/notifications', icon: '🔔', label: 'Notifications' },
          { to: '/profile', icon: '👤', label: 'My Profile' },
          { to: '/help', icon: '💬', label: 'Help & Support' },
        ].map((item) => (
          <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            <div className="data-card" style={{ cursor: 'pointer', transition: 'transform 0.15s ease', textAlign: 'center', padding: '18px 12px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{item.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MANAGER DASHBOARD
// ────────────────────────────────────────────────────────────
function ManagerDashboard() {
  const fullName = localStorage.getItem('fullName') || 'Manager';
  const [summary, setSummary] = useState<any>(null);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [summaryRes, metricsRes] = await Promise.all([
        fetch('/api/dashboard/team-summary'),
        fetch('/api/dashboard/metrics')
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setRecentVisits(m.recentVisits || []);
        setRecentOrders(m.recentOrders || []);
      }
    };
    load();
  }, []);

  const s = summary;

  const kpis = s ? [
    { label: 'Total MRs', value: s.totalReps, color: 'var(--accent)' },
    { label: 'MRs Active Today', value: s.activeTodayCount, color: '#16a34a' },
    { label: 'Completed Visits', value: s.completedVisitsToday, color: '#16a34a' },
    { label: 'Pending Visits', value: s.pendingVisitsToday, color: '#f59e0b' },
    { label: 'Orders Today', value: s.ordersToday, color: 'var(--accent)' },
    { label: 'Samples Issued', value: s.samplesToday, color: 'var(--accent)' },
    { label: 'Visit Completion', value: `${s.visitCompletionPct}%`, color: s.visitCompletionPct >= 70 ? '#16a34a' : '#f59e0b' },
    { label: 'Active Territories', value: s.activeTerritories, color: 'var(--accent)' },
  ] : [];

  const topPerformer = s?.mrPerformance?.[0];
  const lowestPerformer = s?.mrPerformance?.length > 1 ? s.mrPerformance[s.mrPerformance.length - 1] : null;

  const PerformerCard = ({ item, label, color }: { item: any; label: string; color: string }) => (
    <div className="panel" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg,${color},${color}cc)`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem', flexShrink: 0 }}>
          {(item.rep?.fullName || 'U').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.rep?.fullName || item.rep?.email || 'Unknown'}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{item.visits} total visits · {item.todayVisitCount} today</div>
          <div style={{ marginTop: 8, background: 'var(--surface)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${item.performancePct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.4rem', color }}>{item.performancePct}%</div>
      </div>
    </div>
  );

  return (
    <div>
      <section className="hero" style={{ marginBottom: 24 }}>
        <div className="hero-kicker">Field Operations</div>
        <div className="hero-grid">
          <div>
            <h1>Welcome, {fullName}.</h1>
            <p>Monitor your team's field performance and keep operations on track.</p>
          </div>
        </div>
      </section>

      {/* 8 KPI Cards */}
      {s && (
        <div className="dashboard-grid" style={{ marginBottom: 28 }}>
          {kpis.map((kpi) => (
            <div className="stat-card" key={kpi.label}>
              <div className="stat-label">{kpi.label}</div>
              <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top / Lowest Performer */}
      {(topPerformer || lowestPerformer) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {topPerformer && <PerformerCard item={topPerformer} label="⭐ Top Performer" color="#16a34a" />}
          {lowestPerformer && <PerformerCard item={lowestPerformer} label="📈 Needs Attention" color="#f59e0b" />}
        </div>
      )}

      <div className="panel-grid">
        {/* Full MR Performance List */}
        {s?.mrPerformance?.length > 0 && (
          <section className="panel">
            <h3 className="page-title" style={{ fontSize: '1.05rem', marginBottom: 16 }}>👥 MR Performance</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {s.mrPerformance.map((item: any) => (
                <div key={item.rep?.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                    {(item.rep?.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>{item.rep?.fullName || item.rep?.email || 'Unknown'}</div>
                    <div style={{ background: 'var(--surface)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${item.performancePct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-strong))', borderRadius: 999 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)', minWidth: 36, textAlign: 'right' }}>{item.performancePct}%</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', minWidth: 52, textAlign: 'right' }}>{item.visits} visits</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.05rem', marginBottom: 14 }}>🕐 Recent Activity</h3>
          {recentVisits.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Latest Visits</div>
              {recentVisits.slice(0, 3).map((v: any) => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.doctor?.name || 'Unknown Doctor'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{v.rep?.fullName || v.rep?.email}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: v.status === 'completed' ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', color: v.status === 'completed' ? '#16a34a' : '#f59e0b' }}>
                    {v.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {recentOrders.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Recent Orders</div>
              {recentOrders.slice(0, 3).map((o: any) => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{o.product?.name || 'Unknown Product'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{o.doctor?.name}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(15,118,110,0.1)', color: 'var(--accent)' }}>Qty {o.quantity}</span>
                </div>
              ))}
            </div>
          )}
          {recentVisits.length === 0 && recentOrders.length === 0 && (
            <div className="empty-state">No recent activity yet.</div>
          )}
        </section>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [mrPerformance, setMrPerformance] = useState<any[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [metricsRes, mrRes, salesRes, systemStatsRes] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/dashboard/mr-performance'),
        fetch('/api/dashboard/sales-analytics'),
        fetch('/api/dashboard/system-stats')
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (mrRes.ok) setMrPerformance(await mrRes.json());
      if (salesRes.ok) setSalesAnalytics(await salesRes.json());
      if (systemStatsRes.ok) setSystemStats(await systemStatsRes.json());
    };
    loadData();
  }, []);

  return (
    <div>
      <section className="hero" style={{ marginBottom: 24 }}>
        <div className="hero-kicker">System Dashboard</div>
        <div className="hero-grid">
          <div>
            <h1>Global administrative overview.</h1>
            <p>Monitor activity, identify bottlenecks, and keep a clean compliance trail.</p>
          </div>
        </div>
      </section>

      {metrics ? (
        <div className="dashboard-grid">
          <div className="stat-card"><div className="stat-label">Total Doctors</div><div className="stat-value">{metrics.totalDoctors}</div></div>
          <div className="stat-card"><div className="stat-label">Total Visits</div><div className="stat-value">{metrics.totalVisits}</div></div>
          <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{metrics.totalOrders}</div></div>
          <div className="stat-card"><div className="stat-label">Total Samples</div><div className="stat-value">{metrics.totalSamples}</div></div>
          <div className="stat-card"><div className="stat-label">Pending Orders</div><div className="stat-value">{metrics.pendingOrders}</div></div>
          <div className="stat-card"><div className="stat-label">Today's Visits</div><div className="stat-value">{metrics.todaysVisits}</div></div>
        </div>
      ) : null}

      <div className="page-section panel-grid">
        <section className="panel">
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <div><h3 className="page-title" style={{ marginBottom: 0 }}>MR Performance</h3></div>
          </div>
          <div className="chart-card">
            <div className="chart-list">
              {mrPerformance.length ? mrPerformance.map((item: any) => (
                <div className="chart-row" key={item.rep?.id || item.rep?.email}>
                  <div className="chart-row-label">
                    <span>
                      {item.rep?.fullName || item.rep?.email || 'Unassigned rep'}
                      {item.label && <span className={`chip ${item.label === 'Top Performer' ? 'badge-top' : 'badge-low'}`} style={{ marginLeft: 8 }}>{item.label}</span>}
                    </span>
                    <strong>{item.visits}</strong>
                  </div>
                  <div className="chart-track"><div className="chart-fill" style={{ width: `${Math.max(12, Math.round((item.visits / Math.max(...mrPerformance.map((p: any) => p.visits), 1)) * 100))}%` }} /></div>
                </div>
              )) : <div className="empty-state">No MR data yet.</div>}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <div><h3 className="page-title" style={{ marginBottom: 0 }}>Sales Analytics</h3></div>
          </div>
          <div className="list-grid">
            {salesAnalytics.length ? (salesAnalytics as any[]).map((item) => (
              <div className="data-card" key={item.product?.id || item.product?.name}>
                <div>
                  <h4>{item.product?.name || 'Unknown product'}</h4>
                  <p>Ordered quantity</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="chip">{item.quantity} units</span>
                  {item.revenue !== undefined && <p style={{ marginTop: '4px', fontSize: '0.9rem', fontWeight: 600 }}>₹{item.revenue?.toLocaleString() || '0'}</p>}
                </div>
              </div>
            )) : <div className="empty-state">No sales analytics yet.</div>}
          </div>
        </section>
      </div>

      {systemStats ? (
        <div className="page-section panel-grid" style={{ marginTop: 24 }}>
          <section className="panel" style={{ gridColumn: '1 / -1' }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>System Statistics</h3>
            <div className="dashboard-grid">
              <div className="stat-card"><div className="stat-label">System Users</div><div className="stat-value">{systemStats.totalUsers}</div></div>
              <div className="stat-card"><div className="stat-label">Active Territories</div><div className="stat-value">{systemStats.totalTerritories}</div></div>
              <div className="stat-card"><div className="stat-label">Notifications Sent</div><div className="stat-value">{systemStats.totalNotifications}</div></div>
              <div className="stat-card"><div className="stat-label">Audit Logs</div><div className="stat-value">{systemStats.totalAuditLogs}</div></div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ROOT EXPORT
// ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const role = localStorage.getItem('role') || 'rep';
  if (role === 'rep') return <MRDashboard />;
  if (role === 'manager') return <ManagerDashboard />;
  return <AdminDashboard />;
}
