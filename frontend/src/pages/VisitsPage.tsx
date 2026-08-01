import { useEffect, useState } from 'react';
import type { Visit, Doctor, User } from '../types';

type ManagerTab = 'schedule' | 'requests' | 'monitor';
type RepTab = 'schedule' | 'request' | 'history';

// ────────────────────────────────────────────────────────────
// MR VIEW
// ────────────────────────────────────────────────────────────
function RepVisitsView() {
  const [tab, setTab] = useState<RepTab>('schedule');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'today' | 'week' | 'month'>('today');

  // Request Visit form
  const [doctorId, setDoctorId] = useState('');
  const [notes, setNotes] = useState('');

  // GPS state
  const [gpsLoading, setGpsLoading] = useState<number | null>(null);

  // In-progress visit inputs
  const [visitInputs, setVisitInputs] = useState<Record<number, { notes: string; feedback: string }>>({});
  const updateVisitInput = (id: number, field: 'notes' | 'feedback', val: string) => {
    setVisitInputs(prev => ({ ...prev, [id]: { ...(prev[id] || { notes: '', feedback: '' }), [field]: val } }));
  };

  const loadData = async () => {
    const dRes = await fetch('/api/doctors?showAll=true');
    if (dRes.ok) setDoctors(await dRes.json());
    loadVisits();
  };

  const loadVisits = async () => {
    let period = 'daily';
    if (tab === 'history') {
      period = historyFilter === 'today' ? 'daily' : historyFilter === 'week' ? 'weekly' : 'monthly';
    }
    const res = await fetch(`/api/visits?period=${period}`);
    if (res.ok) setVisits(await res.json());
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadVisits(); }, [tab, historyFilter]);

  const handleRequestSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, notes })
    });
    setDoctorId(''); setNotes('');
    alert('Visit requested successfully. Waiting for manager approval.');
    setTab('history');
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('Are you sure you want to delete this visit request?')) return;
    await fetch(`/api/visits/${id}`, { method: 'DELETE' });
    loadVisits();
  };

  const handleCheckIn = async (id: number) => {
    setGpsLoading(id);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetch(`/api/visits/${id}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        });
        setGpsLoading(null);
        loadVisits();
      },
      (err) => {
        console.error(err);
        setGpsLoading(null);
        alert('Failed to get location.');
      }
    );
  };

  const handleCheckOut = async (id: number) => {
    const inputs = visitInputs[id] || { notes: '', feedback: '' };
    if (inputs.notes || inputs.feedback) {
      await fetch(`/api/visits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: inputs.notes, doctorFeedback: inputs.feedback })
      });
    }

    setGpsLoading(id);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetch(`/api/visits/${id}/check-out`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        });
        setGpsLoading(null);
        loadVisits();
      },
      (err) => {
        console.error(err);
        setGpsLoading(null);
        alert('Failed to get location.');
      }
    );
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">V</div>
          <h2 className="page-title">Visits</h2>
        </div>
        <span className="chip">Field workflow</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 18 }}>
        Execute your daily schedule, capture GPS check-ins, and request ad-hoc visits.
      </p>

      <div className="stacked-actions" style={{ marginBottom: 20 }}>
        {(['schedule', 'request', 'history'] as RepTab[]).map((t) => (
          <button key={t} type="button" className={tab === t ? '' : 'secondary'} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t === 'schedule' ? '📅 My Schedule' : t === 'request' ? '📝 Request Visit' : '📋 Visit History'}
          </button>
        ))}
      </div>

      {tab === 'schedule' && (
        <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Today's Planned Visits</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            {visits.filter(v => v.status === 'planned' || v.status === 'in_progress').map(visit => (
              <div key={visit.id} className="data-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>{visit.doctor?.name || 'Unknown Doctor'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
                      {visit.doctor?.specialty} · {visit.doctor?.hospital}
                    </div>
                    {visit.scheduledTime && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, display: 'inline-block', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 4 }}>
                        Scheduled: {formatTime(visit.scheduledTime)}
                      </div>
                    )}
                    {visit.notes && <div style={{ fontSize: '0.85rem', marginTop: 8, fontStyle: 'italic' }}>Instructions: {visit.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: visit.status === 'in_progress' ? 'var(--accent)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {visit.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                    </div>
                    {visit.status === 'planned' && (
                      <button type="button" onClick={() => handleCheckIn(visit.id)} disabled={gpsLoading === visit.id}>
                        {gpsLoading === visit.id ? 'Checking in...' : 'Check In'}
                      </button>
                    )}
                  </div>
                </div>

                {visit.status === 'in_progress' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Visit Notes</label>
                    <textarea 
                      value={visitInputs[visit.id]?.notes || ''} 
                      onChange={e => updateVisitInput(visit.id, 'notes', e.target.value)}
                      placeholder="Enter discussion points, product details..."
                      rows={2}
                      style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                    
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>Doctor Feedback</label>
                    <textarea 
                      value={visitInputs[visit.id]?.feedback || ''} 
                      onChange={e => updateVisitInput(visit.id, 'feedback', e.target.value)}
                      placeholder="Doctor's response, requests, or general feedback..."
                      rows={2}
                      style={{ width: '100%', marginBottom: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                    
                    <button type="button" className="btn-danger" onClick={() => handleCheckOut(visit.id)} disabled={gpsLoading === visit.id} style={{ width: '100%' }}>
                      {gpsLoading === visit.id ? 'Saving & Checking out...' : 'Save Notes & Check Out'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {visits.filter(v => v.status === 'planned' || v.status === 'in_progress').length === 0 && (
              <div className="empty-state">No planned visits remaining today.</div>
            )}
          </div>
        </section>
      )}

      {tab === 'request' && (
        <section className="panel" style={{ maxWidth: 600 }}>
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Request Visit Approval</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 20 }}>
            If a doctor requests a visit that isn't on your schedule, submit a request here for manager approval.
          </p>
          <form onSubmit={handleRequestSubmit} className="form-grid">
            <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required>
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
            </select>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for request (optional)" rows={3} />
            <button type="submit">Submit Request</button>
          </form>
        </section>
      )}

      {tab === 'history' && (
        <section className="panel">
          <div className="page-toolbar" style={{ marginBottom: 16 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Visit History</h3>
            <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value as any)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          {visits.length === 0 ? (
            <div className="empty-state">No visits found.</div>
          ) : (
            <div className="table-shell">
              <div className="table-header"><div>Doctor</div><div>Status</div><div>Timeline</div><div>Actions</div></div>
              {visits.map(visit => (
                <div className="table-row" key={visit.id}>
                  <div>
                    <h4>{visit.doctor?.name}</h4>
                    <p>{visit.notes || 'No notes'}</p>
                  </div>
                  <div>
                    <span className="chip" style={{ 
                      background: visit.status === 'pending_approval' ? '#fef3c7' : visit.status === 'rejected' ? '#fee2e2' : visit.status === 'completed' ? '#dcfce7' : 'var(--accent-soft)',
                      color: visit.status === 'pending_approval' ? '#b45309' : visit.status === 'rejected' ? '#b91c1c' : visit.status === 'completed' ? '#15803d' : 'var(--accent)'
                    }}>
                      {visit.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {visit.visitDate && new Date(visit.visitDate).toLocaleDateString()}<br/>
                    {visit.checkInAt && `In: ${formatTime(visit.checkInAt)} `}
                    {visit.checkOutAt && `Out: ${formatTime(visit.checkOutAt)}`}
                  </div>
                  <div className="table-actions">
                    {visit.status === 'pending_approval' && !visit.isManagerScheduled && (
                      <button type="button" className="btn-ghost" style={{ color: 'var(--warm)' }} onClick={() => handleDeleteRequest(visit.id)}>Cancel Request</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MANAGER VIEW
// ────────────────────────────────────────────────────────────
function ManagerVisitsView() {
  const [tab, setTab] = useState<ManagerTab>('schedule');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [reps, setReps] = useState<User[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [requests, setRequests] = useState<Visit[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'today' | 'week' | 'month'>('today');
  const [expandedVisitId, setExpandedVisitId] = useState<number | null>(null);

  // Schedule Visit form
  const [repId, setRepId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    const [dRes, uRes] = await Promise.all([
      fetch('/api/doctors?showAll=true'),
      fetch('/api/users')
    ]);
    if (dRes.ok) setDoctors(await dRes.json());
    if (uRes.ok) setReps((await uRes.json()).filter((u: User) => u.role === 'rep'));
  };

  const loadVisits = async () => {
    const filterMap: Record<string, string> = { today: 'daily', week: 'weekly', month: 'monthly' };
    const [visitsRes, reqsRes] = await Promise.all([
      fetch(`/api/visits?period=${filterMap[historyFilter]}`),
      fetch('/api/visits?status=pending_approval')
    ]);
    if (visitsRes.ok) setVisits(await visitsRes.json());
    if (reqsRes.ok) setRequests(await reqsRes.json());
  };

  useEffect(() => { loadData(); loadVisits(); }, []);
  useEffect(() => { loadVisits(); }, [historyFilter]);

  const handleScheduleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, repId, scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : null, notes })
    });
    setDoctorId(''); setNotes(''); setScheduledTime('');
    alert('Visit scheduled successfully.');
    loadVisits();
  };

  const handleApprove = async (id: number) => {
    await fetch(`/api/visits/${id}/approve`, { method: 'POST' });
    loadVisits();
  };

  const handleReject = async (id: number) => {
    await fetch(`/api/visits/${id}/reject`, { method: 'POST' });
    loadVisits();
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">V</div>
          <h2 className="page-title">Visit Management</h2>
        </div>
        <span className="chip">Scheduling</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 18 }}>
        Plan field schedules, review MR visit requests, and monitor check-ins.
      </p>

      <div className="stacked-actions" style={{ marginBottom: 20 }}>
        {(['schedule', 'requests', 'monitor'] as ManagerTab[]).map((t) => (
          <button key={t} type="button" className={tab === t ? '' : 'secondary'} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t === 'schedule' ? '📅 Schedule Visit' : t === 'requests' ? `⏳ Pending Requests (${requests.length})` : '👁 Visit Monitoring'}
          </button>
        ))}
      </div>

      {tab === 'schedule' && (
        <section className="panel" style={{ maxWidth: 700 }}>
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Create Visit Schedule</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 20 }}>
            Assign a specific visit to a Medical Representative. This will appear on their daily schedule.
          </p>
          <form onSubmit={handleScheduleSubmit} className="form-grid">
            <select value={repId} onChange={e => setRepId(e.target.value)} required>
              <option value="">Select Medical Representative</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.fullName || r.email}</option>)}
            </select>
            <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required>
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
            </select>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>Scheduled Date & Time</label>
              <input type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} required />
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions or agenda for MR" rows={3} style={{ gridColumn: '1 / -1' }} />
            <button type="submit" style={{ gridColumn: '1 / -1' }}>Schedule Visit</button>
          </form>
        </section>
      )}

      {tab === 'requests' && (
        <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Ad-Hoc Visit Requests</h3>
          {requests.length === 0 ? (
            <div className="empty-state">No pending requests from MRs.</div>
          ) : (
            <div className="table-shell">
              <div className="table-header"><div>MR</div><div>Doctor</div><div>Notes</div><div>Actions</div></div>
              {requests.map(req => (
                <div className="table-row" key={req.id}>
                  <div><h4>{req.rep?.fullName || req.rep?.email}</h4><p>Requested on {new Date(req.createdAt).toLocaleDateString()}</p></div>
                  <div>{req.doctor?.name}</div>
                  <div><p>{req.notes || 'No reason provided'}</p></div>
                  <div className="table-actions">
                    <button type="button" className="btn-ghost" style={{ color: '#16a34a' }} onClick={() => handleApprove(req.id)}>Approve</button>
                    <button type="button" className="btn-ghost" style={{ color: 'var(--warm)' }} onClick={() => handleReject(req.id)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'monitor' && (
        <section className="panel">
          <div className="page-toolbar" style={{ marginBottom: 18 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Visit Sessions</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value as any)} style={{ width: 'auto', padding: '7px 32px 7px 12px' }}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {visits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No visits found</div>
              <div className="empty-state-desc">No sessions have been recorded for the selected period.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {visits.map(visit => {
                const isExpanded = expandedVisitId === visit.id;
                const statusColors: Record<string, { bg: string; color: string }> = {
                  planned:          { bg: 'var(--accent-soft)',         color: 'var(--accent)'   },
                  in_progress:      { bg: 'rgba(99,102,241,0.1)',       color: '#4338ca'          },
                  completed:        { bg: 'var(--success-bg)',          color: 'var(--success)'   },
                  pending_approval: { bg: 'var(--warning-bg)',          color: 'var(--warning)'   },
                  rejected:         { bg: 'var(--danger-bg)',           color: 'var(--danger)'    },
                };
                const sc = statusColors[visit.status || ''] || statusColors.planned;

                return (
                  <div key={visit.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}>
                    {/* Summary Row */}
                    <div
                      onClick={() => setExpandedVisitId(isExpanded ? null : visit.id)}
                      style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer', transition: 'background var(--transition)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Doctor & MR */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                          {(visit.doctor?.name || 'D').charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{visit.doctor?.name || 'Unknown Doctor'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {visit.doctor?.specialty && `${visit.doctor.specialty} · `}
                            MR: <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{visit.rep?.fullName || visit.rep?.email || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '11.5px', fontWeight: 700, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                        {(visit.status || 'planned').replace(/_/g, ' ')}
                      </span>

                      {/* Time info */}
                      <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {visit.checkInAt ? formatTime(visit.checkInAt) : (visit.scheduledTime ? `Sched: ${formatTime(visit.scheduledTime)}` : '—')}
                        {visit.durationMinutes && (
                          <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 1 }}>{visit.durationMinutes}m</div>
                        )}
                      </div>

                      {/* Expand toggle */}
                      <div style={{ fontSize: '14px', color: 'var(--muted)', padding: '4px 6px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
                    </div>

                    {/* Expanded Session Details */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)', padding: '20px 22px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>

                          {/* Session Timeline */}
                          <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 12 }}>⏱ Session Timeline</div>
                            <div style={{ display: 'grid', gap: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Scheduled</span>
                                <span style={{ fontWeight: 600, fontSize: '12.5px' }}>{visit.scheduledTime ? new Date(visit.scheduledTime).toLocaleString() : '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Check-in</span>
                                <span style={{ fontWeight: 600, fontSize: '12.5px', color: visit.checkInAt ? 'var(--success)' : 'var(--muted)' }}>
                                  {visit.checkInAt ? new Date(visit.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not checked in'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Check-out</span>
                                <span style={{ fontWeight: 600, fontSize: '12.5px', color: visit.checkOutAt ? 'var(--danger)' : 'var(--muted)' }}>
                                  {visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not checked out'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Duration</span>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: visit.durationMinutes ? 'var(--accent)' : 'var(--muted)' }}>
                                  {visit.durationMinutes ? `${visit.durationMinutes} min` : '—'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* GPS & Geo Verification */}
                          <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 12 }}>
                              📍 GPS & Location
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 700, background: visit.geoVerified ? 'var(--success-bg)' : 'var(--warning-bg)', color: visit.geoVerified ? 'var(--success)' : 'var(--warning)' }}>
                                {visit.geoVerified ? '✓ Geo-Verified' : '⚠ Not Geo-Verified'}
                              </div>
                            </div>
                            <div style={{ display: 'grid', gap: 6 }}>
                              {visit.checkInLat != null && (
                                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                  Check-in: <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{visit.checkInLat.toFixed(5)}, {visit.checkInLng?.toFixed(5)}</span>
                                </div>
                              )}
                              {visit.checkOutLat != null && (
                                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                  Check-out: <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{visit.checkOutLat.toFixed(5)}, {visit.checkOutLng?.toFixed(5)}</span>
                                </div>
                              )}
                              {visit.checkInLat == null && <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>No GPS data recorded</div>}
                            </div>
                          </div>

                          {/* Visit Notes & Products */}
                          <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', gridColumn: 'span 1' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 12 }}>📝 Visit Notes</div>
                            <p style={{ fontSize: '13px', color: visit.notes ? 'var(--text)' : 'var(--muted)', lineHeight: 1.6 }}>
                              {visit.notes || 'No notes recorded.'}
                            </p>
                            {visit.productsDiscussed && (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 6 }}>💊 Products Discussed</div>
                                <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{visit.productsDiscussed}</p>
                              </div>
                            )}
                          </div>

                          {/* Doctor Feedback */}
                          <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 12 }}>💬 Doctor Feedback</div>
                            <p style={{ fontSize: '13px', color: visit.doctorFeedback ? 'var(--text)' : 'var(--muted)', lineHeight: 1.6 }}>
                              {visit.doctorFeedback || 'No feedback recorded.'}
                            </p>
                            {visit.outcome && (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 6 }}>Outcome</div>
                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 600, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                                  {visit.outcome}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Consent & Meta */}
                          <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 12 }}>🔏 Consent & Metadata</div>
                            <div style={{ display: 'grid', gap: 7 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Consent</span>
                                <span style={{ fontWeight: 600, fontSize: '12.5px' }}>{visit.consentVersion || '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Visit Date</span>
                                <span style={{ fontWeight: 600, fontSize: '12.5px' }}>{visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Source</span>
                                <span style={{ fontWeight: 600, fontSize: '12.5px', color: visit.isManagerScheduled ? 'var(--accent)' : 'var(--muted)' }}>
                                  {visit.isManagerScheduled ? 'Manager Assigned' : 'MR Initiated'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Doctor Hospital</span>
                                <span style={{ fontWeight: 600, fontSize: '12.5px' }}>{visit.doctor?.hospital || '—'}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

    </div>
  );
}

export default function VisitsPage() {
  const role = localStorage.getItem('role') || 'rep';
  if (role === 'rep') return <RepVisitsView />;
  return <ManagerVisitsView />;
}
