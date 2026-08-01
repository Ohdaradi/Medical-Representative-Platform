import { useState } from 'react';

export default function ProfilePage() {
  const fullName = localStorage.getItem('fullName') || '—';
  const email = localStorage.getItem('email') || '—';
  const role = localStorage.getItem('role') || '—';
  const userId = localStorage.getItem('userId') || '—';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'New passwords do not match.', ok: false });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ text: 'New password must be at least 8 characters.', ok: false });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ text: 'Password changed successfully!', ok: true });
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setPwMsg({ text: data.message || 'Failed to change password.', ok: false });
      }
    } catch {
      setPwMsg({ text: 'Network error. Please try again.', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (r: string) => {
    if (r === 'rep') return 'Medical Representative';
    if (r === 'manager') return 'Field Manager';
    if (r === 'admin') return 'System Administrator';
    return r;
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">P</div>
          <h2 className="page-title">My Profile</h2>
        </div>
        <span className="chip">Account settings</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>View your account details and update your credentials.</p>

      <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Profile Info Card */}
        <section className="panel">
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontSize: '1.6rem', fontWeight: 700, flexShrink: 0
            }}>
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{fullName}</h3>
              <div style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>{roleLabel(role)}</div>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">👤 Full Name</span>
              <span className="detail-value">{fullName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">🆔 Employee ID</span>
              <span className="detail-value">EMP-{String(userId).padStart(4, '0')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">📧 Email</span>
              <span className="detail-value">{email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">🏷️ Role</span>
              <span className="detail-value">{roleLabel(role)}</span>
            </div>
          </div>
        </section>

        {/* Change Password Card */}
        <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 18 }}>🔐 Change Password</h3>
          <form onSubmit={handleChangePassword} className="form-grid">
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current password"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            {pwMsg && (
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: pwMsg.ok ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                color: pwMsg.ok ? '#16a34a' : '#dc2626',
                fontSize: '0.88rem', fontWeight: 500
              }}>{pwMsg.text}</div>
            )}
            <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
