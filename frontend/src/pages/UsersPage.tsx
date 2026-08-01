import { useEffect, useState } from 'react';
import type { User } from '../types';

// ────────────────── MANAGER VIEW: MR Performance Cards ──────────────────
function ManagerTeamView() {
  const [reps, setReps] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const [usersRes, perfRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/dashboard/team-summary')
      ]);
      const users: User[] = usersRes.ok ? await usersRes.json() : [];
      const perf: any = perfRes.ok ? await perfRes.json() : {};
      const repList = users.filter((u) => u.role === 'rep');
      const perfMap: Record<number, any> = {};
      (perf.mrPerformance || []).forEach((p: any) => { if (p.rep?.id) perfMap[p.rep.id] = p; });
      setReps(repList.map((r) => ({ ...r, perf: perfMap[r.id] || null })));
    };
    load();
  }, []);

  const loadRepDetails = async (repId: number) => {
    if (expandedId === repId) { setExpandedId(null); setExpandedData(null); return; }
    setExpandedId(repId);
    setExpandedData(null);
    // Fetch last few visits for this rep
    const res = await fetch(`/api/visits?search=&period=monthly`);
    if (res.ok) {
      const visits = await res.json();
      setExpandedData(visits.filter((v: any) => v.repId === repId).slice(0, 5));
    }
  };

  const filtered = reps.filter((r) =>
    !search || (r.fullName || r.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">M</div>
          <h2 className="page-title">Medical Representatives</h2>
        </div>
        <span className="chip">Team overview</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 20 }}>Monitor your team's performance, visit counts, and activity.</p>

      <div style={{ marginBottom: 20 }}>
        <input style={{ maxWidth: 320 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search MR by name..." />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No medical representatives found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filtered.map((rep) => {
            const p = rep.perf;
            const isExpanded = expandedId === rep.id;
            return (
              <div key={rep.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                {/* MR Card Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto auto auto auto', gap: 16, alignItems: 'center', padding: '18px 22px' }}>
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                    {(rep.fullName || rep.email || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Name + ID */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{rep.fullName || 'Unnamed'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>EMP-{String(rep.id).padStart(4, '0')} · {rep.email}</div>
                    {p && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 140, background: 'var(--surface)', borderRadius: 999, height: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${p.performancePct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-strong))', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{p.performancePct}%</span>
                      </div>
                    )}
                  </div>

                  {/* Today's Visits */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{p?.todayVisitCount ?? '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Today</div>
                  </div>

                  {/* Completed */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{p?.todayCompleted ?? '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Done</div>
                  </div>

                  {/* Total Visits */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{p?.visits ?? '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>All-time</div>
                  </div>

                  {/* Expand button */}
                  <button type="button" className="btn-ghost"
                    onClick={() => loadRepDetails(rep.id)}
                    style={{ margin: 0, padding: '8px 16px', fontSize: '0.82rem' }}>
                    {isExpanded ? '▲ Hide' : '▼ History'}
                  </button>
                </div>

                {/* Expanded visit history */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 22px', background: 'var(--surface)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Recent Visits (last 30 days)</div>
                    {expandedData === null ? (
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading...</div>
                    ) : expandedData.length === 0 ? (
                      <div className="empty-state" style={{ margin: 0 }}>No visits this month.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {expandedData.map((v: any) => (
                          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.doctor?.name || 'Unknown Doctor'}</span>
                              {v.notes && <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--muted)' }}>{v.notes.slice(0, 40)}…</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{v.visitDate ? new Date(v.visitDate).toLocaleDateString() : '—'}</span>
                              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: ['completed', 'approved'].includes(v.status) ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', color: ['completed', 'approved'].includes(v.status) ? '#16a34a' : '#f59e0b' }}>
                                {v.status || 'draft'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────── ADMIN VIEW: Full User Management ──────────────────
function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('rep');
  const [search, setSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Server error' }));
        console.error('Failed to load users:', err.message);
        return;
      }
      setUsers(await res.json());
    } catch (e) {
      console.error('loadUsers error:', e);
    }
  };

  useEffect(() => { loadUsers(); }, [search]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, email, password, role }) });
    setFullName(''); setEmail(''); setPassword(''); setRole('rep');
    loadUsers();
  };

  const startEdit = (user: User) => { setEditingUserId(user.id); setEditFullName(user.fullName || ''); setEditEmail(user.email); setEditRole(user.role); setEditPassword(''); };
  const cancelEdit = () => setEditingUserId(null);

  const saveEdit = async (id: number) => {
    const body: any = { fullName: editFullName, email: editEmail, role: editRole };
    if (editPassword) body.password = editPassword;
    await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setEditingUserId(null);
    loadUsers();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadUsers();
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title"><div className="section-icon">U</div><h2 className="page-title">User Management</h2></div>
        <span className="chip">Admin only</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 18 }}>Create and manage platform users, roles, and access.</p>

      <div className="panel-grid">
        <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Add User</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 14 }}>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="rep">Medical Representative</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" style={{ gridColumn: '1 / -1' }}>Save User</button>
          </form>
        </section>

        <section className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Users</h3>
            <div className="stacked-actions">
              <input style={{ width: 220 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" />
              <button type="button" className="btn-ghost" onClick={loadUsers}>Search</button>
            </div>
          </div>
          {users.length ? (
            <div className="table-shell">
              <div className="table-header"><div>User</div><div>Email</div><div>Role</div><div>Actions</div></div>
              {users.map((user) => (
                <div className="table-row" key={user.id}>
                  {editingUserId === user.id ? (
                    <>
                      <div><input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Full name" /></div>
                      <div><input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" /></div>
                      <div>
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ marginBottom: '8px' }}>
                          <option value="rep">Medical Representative</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                        <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="New Password (optional)" type="password" />
                      </div>
                      <div className="table-actions">
                        <button type="button" className="btn-ghost" onClick={() => saveEdit(user.id)}>Save</button>
                        <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><h4>{user.fullName || 'Unnamed user'}</h4><p>ID {user.id}</p></div>
                      <div>{user.email}</div>
                      <div><span className="chip">{user.role}</span></div>
                      <div className="table-actions">
                        <button type="button" className="btn-ghost" onClick={() => startEdit(user)}>Edit</button>
                        <button type="button" className="btn-ghost" onClick={() => setDeleteConfirm(user.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No users found.</div>}
        </section>
      </div>

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-dialog">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const role = localStorage.getItem('role') || '';
  if (role === 'manager') return <ManagerTeamView />;
  return <AdminUsersView />;
}
