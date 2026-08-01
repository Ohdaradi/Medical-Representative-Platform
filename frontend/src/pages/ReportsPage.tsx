import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [report, setReport] = useState<any>(null);

  const chartItems = metrics ? [
    { label: 'Doctors', value: metrics.totalDoctors },
    { label: 'Visits', value: metrics.totalVisits },
    { label: 'Orders', value: metrics.totalOrders },
    { label: 'Pending Orders', value: metrics.pendingOrders }
  ] : [];

  const maxChartValue = chartItems.length ? Math.max(...chartItems.map((item) => item.value), 1) : 1;

  useEffect(() => {
    const loadMetrics = async () => {
      const response = await fetch('/api/dashboard/metrics');
      setMetrics(await response.json());
    };
    loadMetrics();
  }, []);

  useEffect(() => {
    const loadReport = async () => {
      const response = await fetch(`/api/reports/${period}`);
      setReport(await response.json());
    };
    loadReport();
  }, [period]);

  const exportReport = async () => {
    const response = await fetch(`/api/reports/${period}/csv`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iter-pharma-${period}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdfReport = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/reports/${period}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iter-pharma-${period}-report.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">R</div>
          <h2 className="page-title">Reports & Export</h2>
        </div>
        <span className="chip">Executive reporting</span>
      </section>

      <p className="page-subtitle" style={{ marginBottom: 18 }}>Generate a concise operational snapshot for leadership review.</p>

      <div className="panel-grid">
        <section className="panel">
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Key Metrics</h3>
            <span className="chip">Snapshot</span>
          </div>
          {metrics ? (
            <div className="dashboard-grid" style={{ marginTop: 14 }}>
              <div className="stat-card"><div className="stat-label">Total Doctors</div><div className="stat-value">{metrics.totalDoctors}</div></div>
              <div className="stat-card"><div className="stat-label">Total Visits</div><div className="stat-value">{metrics.totalVisits}</div></div>
              <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{metrics.totalOrders}</div></div>
              <div className="stat-card"><div className="stat-label">Pending Orders</div><div className="stat-value">{metrics.pendingOrders}</div></div>
            </div>
          ) : null}

          {metrics ? (
            <div className="chart-card" style={{ marginTop: 18 }}>
              <div className="page-toolbar" style={{ marginBottom: 12 }}>
                <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Operational Trend</h3>
                <span className="chip">Chart view</span>
              </div>
              <div className="chart-list">
                {chartItems.map((item) => {
                  const width = Math.max(12, Math.round((item.value / maxChartValue) * 100));
                  return (
                    <div className="chart-row" key={item.label}>
                      <div className="chart-row-label">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div className="chart-track">
                        <div className="chart-fill" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Export</h3>
          <p className="page-subtitle" style={{ marginTop: 10 }}>Download a quick CSV snapshot for offline review or leadership updates.</p>
          <div className="stacked-actions" style={{ marginTop: 12 }}>
            <button type="button" className={period === 'daily' ? '' : 'secondary'} onClick={() => setPeriod('daily')}>Daily</button>
            <button type="button" className={period === 'weekly' ? '' : 'secondary'} onClick={() => setPeriod('weekly')}>Weekly</button>
            <button type="button" className={period === 'monthly' ? '' : 'secondary'} onClick={() => setPeriod('monthly')}>Monthly</button>
          </div>
          {report ? (
            <div className="list-grid" style={{ marginTop: 16 }}>
              <div className="data-card"><div><h4>Visits</h4><p>{report.visits}</p></div></div>
              <div className="data-card"><div><h4>Orders</h4><p>{report.orders}</p></div></div>
              <div className="data-card"><div><h4>Samples</h4><p>{report.samples}</p></div></div>
            </div>
          ) : null}
          <div style={{ marginTop: 16 }}>
            <button onClick={exportReport}>Export CSV Report</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="secondary" onClick={exportPdfReport}>Export PDF Report</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
