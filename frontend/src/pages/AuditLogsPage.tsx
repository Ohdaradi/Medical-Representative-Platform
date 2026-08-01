import { useEffect, useState } from 'react';

type AuditLog = {
  id: number;
  action: string;
  entity: string;
  details: string;
  userEmail: string;
  createdAt: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/audit?${params.toString()}`);
    if (res.ok) setLogs(await res.json());
  };

  useEffect(() => {
    loadLogs();
  }, [search]);

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">📜</div>
          <h2 className="page-title">Audit Logs</h2>
        </div>
        <span className="chip">Admin only</span>
      </section>
      
      <p className="page-subtitle" style={{ marginBottom: 18 }}>
        Review system activity, track changes, and ensure compliance.
      </p>

      <section className="panel">
        <div className="page-toolbar" style={{ marginBottom: 16 }}>
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>System Logs</h3>
          <input
            style={{ width: 260 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, entity, user..."
          />
        </div>
        
        {logs.length === 0 ? (
          <div className="empty-state">No audit logs found.</div>
        ) : (
          <div className="table-shell">
            <div className="table-header">
              <div>Time</div>
              <div>User</div>
              <div>Action</div>
              <div>Details</div>
            </div>
            {logs.map((log) => (
              <div className="table-row" key={log.id}>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </div>
                <div style={{ fontWeight: 600 }}>{log.userEmail}</div>
                <div>
                  <span className="chip" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {log.action}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem' }}>{log.details}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
