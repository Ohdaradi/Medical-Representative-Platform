import { useEffect, useState } from 'react';
import type { Territory, User } from '../types';

export default function TerritoriesPage() {
  const role = localStorage.getItem('role') || '';
  const canManage = role === 'admin';   // only admin can create/edit/delete
  const isAdmin = role === 'admin';

  const [territories, setTerritories] = useState<Territory[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [allReps, setAllReps] = useState<User[]>([]);

  // Create Form
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [coverageTarget, setCoverageTarget] = useState('');
  const [createError, setCreateError] = useState('');

  // Edit Modal
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverageTarget, setEditCoverageTarget] = useState('');

  // Assign MR Modal
  const [assigningTerritory, setAssigningTerritory] = useState<Territory | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Detail Modal
  const [viewingTerritory, setViewingTerritory] = useState<Territory | null>(null);

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadTerritories = async () => {
    const res = await fetch('/api/territories');
    if (res.ok) setTerritories(await res.json());
  };

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/territories/dashboard');
      if (res.ok) setDashboard(await res.json());
    } catch { /* silent */ }
  };

  const loadReps = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const users: User[] = await res.json();
      setAllReps(users.filter((u) => u.role === 'rep'));
    }
  };

  useEffect(() => {
    loadTerritories();
    loadDashboard();
    if (canManage) loadReps();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    const res = await fetch('/api/territories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, region, description, coverageTarget: coverageTarget ? Number(coverageTarget) : 0 })
    });
    if (!res.ok) {
      const d = await res.json();
      setCreateError(d.message || 'Failed to create territory');
      return;
    }
    setName(''); setRegion(''); setDescription(''); setCoverageTarget('');
    loadTerritories();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerritory) return;
    await fetch(`/api/territories/${editingTerritory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, region: editRegion, description: editDescription, coverageTarget: editCoverageTarget ? Number(editCoverageTarget) : 0 })
    });
    setEditingTerritory(null);
    loadTerritories();
  };

  const openEditModal = (t: Territory) => {
    setEditingTerritory(t);
    setEditName(t.name);
    setEditRegion(t.region);
    setEditDescription(t.description || '');
    setEditCoverageTarget(t.coverageTarget?.toString() || '');
  };

  const openAssignModal = (t: Territory) => {
    setAssigningTerritory(t);
    setAssignError('');
    // Pre-select already assigned reps
    const currentIds = new Set((t.assignedReps ?? []).map((r) => r.id));
    setSelectedUserIds(currentIds);
  };

  const toggleRep = (id: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAssignSave = async () => {
    if (!assigningTerritory) return;
    setAssignLoading(true);
    setAssignError('');
    const territory = assigningTerritory;
    const currentIds = new Set((territory.assignedReps ?? []).map((r) => r.id));
    const toAdd = [...selectedUserIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !selectedUserIds.has(id));

    try {
      if (toAdd.length > 0) {
        await fetch(`/api/territories/${territory.id}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: toAdd })
        });
      }
      for (const uid of toRemove) {
        await fetch(`/api/territories/${territory.id}/assignments/${uid}`, { method: 'DELETE' });
      }
      setAssigningTerritory(null);
      loadTerritories();
    } catch {
      setAssignError('Failed to save assignments. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/territories/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadTerritories();
  };

  return (
    <div>
      {/* Header */}
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">T</div>
          <h2 className="page-title">Territory Management</h2>
        </div>
        <span className="chip">Coverage planning</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 18 }}>
        Organize regions and assign Medical Representatives to territories.
      </p>

      {/* Dashboard Summary */}
      {dashboard && (
        <section className="panel" style={{ marginBottom: 18 }}>
          <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Territory Overview</h3>
          <div className="dashboard-grid" style={{ marginTop: 14 }}>
            <div className="stat-card">
              <div className="stat-label">Doctor Coverage</div>
              <div className="stat-value">{dashboard.coveragePercent ?? 0}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Doctors Covered</div>
              <div className="stat-value">{dashboard.doctorsCovered ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Visits</div>
              <div className="stat-value">{dashboard.pendingVisits ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Territories</div>
              <div className="stat-value">{territories.length}</div>
            </div>
          </div>
        </section>
      )}

      <div className="panel-grid">
        {/* Create Territory Form */}
        {canManage && (
          <section className="panel">
            <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Create Territory</h3>
            <form onSubmit={handleCreate} className="form-grid" style={{ marginTop: 14 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Territory name *" required />
              <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region *" required />
              <input
                value={coverageTarget}
                onChange={(e) => setCoverageTarget(e.target.value)}
                placeholder="Coverage Target (%)"
                type="number"
                min="0"
                max="100"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                style={{ minHeight: 80 }}
              />
              {createError && (
                <div style={{ color: '#b42318', fontWeight: 600, fontSize: '0.9rem' }}>{createError}</div>
              )}
              <button type="submit" style={{ gridColumn: '1 / -1' }}>Create Territory</button>
            </form>
          </section>
        )}

        {/* Territory List */}
        <section className="panel" style={{ gridColumn: canManage ? 'auto' : '1 / -1' }}>
          <div className="page-toolbar" style={{ marginBottom: 12 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Territory Directory</h3>
            <span className="chip">{territories.length} zones</span>
          </div>

          {territories.length ? (
            <div className="list-grid">
              {territories.map((territory) => (
                <div className="data-card" key={territory.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px' }}>{territory.name}</h4>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
                        {territory.region}
                        {territory.description && ` · ${territory.description}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <span className="chip">{territory.repCount ?? 0} MR{(territory.repCount ?? 0) !== 1 ? 's' : ''}</span>
                      {territory.coverageTarget ? (
                        <span className="chip" style={{ background: 'rgba(231,182,87,0.15)', color: '#a07800' }}>
                          Target: {territory.coverageTarget}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Assigned MR Pills */}
                  {(territory.assignedReps?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {territory.assignedReps!.map((rep) => (
                        <span
                          key={rep.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 999,
                            background: 'rgba(15,118,110,0.08)', color: 'var(--accent-strong)',
                            fontSize: '0.8rem', fontWeight: 600
                          }}
                        >
                          {rep.fullName || rep.email}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="table-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="button" className="btn-ghost" onClick={() => setViewingTerritory(territory)}>View</button>
                    {canManage && (
                      <button type="button" className="btn-ghost" onClick={() => openEditModal(territory)}>Edit</button>
                    )}
                    {canManage && (
                      <button type="button" className="btn-ghost" onClick={() => openAssignModal(territory)}>
                        Assign MRs
                      </button>
                    )}
                    {isAdmin && (
                      <button type="button" className="btn-ghost" style={{ color: '#b42318' }} onClick={() => setDeleteConfirm(territory.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No territories created yet.</div>
          )}
        </section>
      </div>

      {/* ── Assign Representatives Modal ─────────────────────────────────── */}
      {assigningTerritory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Assign Representatives — {assigningTerritory.name}</h3>
            <p className="page-subtitle" style={{ marginTop: 6, marginBottom: 16 }}>
              Select one or more Medical Representatives to assign to this territory.
              The representative count is calculated automatically.
            </p>

            {allReps.length === 0 ? (
              <div className="empty-state">No Medical Representatives found in the system.</div>
            ) : (
              <div className="list-grid" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 14 }}>
                {allReps.map((rep) => {
                  const isChecked = selectedUserIds.has(rep.id);
                  return (
                    <label
                      key={rep.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 14,
                        background: isChecked ? 'rgba(15,118,110,0.08)' : 'rgba(255,255,255,0.9)',
                        border: `1px solid ${isChecked ? 'rgba(15,118,110,0.25)' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRep(rep.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rep.fullName || '—'}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{rep.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(15,118,110,0.06)', marginBottom: 14,
              fontSize: '0.88rem', color: 'var(--accent-strong)', fontWeight: 600
            }}>
              {selectedUserIds.size} representative{selectedUserIds.size !== 1 ? 's' : ''} selected
            </div>

            {assignError && (
              <div style={{ color: '#b42318', fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>{assignError}</div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setAssigningTerritory(null)}>Cancel</button>
              <button type="button" onClick={handleAssignSave} disabled={assignLoading}>
                {assignLoading ? 'Saving…' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Territory Detail Modal ────────────────────────────────────────── */}
      {viewingTerritory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{viewingTerritory.name}</h3>
            <div className="detail-grid">
              <div className="detail-row">
                <span className="detail-label">Region</span>
                <span className="detail-value">{viewingTerritory.region}</span>
              </div>
              {viewingTerritory.description && (
                <div className="detail-row">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{viewingTerritory.description}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Coverage Target</span>
                <span className="detail-value">{viewingTerritory.coverageTarget ?? 0}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Representatives</span>
                <span className="detail-value">{viewingTerritory.repCount ?? 0}</span>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.95rem' }}>Assigned Medical Representatives</div>
              {(viewingTerritory.assignedReps?.length ?? 0) > 0 ? (
                <div className="list-grid">
                  {viewingTerritory.assignedReps!.map((rep) => (
                    <div className="data-card" key={rep.id} style={{ padding: '10px 14px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{rep.fullName || '—'}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{rep.email}</div>
                      </div>
                      <span className="chip">MR</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No representatives assigned yet.</div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setViewingTerritory(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Territory Modal ──────────────────────────────────────────── */}
      {editingTerritory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Territory</h3>
            <form onSubmit={handleEditSubmit} className="form-grid" style={{ marginTop: 14 }}>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Territory name *" required />
              <input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} placeholder="Region *" required />
              <input
                value={editCoverageTarget}
                onChange={(e) => setEditCoverageTarget(e.target.value)}
                placeholder="Coverage Target (%)"
                type="number" min="0" max="100"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                style={{ minHeight: 80 }}
              />
              <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="btn-ghost" onClick={() => setEditingTerritory(null)}>Cancel</button>
                <button type="submit">Update Territory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-dialog">
            <h3>Delete Territory</h3>
            <p>This will permanently delete the territory and remove all MR assignments. This action cannot be undone.</p>
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
