import { useEffect, useState } from 'react';
import type { Notification, NotificationTemplate, Territory } from '../types';

type Tab = 'history' | 'templates' | 'announce';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  sent:    { bg: 'rgba(6,118,71,0.1)',   color: '#067647' },
  failed:  { bg: 'rgba(180,35,24,0.1)',  color: '#b42318' },
  queued:  { bg: 'rgba(15,118,110,0.1)', color: '#0f766e' }
};

const CHANNEL_LABELS: Record<string, string> = {
  email: '✉ Email',
  sms:   '📱 SMS',
  push:  '🔔 Push'
};

export default function NotificationsPage() {
  const role = localStorage.getItem('role') || '';
  const isAdmin = role === 'admin';
  const canManage = ['admin', 'manager'].includes(role);

  const [tab, setTab] = useState<Tab>('history');

  // ── History ───────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyChannel, setHistoryChannel] = useState('');
  const [viewingNotif, setViewingNotif] = useState<Notification | null>(null);

  // ── Templates ─────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [tplName, setTplName] = useState('');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState('');
  const [tplVariables, setTplVariables] = useState('');
  const [editingTpl, setEditingTpl] = useState<NotificationTemplate | null>(null);
  const [tplError, setTplError] = useState('');

  // ── Announce ──────────────────────────────────────────────────────────────
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annRecipientType, setAnnRecipientType] = useState<'all_reps' | 'all_managers' | 'territory' | 'specific'>('all_reps');
  const [annTerritoryId, setAnnTerritoryId] = useState('');
  const [annError, setAnnError] = useState('');
  const [annSuccess, setAnnSuccess] = useState('');
  const [annLoading, setAnnLoading] = useState(false);

  const loadNotifications = async () => {
    const params = new URLSearchParams();
    if (historySearch) params.set('search', historySearch);
    if (historyStatus) params.set('status', historyStatus);
    if (historyChannel) params.set('channel', historyChannel);
    const res = await fetch(`/api/notifications?${params}`);
    if (res.ok) setNotifications(await res.json());
  };

  const loadTemplates = async () => {
    const res = await fetch('/api/notifications/templates');
    if (res.ok) setTemplates(await res.json());
  };

  const loadTerritories = async () => {
    const res = await fetch('/api/territories');
    if (res.ok) setTerritories(await res.json());
  };

  useEffect(() => {
    loadNotifications();
    loadTemplates();
    if (canManage) loadTerritories();
  }, []);

  // ── History Handlers ──────────────────────────────────────────────────────
  const handleDeleteNotif = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    loadNotifications();
  };

  // ── Template Handlers ─────────────────────────────────────────────────────
  const resetTplForm = () => {
    setTplName(''); setTplSubject(''); setTplBody(''); setTplVariables('');
    setEditingTpl(null); setTplError('');
  };

  const openEditTpl = (t: NotificationTemplate) => {
    setEditingTpl(t);
    setTplName(t.name); setTplSubject(t.subject);
    setTplBody(t.body); setTplVariables(t.variables || '');
    setTplError('');
  };

  const handleTplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTplError('');
    const body = JSON.stringify({ name: tplName, subject: tplSubject, body: tplBody, variables: tplVariables || null });
    const headers = { 'Content-Type': 'application/json' };

    const res = editingTpl
      ? await fetch(`/api/notifications/templates/${editingTpl.id}`, { method: 'PUT', headers, body })
      : await fetch('/api/notifications/templates', { method: 'POST', headers, body });

    if (!res.ok) {
      const d = await res.json();
      setTplError(d.message || 'Failed to save template');
      return;
    }
    resetTplForm();
    loadTemplates();
  };

  const handleDeleteTpl = async (id: number) => {
    await fetch(`/api/notifications/templates/${id}`, { method: 'DELETE' });
    loadTemplates();
  };

  // ── Announce Handler ──────────────────────────────────────────────────────
  const handleAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError(''); setAnnSuccess('');
    setAnnLoading(true);
    const res = await fetch('/api/notifications/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: annTitle,
        message: annMessage,
        recipientType: annRecipientType,
        territoryId: annRecipientType === 'territory' ? Number(annTerritoryId) : undefined
      })
    });
    setAnnLoading(false);
    const d = await res.json();
    if (!res.ok) {
      setAnnError(d.message || 'Failed to send announcement');
      return;
    }
    setAnnSuccess(d.message || 'Announcement sent.');
    setAnnTitle(''); setAnnMessage('');
    loadNotifications();
    setTimeout(() => setAnnSuccess(''), 5000);
  };

  // ── Render Tabs ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">N</div>
          <h2 className="page-title">Notifications</h2>
        </div>
        <span className="chip">Communication centre</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 18 }}>
        View system notification history, manage reusable templates, and send targeted announcements.
      </p>

      {/* Tab Bar — Templates only for admin */}
      <div className="stacked-actions" style={{ marginBottom: 20 }}>
        {(['history', ...(isAdmin ? ['templates'] : []), 'announce'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? '' : 'secondary'}
            onClick={() => setTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'history' ? '📋 History' : t === 'templates' ? '📄 Templates' : '📢 Team Announcement'}
          </button>
        ))}
      </div>

      {/* ── TAB: HISTORY ─────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <section className="panel">
          {/* Filters */}
          <div className="page-toolbar" style={{ marginBottom: 16 }}>
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Notification History</h3>
            <div className="stacked-actions">
              <input
                style={{ width: 180 }}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search…"
                onKeyDown={(e) => e.key === 'Enter' && loadNotifications()}
              />
              <select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)} style={{ width: 'auto', padding: '0.5rem 0.8rem' }}>
                <option value="">All Statuses</option>
                <option value="queued">Queued</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
              <select value={historyChannel} onChange={(e) => setHistoryChannel(e.target.value)} style={{ width: 'auto', padding: '0.5rem 0.8rem' }}>
                <option value="">All Channels</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
              </select>
              <button type="button" className="btn-ghost" onClick={loadNotifications}>Search</button>
            </div>
          </div>

          {/* Table */}
          {notifications.length > 0 ? (
            <div className="table-shell">
              <div
                className="table-header"
                style={{ gridTemplateColumns: 'minmax(0,2.5fr) minmax(180px,1.2fr) 100px 120px auto' }}
              >
                <div>Subject · Recipient</div>
                <div>Date &amp; Time</div>
                <div>Method</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {notifications.map((n) => {
                const colors = STATUS_COLORS[n.status] ?? STATUS_COLORS.queued;
                return (
                  <div
                    className="table-row"
                    key={n.id}
                    style={{ gridTemplateColumns: 'minmax(0,2.5fr) minmax(180px,1.2fr) 100px 120px auto' }}
                  >
                    <div>
                      <h4>{n.subject}</h4>
                      <p>{n.recipient}</p>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}
                    </div>
                    <div style={{ fontSize: '0.88rem' }}>{CHANNEL_LABELS[n.channel] ?? n.channel}</div>
                    <div>
                      <span className="chip" style={colors}>{n.status}</span>
                    </div>
                    <div className="table-actions">
                      <button type="button" className="btn-ghost" onClick={() => setViewingNotif(n)}>View</button>
                      {canManage && (
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ color: '#b42318' }}
                          onClick={() => handleDeleteNotif(n.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No notifications found. Try adjusting your filters.</div>
          )}
        </section>
      )}

      {/* ── TAB: TEMPLATES ───────────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="panel-grid">
          {/* Create / Edit Form */}
          {isAdmin && (
            <section className="panel">
              <h3 className="page-title" style={{ fontSize: '1.1rem' }}>
                {editingTpl ? 'Edit Template' : 'New Template'}
              </h3>
              <p className="page-subtitle" style={{ marginTop: 4, marginBottom: 14, fontSize: '0.88rem' }}>
                Create reusable templates for system notifications. Use {'{{variable}}'} placeholders.
              </p>
              <form onSubmit={handleTplSubmit} className="form-grid">
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                    Template Name *
                  </label>
                  <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Welcome Email" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                    Subject *
                  </label>
                  <input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} placeholder="e.g. Welcome to ITER Platform, {{name}}" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                    Message Body *
                  </label>
                  <textarea
                    value={tplBody}
                    onChange={(e) => setTplBody(e.target.value)}
                    placeholder="Dear {{name}}, Your OTP is {{otp}}. It expires in 15 minutes."
                    style={{ minHeight: 100 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                    Variables (comma-separated)
                  </label>
                  <input
                    value={tplVariables}
                    onChange={(e) => setTplVariables(e.target.value)}
                    placeholder="e.g. name, otp, orderId"
                  />
                </div>
                {tplError && (
                  <div style={{ color: '#b42318', fontWeight: 600, fontSize: '0.9rem' }}>{tplError}</div>
                )}
                <div className="stacked-actions" style={{ gridColumn: '1/-1' }}>
                  {editingTpl && (
                    <button type="button" className="btn-ghost" onClick={resetTplForm}>Cancel</button>
                  )}
                  <button type="submit" style={{ flex: 1 }}>
                    {editingTpl ? 'Update Template' : 'Save Template'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Templates List */}
          <section className="panel" style={{ gridColumn: isAdmin ? 'auto' : '1 / -1' }}>
            <div className="page-toolbar" style={{ marginBottom: 12 }}>
              <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Saved Templates</h3>
              <span className="chip">{templates.length}</span>
            </div>

            {templates.length > 0 ? (
              <div className="list-grid">
                {templates.map((t) => (
                  <div key={t.id} className="data-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px' }}>{t.name}</h4>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>{t.subject}</p>
                      </div>
                      {t.variables && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                          {t.variables.split(',').map((v) => (
                            <span
                              key={v}
                              style={{
                                padding: '2px 8px', borderRadius: 999, fontSize: '0.76rem',
                                background: 'rgba(15,118,110,0.08)', color: 'var(--accent-strong)', fontWeight: 600
                              }}
                            >
                              {`{{${v.trim()}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                      {t.body.length > 120 ? t.body.slice(0, 120) + '…' : t.body}
                    </p>
                    {isAdmin && (
                      <div className="table-actions" style={{ justifyContent: 'flex-start' }}>
                        <button type="button" className="btn-ghost" onClick={() => openEditTpl(t)}>Edit</button>
                        <button type="button" className="btn-ghost" style={{ color: '#b42318' }} onClick={() => handleDeleteTpl(t.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                No templates yet. {isAdmin ? 'Create your first template using the form.' : 'Contact an admin to add templates.'}
              </div>
            )}

            {/* Default system template hints */}
            {templates.length === 0 && isAdmin && (
              <div style={{ marginTop: 16 }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 10 }}>Suggested system templates:</p>
                <div className="list-grid">
                  {[
                    { name: 'Welcome Email', subject: 'Welcome to ITER Pharmaceuticals, {{name}}', vars: 'name' },
                    { name: 'Password Reset OTP', subject: 'Your Password Reset Code', vars: 'name, otp' },
                    { name: 'Order Confirmation', subject: 'Order #{{orderId}} Confirmed', vars: 'name, orderId, product' },
                    { name: 'Low Stock Alert', subject: 'Low Stock: {{medicine}} needs restocking', vars: 'medicine, stock' },
                    { name: 'Visit Reminder', subject: 'Reminder: Visit scheduled with Dr. {{doctor}}', vars: 'name, doctor, date' }
                  ].map((hint) => (
                    <button
                      key={hint.name}
                      type="button"
                      className="btn-ghost"
                      style={{ textAlign: 'left', borderRadius: 12, padding: '10px 14px' }}
                      onClick={() => {
                        setTplName(hint.name);
                        setTplSubject(hint.subject);
                        setTplBody(`Dear {{name}},\n\n[Add your message here]\n\n— ITER Pharmaceuticals`);
                        setTplVariables(hint.vars);
                        setEditingTpl(null);
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{hint.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{hint.subject}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── TAB: ANNOUNCEMENTS ───────────────────────────────────────────── */}
      {tab === 'announce' && canManage && (
        <div className="panel-grid">
          <section className="panel">
            <h3 className="page-title" style={{ fontSize: '1.1rem' }}>Send Announcement</h3>
            <p className="page-subtitle" style={{ marginTop: 4, marginBottom: 18, fontSize: '0.88rem' }}>
              Send a targeted announcement to a group of platform users. Emails will be delivered immediately.
            </p>

            <form onSubmit={handleAnnounce} className="form-grid">
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Title *
                </label>
                <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="e.g. Monthly Sales Meeting" required />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Recipients *
                </label>
                <select
                  value={annRecipientType}
                  onChange={(e) => setAnnRecipientType(e.target.value as any)}
                  style={{ marginBottom: 0 }}
                >
                  <option value="all_reps">All Medical Representatives</option>
                  <option value="all_managers">All Managers</option>
                  <option value="territory">Specific Territory</option>
                </select>
              </div>

              {annRecipientType === 'territory' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                    Territory *
                  </label>
                  <select value={annTerritoryId} onChange={(e) => setAnnTerritoryId(e.target.value)} required>
                    <option value="">Select Territory</option>
                    {territories.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.region} ({t.repCount ?? 0} MRs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--muted)' }}>
                  Message *
                </label>
                <textarea
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="e.g. Sales meeting on Monday at 10:00 AM in the main conference room."
                  style={{ minHeight: 120 }}
                  required
                />
              </div>

              {/* Preview Card */}
              {annTitle && annMessage && (
                <div style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(15,118,110,0.05)', border: '1px solid rgba(15,118,110,0.15)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>Preview</div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{annTitle}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>{annMessage}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-strong)', marginTop: 8, fontWeight: 600 }}>
                    Recipients: {annRecipientType === 'all_reps' ? 'All Medical Representatives' : annRecipientType === 'all_managers' ? 'All Managers' : 'Selected Territory'}
                  </div>
                </div>
              )}

              {annError && (
                <div style={{ color: '#b42318', fontWeight: 600, fontSize: '0.9rem' }}>{annError}</div>
              )}
              {annSuccess && (
                <div style={{ color: '#067647', fontWeight: 600, fontSize: '0.9rem' }}>{annSuccess}</div>
              )}

              <button type="submit" disabled={annLoading} style={{ gridColumn: '1 / -1' }}>
                {annLoading ? 'Sending…' : '📢 Send Announcement'}
              </button>
            </form>
          </section>

          {/* Recent announcements */}
          <section className="panel">
            <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 14 }}>Recent Announcements</h3>
            {notifications.filter((n) => n.channel === 'email' && n.status !== 'queued').length > 0 ? (
              <div className="list-grid">
                {notifications.slice(0, 8).map((n) => {
                  const colors = STATUS_COLORS[n.status] ?? STATUS_COLORS.queued;
                  return (
                    <div key={n.id} className="data-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{n.subject}</h4>
                        <span className="chip" style={colors}>{n.status}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{n.recipient}</p>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.78rem' }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">No announcements sent yet. Use the form to send your first announcement.</div>
            )}
          </section>
        </div>
      )}

      {/* Non-manager rep sees read-only note */}
      {tab === 'announce' && !canManage && (
        <div className="panel">
          <div className="empty-state" style={{ textAlign: 'center', padding: 32 }}>
            Only Managers and Admins can send announcements.
          </div>
        </div>
      )}

      {/* ── Notification Detail Modal ─────────────────────────────────────── */}
      {viewingNotif && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{viewingNotif.subject}</h3>
            <div className="detail-grid">
              <div className="detail-row">
                <span className="detail-label">Recipient</span>
                <span className="detail-value">{viewingNotif.recipient}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Channel</span>
                <span className="detail-value">{CHANNEL_LABELS[viewingNotif.channel] ?? viewingNotif.channel}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className="chip" style={STATUS_COLORS[viewingNotif.status]}>{viewingNotif.status}</span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date &amp; Time</span>
                <span className="detail-value">
                  {viewingNotif.createdAt ? new Date(viewingNotif.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>Message Body</div>
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(15,118,110,0.05)', border: '1px solid rgba(15,118,110,0.12)',
                fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap'
              }}>
                {viewingNotif.body}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setViewingNotif(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
