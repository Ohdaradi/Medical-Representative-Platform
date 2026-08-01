import { useState } from 'react';

const FAQS = [
  { q: 'How do I log a visit?', a: 'Go to Visits → Log Visit tab → Fill in the doctor and notes → Save. Then use Check-In (GPS) before your meeting and Check-Out after.' },
  { q: 'How does GPS check-in work?', a: 'When you click "Check In", the platform captures your current location. If the doctor has a registered clinic address, it verifies you are within range (geo-verification).' },
  { q: 'Why is my order showing "pending"?', a: 'Orders need to be approved by your manager or admin before they are processed. You will receive a notification once approved.' },
  { q: 'How do I issue a sample?', a: 'Go to Samples → Issue Sample tab → Select the doctor, medicine, and quantity → Submit. Sample history is available in the Sample History tab.' },
  { q: 'How do I change my password?', a: 'Go to Profile → Change Password section → Enter your current password and the new one, then click Update Password.' },
  { q: 'Who can see my visits?', a: 'Your manager and administrators can view all your field visits for compliance and quality review.' },
];

export default function HelpPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const email = localStorage.getItem('email') || 'unknown';
      const name = localStorage.getItem('fullName') || 'MR';
      await fetch('/api/notifications/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[Support Request] ${subject}`,
          body: `From: ${name} (${email})\n\n${message}`,
          group: 'admin'
        })
      });
      setSent(true);
      setSubject(''); setMessage('');
    } catch {
      window.alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <section className="page-toolbar">
        <div className="toolbar-title">
          <div className="section-icon">?</div>
          <h2 className="page-title">Help & Support</h2>
        </div>
        <span className="chip">Contact admin</span>
      </section>
      <p className="page-subtitle" style={{ marginBottom: 24 }}>Get answers to common questions or send a message directly to your administrator.</p>

      <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Contact Admin */}
        <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 16 }}>📬 Contact Admin</h3>
          {sent ? (
            <div style={{
              padding: '24px', borderRadius: 16, textAlign: 'center',
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>✅</div>
              <h4 style={{ margin: '0 0 8px', color: '#16a34a' }}>Message Sent!</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>Your administrator has been notified and will respond shortly.</p>
              <button type="button" onClick={() => setSent(false)} style={{ marginTop: 16, padding: '8px 20px' }}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="form-grid">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (e.g. Issue with order #123)"
                required
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                style={{ minHeight: 150 }}
                required
              />
              <button type="submit" disabled={sending}>{sending ? 'Sending...' : '📨 Send to Admin'}</button>
            </form>
          )}
        </section>

        {/* FAQ */}
        <section className="panel">
          <h3 className="page-title" style={{ fontSize: '1.1rem', marginBottom: 16 }}>❓ Frequently Asked Questions</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {FAQS.map((faq, idx) => (
              <div key={idx} style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
                background: 'var(--surface)'
              }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: 'transparent', color: 'var(--text)',
                    fontWeight: 600, fontSize: '0.9rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    margin: 0, boxShadow: 'none', borderRadius: 0
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--accent)', flexShrink: 0, marginLeft: 8 }}>{openFaq === idx ? '▲' : '▼'}</span>
                </button>
                {openFaq === idx && (
                  <div style={{
                    padding: '0 16px 14px',
                    fontSize: '0.88rem',
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                    borderTop: '1px solid var(--border)'
                  }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
