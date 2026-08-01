import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ============================================================
   ITER Pharmaceuticals · Premium Login Page
   Enterprise SaaS · Pharma CRM
   ============================================================ */

const CSS = `
  @keyframes kf-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33%  { transform: translate(20px,-14px) scale(1.04); }
    66%  { transform: translate(-14px,10px) scale(0.97); }
  }
  @keyframes kf-drift2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%  { transform: translate(-18px,12px) scale(1.03); }
    66%  { transform: translate(16px,-10px) scale(0.98); }
  }
  @keyframes kf-float {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-12px); }
  }
  @keyframes kf-fadein-up {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes kf-fadein-right {
    from { opacity:0; transform:translateX(18px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes kf-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
    50%      { box-shadow: 0 0 0 8px rgba(20,184,166,0); }
  }
  @keyframes kf-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes kf-shimmer {
    0%   { background-position: -300px 0; }
    100% { background-position: 300px 0; }
  }

  .lp-hero   { animation: kf-fadein-up    0.7s cubic-bezier(.16,1,.3,1) 0.05s both; }
  .lp-card   { animation: kf-fadein-right 0.65s cubic-bezier(.16,1,.3,1) 0.15s both; }
  .lp-float  { animation: kf-float 7s ease-in-out infinite; }
  .lp-drift  { animation: kf-drift  16s ease-in-out infinite; }
  .lp-drift2 { animation: kf-drift2 20s ease-in-out infinite; }

  /* Tab control */
  .lp-tab {
    flex:1; padding:9px 6px; border:none; border-radius:8px;
    font-size:12.5px; font-weight:600; cursor:pointer;
    background:transparent; color:rgba(255,255,255,.4);
    transition:all .2s ease; box-shadow:none; white-space:nowrap;
  }
  .lp-tab:hover { color:rgba(255,255,255,.8); background:rgba(255,255,255,.06); transform:none; }
  .lp-tab.on {
    background:linear-gradient(135deg,rgba(13,148,136,.28),rgba(20,184,166,.18));
    color:#5eead4; box-shadow:0 0 0 1px rgba(20,184,166,.28),inset 0 1px 0 rgba(255,255,255,.07);
  }

  /* Input */
  .lp-field { position:relative; }
  .lp-field .ico {
    position:absolute; left:13px; top:50%; transform:translateY(-50%);
    width:16px; height:16px; opacity:.4; pointer-events:none; display:flex; align-items:center; justify-content:center;
  }
  .lp-field input, .lp-field select {
    width:100%; padding:12px 13px 12px 40px;
    background:rgba(255,255,255,.04);
    border:1.5px solid rgba(255,255,255,.1);
    border-radius:11px; color:#e2e8f0; font-size:13.5px;
    font-family:inherit; outline:none;
    transition:border-color .2s, box-shadow .2s, background .2s;
    -webkit-appearance:none;
  }
  .lp-field input::placeholder { color:rgba(255,255,255,.28); }
  .lp-field input:hover,  .lp-field select:hover  { border-color:rgba(255,255,255,.18); }
  .lp-field input:focus,  .lp-field select:focus  {
    border-color:rgba(20,184,166,.7);
    box-shadow:0 0 0 3px rgba(20,184,166,.13), 0 2px 8px rgba(0,0,0,.2);
    background:rgba(20,184,166,.05);
  }
  .lp-field select { color:rgba(255,255,255,.65); cursor:pointer; }
  .lp-field select option { background:#0d1f35; color:#e2e8f0; }
  .lp-eye {
    position:absolute; right:12px; top:50%; transform:translateY(-50%);
    background:none; border:none; padding:5px; cursor:pointer;
    color:rgba(255,255,255,.35); font-size:14px; line-height:1; box-shadow:none;
    transition:color .15s;
  }
  .lp-eye:hover { color:rgba(255,255,255,.75); background:none; box-shadow:none; transform:translateY(-50%); }

  /* Buttons */
  .btn-primary {
    width:100%; padding:13px; border:none; border-radius:11px;
    background:linear-gradient(135deg,#0d9488,#14b8a6 55%,#0d9488);
    background-size:200% 100%;
    color:#fff; font-size:14px; font-weight:700; font-family:inherit;
    cursor:pointer; letter-spacing:.02em;
    box-shadow:0 4px 20px rgba(13,148,136,.38), inset 0 1px 0 rgba(255,255,255,.12);
    transition:background-position .4s, box-shadow .2s, transform .15s;
  }
  .btn-primary:hover {
    background-position:right center;
    box-shadow:0 8px 28px rgba(13,148,136,.52), inset 0 1px 0 rgba(255,255,255,.12);
    transform:translateY(-1px);
  }
  .btn-primary:active  { transform:translateY(0); }
  .btn-primary:disabled{ opacity:.55; cursor:not-allowed; transform:none; }

  .btn-ghost {
    width:100%; padding:12px; border-radius:11px;
    background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.1);
    color:rgba(255,255,255,.65); font-size:13.5px; font-weight:600; font-family:inherit;
    cursor:pointer; box-shadow:none; transition:all .2s;
  }
  .btn-ghost:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.2); color:#fff; transform:translateY(-1px); box-shadow:none; }

  /* Feature card hover */
  .feat-card {
    display:flex; align-items:center; gap:13px;
    padding:12px 15px; border-radius:12px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    backdrop-filter:blur(8px);
    transition:background .2s, border-color .2s, transform .2s, box-shadow .2s;
    cursor:default;
  }
  .feat-card:hover {
    background:rgba(20,184,166,.07); border-color:rgba(20,184,166,.22);
    transform:translateX(5px); box-shadow:0 4px 16px rgba(13,148,136,.12);
  }

  /* Stat card */
  .stat-card {
    display:flex; flex-direction:column; align-items:center;
    padding:14px 8px; border-radius:13px; text-align:center;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    backdrop-filter:blur(8px);
    transition:background .2s, border-color .2s, transform .2s;
    animation: kf-fadein-up 0.6s both;
  }
  .stat-card:hover {
    background:rgba(20,184,166,.08); border-color:rgba(20,184,166,.2);
    transform:translateY(-3px);
  }

  /* Trust badge */
  .trust-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; border-radius:999px;
    font-size:11px; font-weight:600; border:1px solid;
    transition: opacity .2s;
  }
  .trust-badge:hover { opacity:.8; }

  /* Alerts */
  .lp-err { display:flex; align-items:flex-start; gap:8px; padding:10px 13px; border-radius:10px; background:rgba(220,38,38,.1); border:1px solid rgba(220,38,38,.22); color:#fca5a5; font-size:13px; line-height:1.45; }
  .lp-suc { display:flex; align-items:flex-start; gap:8px; padding:10px 13px; border-radius:10px; background:rgba(22,163,74,.1);  border:1px solid rgba(22,163,74,.22);  color:#86efac; font-size:13px; line-height:1.45; }

  /* Divider */
  .lp-hr { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent); margin:16px 0; }

  /* Scrollbar hidden */
  .no-scroll::-webkit-scrollbar { display:none; }
  .no-scroll { scrollbar-width:none; -ms-overflow-style:none; }

  @media (max-width:900px) {
    .lp-left  { display:none !important; }
    .lp-right { flex:1 !important; max-width:100% !important; }
  }
  @media (max-width:480px) {
    .lp-right { padding:16px !important; }
    .glass-card { padding:22px !important; border-radius:16px !important; }
  }
`;

/* ── SVG Icons ─────────────────────────────────────────────── */
const I = {
  mail: <svg style={{width:16,height:16}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  lock: <svg style={{width:16,height:16}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  user: <svg style={{width:16,height:16}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  role: <svg style={{width:16,height:16}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  hash: <svg style={{width:16,height:16}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
};

/* ── Illustration ───────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <div className="lp-float" style={{width:'100%', maxWidth:300}}>
      <svg viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%'}}>
        {/* Glow */}
        <ellipse cx="150" cy="120" rx="110" ry="75" fill="rgba(13,148,136,0.06)"/>

        {/* Hospital */}
        <rect x="30" y="110" width="75" height="88" rx="3" fill="rgba(15,118,110,0.16)" stroke="rgba(20,184,166,0.35)" strokeWidth="1.5"/>
        <rect x="52" y="96" width="30" height="18" rx="2" fill="rgba(20,184,166,0.2)" stroke="rgba(20,184,166,0.45)" strokeWidth="1"/>
        <rect x="63" y="100" width="8" height="10" rx="1" fill="rgba(20,184,166,0.65)"/>
        <rect x="60" y="103" width="14" height="4" rx="1" fill="rgba(20,184,166,0.65)"/>
        <rect x="38" y="126" width="16" height="14" rx="2" fill="rgba(20,184,166,0.14)" stroke="rgba(20,184,166,0.25)" strokeWidth="1"/>
        <rect x="61" y="126" width="16" height="14" rx="2" fill="rgba(20,184,166,0.2)" stroke="rgba(20,184,166,0.3)" strokeWidth="1"/>
        <rect x="84" y="126" width="16" height="14" rx="2" fill="rgba(20,184,166,0.14)" stroke="rgba(20,184,166,0.25)" strokeWidth="1"/>
        <rect x="38" y="148" width="16" height="14" rx="2" fill="rgba(20,184,166,0.18)" stroke="rgba(20,184,166,0.28)" strokeWidth="1"/>
        <rect x="84" y="148" width="16" height="14" rx="2" fill="rgba(20,184,166,0.14)" stroke="rgba(20,184,166,0.25)" strokeWidth="1"/>
        <rect x="59" y="160" width="18" height="38" rx="2" fill="rgba(20,184,166,0.18)" stroke="rgba(20,184,166,0.35)" strokeWidth="1"/>

        {/* Doctor */}
        <circle cx="180" cy="110" r="14" fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.45)" strokeWidth="1.5"/>
        <circle cx="180" cy="107" r="7" fill="rgba(99,102,241,0.3)"/>
        <path d="M165 148 Q180 136 195 148 L197 198 H163Z" fill="rgba(99,102,241,0.14)" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5"/>
        <path d="M177 125 Q173 136 170 141 Q167 146 170 151 Q173 156 177 153" stroke="rgba(20,184,166,0.55)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="178" cy="154" r="4" fill="none" stroke="rgba(20,184,166,0.55)" strokeWidth="1.5"/>

        {/* MR with tablet */}
        <circle cx="238" cy="117" r="12" fill="rgba(13,148,136,0.2)" stroke="rgba(20,184,166,0.48)" strokeWidth="1.5"/>
        <circle cx="238" cy="114" r="6" fill="rgba(13,148,136,0.35)"/>
        <path d="M226 152 Q238 141 250 152 L252 198 H224Z" fill="rgba(13,148,136,0.14)" stroke="rgba(20,184,166,0.3)" strokeWidth="1.5"/>
        <rect x="228" y="157" width="20" height="26" rx="3" fill="rgba(255,255,255,0.05)" stroke="rgba(20,184,166,0.48)" strokeWidth="1.5"/>
        <rect x="231" y="161" width="14" height="9" rx="1" fill="rgba(20,184,166,0.22)"/>
        <line x1="231" y1="173" x2="245" y2="173" stroke="rgba(20,184,166,0.28)" strokeWidth="1"/>
        <line x1="231" y1="176" x2="241" y2="176" stroke="rgba(20,184,166,0.2)" strokeWidth="1"/>
        <line x1="231" y1="179" x2="243" y2="179" stroke="rgba(20,184,166,0.2)" strokeWidth="1"/>

        {/* Analytics panel */}
        <rect x="158" y="44" width="88" height="52" rx="8" fill="rgba(10,24,46,0.75)" stroke="rgba(20,184,166,0.22)" strokeWidth="1"/>
        <rect x="161" y="47" width="82" height="28" rx="5" fill="rgba(20,184,166,0.05)"/>
        <rect x="165" y="59" width="7" height="13" rx="2" fill="rgba(20,184,166,0.5)"/>
        <rect x="175" y="53" width="7" height="19" rx="2" fill="rgba(20,184,166,0.7)"/>
        <rect x="185" y="56" width="7" height="16" rx="2" fill="rgba(20,184,166,0.5)"/>
        <rect x="195" y="50" width="7" height="22" rx="2" fill="rgba(20,184,166,0.85)"/>
        <rect x="205" y="54" width="7" height="18" rx="2" fill="rgba(20,184,166,0.6)"/>
        <rect x="215" y="52" width="7" height="20" rx="2" fill="rgba(20,184,166,0.75)"/>
        <text x="164" y="86" fontSize="5.5" fill="rgba(255,255,255,0.45)" fontFamily="monospace">VISITS · 1.2k ↑14%</text>
        <text x="164" y="92" fontSize="5" fill="rgba(255,255,255,0.28)" fontFamily="monospace">Monthly Field Performance</text>

        {/* Molecule cluster */}
        <circle cx="35" cy="68" r="9" fill="rgba(13,148,136,0.14)" stroke="rgba(20,184,166,0.38)" strokeWidth="1"/>
        <circle cx="35" cy="68" r="4" fill="rgba(20,184,166,0.28)"/>
        <circle cx="20" cy="55" r="5" fill="rgba(13,148,136,0.1)" stroke="rgba(20,184,166,0.28)" strokeWidth="1"/>
        <circle cx="50" cy="55" r="5" fill="rgba(13,148,136,0.1)" stroke="rgba(20,184,166,0.28)" strokeWidth="1"/>
        <circle cx="20" cy="80" r="5" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.28)" strokeWidth="1"/>
        <line x1="26" y1="61" x2="30" y2="64" stroke="rgba(20,184,166,0.3)" strokeWidth="1"/>
        <line x1="44" y1="61" x2="40" y2="64" stroke="rgba(20,184,166,0.3)" strokeWidth="1"/>
        <line x1="24" y1="74" x2="30" y2="71" stroke="rgba(99,102,241,0.25)" strokeWidth="1"/>

        {/* Pill */}
        <rect x="20" y="142" width="46" height="18" rx="9" fill="rgba(13,148,136,0.18)" stroke="rgba(20,184,166,0.42)" strokeWidth="1.5"/>
        <line x1="43" y1="142" x2="43" y2="160" stroke="rgba(20,184,166,0.35)" strokeWidth="1"/>
        <text x="23" y="154" fontSize="6" fill="rgba(20,184,166,0.65)" fontFamily="monospace" fontWeight="700">Rx 500mg</text>

        {/* Heartbeat */}
        <path d="M20 185 L44 185 L54 166 L68 204 L82 166 L96 185 L275 185" stroke="rgba(20,184,166,0.42)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

        {/* Cross */}
        <rect x="275" y="76" width="7" height="22" rx="2" fill="rgba(20,184,166,0.38)"/>
        <rect x="269" y="82" width="19" height="7" rx="2" fill="rgba(20,184,166,0.38)"/>
      </svg>
    </div>
  );
}

/* ── Static data ────────────────────────────────────────────── */
const FEATURES = [
  {icon:'🏥', title:'Doctor Visit Tracking',   desc:'GPS check-ins, session notes & geo-verification'},
  {icon:'🗺️', title:'Territory Management',    desc:'Assign regions, track coverage & KPI targets'},
  {icon:'💊', title:'Sample Inventory',         desc:'Issue, track & audit pharmaceutical samples'},
  {icon:'📦', title:'Order Management',         desc:'End-to-end orders with digital consent capture'},
  {icon:'📊', title:'Reports & Analytics',      desc:'MR performance, visit trends, territory intelligence'},
];
const STATS = [
  {v:'1,200+', l:'Doctors Managed',          d:'0s'},
  {v:'350+',   l:'Medical Representatives',  d:'.1s'},
  {v:'25+',    l:'Territories Covered',      d:'.2s'},
  {v:'99.9%',  l:'System Availability',      d:'.3s'},
];
const TRUST = [
  {label:'SSL Protected',     c:'#86efac', b:'rgba(22,163,74,.25)',   bg:'rgba(22,163,74,.1)'},
  {label:'JWT Auth',          c:'#93c5fd', b:'rgba(59,130,246,.25)',  bg:'rgba(59,130,246,.1)'},
  {label:'Role-Based Access', c:'#c4b5fd', b:'rgba(139,92,246,.25)', bg:'rgba(139,92,246,.1)'},
];

/* ── Component ──────────────────────────────────────────────── */
export default function LoginPage({onLogin}: {onLogin:(r:string)=>void}) {
  const [mode, setMode]     = useState<'login'|'register'|'verify-register'|'forgot'>('login');
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole]     = useState('rep');
  const [otpCode, setOtpCode]   = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* ── API helpers (unchanged) ── */
  const readResp = async (r: Response) => {
    try { return await r.json(); }
    catch { return {message: r.status>=500 ? 'Server unavailable.' : 'Invalid response.'}; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    const ep = mode==='login' ? '/api/auth/login' : mode==='register' ? '/api/auth/register' : '/api/auth/forgot-password';
    const body = mode==='login' ? {email,password} : mode==='register' ? {fullName,email,password,role} : {email};
    let res: Response;
    try { res = await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); }
    catch { setError('Unable to reach API. Is the backend running on port 5000?'); setLoading(false); return; }
    const data = await readResp(res); setLoading(false);
    if (!res.ok) { setError(data.message||'Request failed'); return; }
    setError('');
    if (mode==='forgot') { setSuccess('Reset code sent — check your email.'); return; }
    if (mode==='register') { setSuccess('Verification code sent to your email.'); setMode('verify-register'); return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('fullName', data.user.fullName||'');
    localStorage.setItem('email', data.user.email||'');
    onLogin(data.user.role); navigate('/');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    let res: Response;
    try { res = await fetch('/api/auth/verify-registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code:otpCode})}); }
    catch { setError('Unable to reach API.'); setLoading(false); return; }
    const data = await readResp(res); setLoading(false);
    if (!res.ok) { setError(data.message||'Verification failed'); return; }
    setError(''); setSuccess('Account verified! You can sign in now.'); setMode('login'); setOtpCode('');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    let res: Response;
    try { res = await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code:otpCode,password:resetPassword})}); }
    catch { setError('Unable to reach API.'); setLoading(false); return; }
    const data = await readResp(res); setLoading(false);
    if (!res.ok) { setError(data.message||'Reset failed'); return; }
    setError(''); setSuccess('Password reset! You can sign in now.'); setMode('login');
  };

  const handleSendCode = async () => {
    if (!email) { setError('Enter your email first.'); return; }
    setError(''); setSuccess(''); setLoading(true);
    let res: Response;
    try { res = await fetch('/api/auth/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}); }
    catch { setError('Unable to reach API.'); setLoading(false); return; }
    const data = await readResp(res); setLoading(false);
    if (!res.ok) { setError(data.message||'Failed to send code.'); return; }
    setSuccess(data.message||'Reset code sent to your email.');
  };

  const switchMode = (m: typeof mode) => { setMode(m); setError(''); setSuccess(''); };

  const TITLE: Record<string,string> = {
    login:'Sign in to your account', register:'Create your account',
    'verify-register':'Verify your email', forgot:'Reset your password',
  };
  const SUB: Record<string,string> = {
    login:'Enter your credentials to access the platform.',
    register:'Fill in your details to get started.',
    'verify-register':'Enter the 6-digit code sent to your email.',
    forgot:"Enter your email and we'll send a reset code.",
  };

  /* ── RENDER ── */
  return (
    <>
      <style>{CSS}</style>

      {/* ── Page Shell ── */}
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'stretch',
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
        background:'linear-gradient(145deg,#040d18 0%,#071526 35%,#0c1f35 65%,#071220 100%)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Ambient blobs */}
        <div className="lp-drift"  style={{position:'absolute',top:'-8%',left:'-3%',width:560,height:560,borderRadius:'50%',background:'radial-gradient(circle,rgba(13,148,136,.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div className="lp-drift2" style={{position:'absolute',bottom:'-12%',right:'-4%',width:640,height:640,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'35%',left:'48%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(20,184,166,.04) 0%,transparent 70%)',pointerEvents:'none'}}/>

        {/* ════════════ LEFT HERO ════════════ */}
        <div className="lp-hero lp-left no-scroll" style={{
          flex:'1.25', display:'flex', flexDirection:'column', justifyContent:'flex-start',
          padding:'clamp(24px,3.5vw,48px) clamp(24px,3.5vw,52px)',
          paddingTop:'clamp(32px,4vw,52px)',
          borderRight:'1px solid rgba(255,255,255,.05)',
          position:'relative', minWidth:0, overflowY:'auto', maxHeight:'100vh',
        }}>

          {/* Brand */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:26}}>
            <div style={{
              width:44,height:44,borderRadius:14,flexShrink:0,
              background:'linear-gradient(135deg,#14b8a6,#0d9488)',
              display:'grid',placeItems:'center',color:'#fff',fontWeight:900,fontSize:20,
              boxShadow:'0 6px 22px rgba(13,148,136,.5)',
            }}>I</div>
            <div>
              <div style={{color:'#fff',fontWeight:800,fontSize:15,fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",lineHeight:1.2}}>ITER Pharmaceuticals</div>
              <div style={{color:'rgba(255,255,255,.38)',fontSize:11.5,marginTop:2}}>Trusted Enterprise Pharmaceutical CRM</div>
            </div>
          </div>

          {/* Live badge */}
          <div style={{marginBottom:18}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 13px',borderRadius:999,background:'rgba(20,184,166,.1)',border:'1px solid rgba(20,184,166,.25)',color:'#5eead4',fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#14b8a6',display:'inline-block',boxShadow:'0 0 6px #14b8a6',flexShrink:0}}/>
              Enterprise Secure Access
            </div>
          </div>

          {/* Heading — two plain divs, no br, no h1 color leakage */}
          <div style={{fontSize:'clamp(1.75rem,2.8vw,2.65rem)',fontWeight:900,lineHeight:1.1,letterSpacing:'-.03em',margin:'0 0 13px',fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}>
            <div style={{color:'#fff'}}>Enterprise Medical</div>
            <div style={{background:'linear-gradient(135deg,#5eead4 0%,#14b8a6 50%,#38bdf8 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Representative Platform</div>
          </div>

          <p style={{color:'rgba(255,255,255,.55)',fontSize:13.5,lineHeight:1.75,margin:'0 0 26px',maxWidth:'46ch'}}>
            Helping pharmaceutical organisations streamline field operations, doctor engagement, inventory, and analytics through one secure digital platform.
          </p>

          {/* Illustration */}
          <div style={{marginBottom:22}}>
            <HeroIllustration />
          </div>

          {/* KPI Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:9,marginBottom:22}}>
            {STATS.map(s=>(
              <div key={s.l} className="stat-card" style={{animationDelay:s.d}}>
                <div style={{fontSize:'clamp(1.05rem,1.7vw,1.45rem)',fontWeight:900,color:'#5eead4',fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",letterSpacing:'-.02em',lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginTop:5,lineHeight:1.35,textAlign:'center'}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <div style={{display:'grid',gap:7,marginBottom:20}}>
            {FEATURES.map(f=>(
              <div key={f.title} className="feat-card">
                <div style={{width:34,height:34,borderRadius:9,background:'rgba(20,184,166,.12)',border:'1px solid rgba(20,184,166,.2)',display:'grid',placeItems:'center',fontSize:16,flexShrink:0}}>{f.icon}</div>
                <div style={{minWidth:0}}>
                  <div style={{color:'rgba(255,255,255,.88)',fontSize:12.5,fontWeight:600,lineHeight:1.3}}>{f.title}</div>
                  <div style={{color:'rgba(255,255,255,.38)',fontSize:11,marginTop:2,lineHeight:1.4}}>{f.desc}</div>
                </div>
                <div style={{marginLeft:'auto',color:'rgba(20,184,166,.4)',fontSize:13,flexShrink:0}}>›</div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            {TRUST.map(t=>(
              <div key={t.label} className="trust-badge" style={{color:t.c,borderColor:t.b,background:t.bg}}>
                <span style={{fontSize:9}}>✓</span>{t.label}
              </div>
            ))}
          </div>
        </div>

        {/* ════════════ RIGHT PANEL ════════════ */}
        <div className="lp-card lp-right" style={{
          flex:'0 0 clamp(360px,38vw,456px)',
          display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',
          padding:'clamp(20px,3.5vw,44px) clamp(18px,2.5vw,36px)',
          background:'rgba(255,255,255,.02)',
          borderLeft:'1px solid rgba(255,255,255,.04)',
        }}>
          {/* Glass card */}
          <div className="glass-card" style={{
            width:'100%',maxWidth:396,
            background:'rgba(9,20,40,.88)',
            border:'1px solid rgba(255,255,255,.1)',
            borderRadius:22,padding:'clamp(22px,3vw,36px)',
            boxShadow:'0 40px 100px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.04),inset 0 1px 0 rgba(255,255,255,.08)',
            backdropFilter:'blur(28px)',
          }}>
            {/* Logo block */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:20}}>
              <div style={{position:'relative',width:52,height:52,marginBottom:11}}>
                <div style={{
                  width:52,height:52,borderRadius:16,
                  background:'linear-gradient(135deg,#0d9488,#14b8a6)',
                  display:'grid',placeItems:'center',color:'#fff',fontWeight:900,fontSize:22,
                  boxShadow:'0 8px 26px rgba(13,148,136,.5)',zIndex:1,position:'relative',
                }}>I</div>
                <div style={{position:'absolute',inset:-6,borderRadius:22,border:'1.5px solid rgba(20,184,166,.25)',animation:'kf-pulse 3s ease-in-out infinite'}}/>
              </div>
              <div style={{color:'#fff',fontWeight:800,fontSize:14.5,fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",letterSpacing:'-.01em'}}>ITER Pharmaceuticals</div>
              <div style={{color:'rgba(255,255,255,.33)',fontSize:11.5,marginTop:3}}>Medical Representative Platform</div>
              <div style={{display:'flex',alignItems:'center',gap:5,marginTop:9,padding:'4px 11px',borderRadius:999,background:'rgba(22,163,74,.1)',border:'1px solid rgba(22,163,74,.22)',color:'#86efac',fontSize:11,fontWeight:600}}>
                🔒 SSL Protected · Secure Login
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{display:'flex',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:11,padding:4,marginBottom:18,gap:3}}>
              <button type="button" className={`lp-tab ${mode==='login'?'on':''}`}       onClick={()=>switchMode('login')}>Sign In</button>
              <button type="button" className={`lp-tab ${mode==='register'?'on':''}`}    onClick={()=>switchMode('register')}>Register</button>
              <button type="button" className={`lp-tab ${mode==='forgot'||mode==='verify-register'?'on':''}`} onClick={()=>switchMode('forgot')}>Recover</button>
            </div>

            {/* Section title */}
            <div style={{marginBottom:16}}>
              <div style={{color:'#fff',fontSize:18,fontWeight:800,fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",letterSpacing:'-.02em',marginBottom:4}}>{TITLE[mode]}</div>
              <div style={{color:'rgba(255,255,255,.38)',fontSize:12.5,lineHeight:1.5}}>{SUB[mode]}</div>
            </div>

            <div className="lp-hr"/>

            {/* FORGOT / RESET */}
            {mode==='forgot' && (
              <form onSubmit={handleReset} style={{display:'grid',gap:10}}>
                <div className="lp-field"><div className="ico">{I.mail}</div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" required/></div>
                <div className="lp-field"><div className="ico">{I.hash}</div><input value={otpCode} onChange={e=>setOtpCode(e.target.value)} placeholder="Reset code from your email"/></div>
                <div className="lp-field"><div className="ico">{I.lock}</div><input value={resetPassword} onChange={e=>setResetPassword(e.target.value)} placeholder="New password" type={showPw?'text':'password'}/><button type="button" className="lp-eye" onClick={()=>setShowPw(v=>!v)}>{showPw?'🙈':'👁'}</button></div>
                {error   && <div className="lp-err">⚠ {error}</div>}
                {success && <div className="lp-suc">✓ {success}</div>}
                <button type="submit" className="btn-primary" disabled={loading}>{loading?'⏳ Resetting…':'Reset Password'}</button>
                <button type="button" className="btn-ghost"  onClick={handleSendCode} disabled={loading}>Send Reset Code to Email</button>
              </form>
            )}

            {/* VERIFY */}
            {mode==='verify-register' && (
              <form onSubmit={handleVerify} style={{display:'grid',gap:10}}>
                <div className="lp-field"><div className="ico">{I.mail}</div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" readOnly style={{opacity:.55}}/></div>
                <div className="lp-field"><div className="ico">{I.hash}</div><input value={otpCode} onChange={e=>setOtpCode(e.target.value)} placeholder="6-digit verification code"/></div>
                {error   && <div className="lp-err">⚠ {error}</div>}
                {success && <div className="lp-suc">✓ {success}</div>}
                <button type="submit" className="btn-primary" disabled={loading}>{loading?'⏳ Verifying…':'Verify Account'}</button>
              </form>
            )}

            {/* LOGIN / REGISTER */}
            {(mode==='login'||mode==='register') && (
              <form onSubmit={handleSubmit} style={{display:'grid',gap:10}}>
                {mode==='register' && <div className="lp-field"><div className="ico">{I.user}</div><input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Full name"/></div>}
                <div className="lp-field"><div className="ico">{I.mail}</div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email"/></div>
                <div className="lp-field">
                  <div className="ico">{I.lock}</div>
                  <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type={showPw?'text':'password'}/>
                  <button type="button" className="lp-eye" onClick={()=>setShowPw(v=>!v)}>{showPw?'🙈':'👁'}</button>
                </div>
                {mode==='register' && (
                  <div className="lp-field"><div className="ico">{I.role}</div>
                    <select value={role} onChange={e=>setRole(e.target.value)}>
                      <option value="rep">Medical Representative</option>
                      <option value="manager">Field Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                )}
                {mode==='login' && (
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'2px 0'}}>
                    <label style={{display:'flex',alignItems:'center',gap:7,color:'rgba(255,255,255,.45)',fontSize:12.5,cursor:'pointer'}}>
                      <input type="checkbox" style={{width:13,height:13,accentColor:'#14b8a6',padding:0}}/> Remember me
                    </label>
                    <button type="button" onClick={()=>switchMode('forgot')} style={{background:'none',border:'none',color:'#5eead4',fontSize:12.5,padding:0,cursor:'pointer',boxShadow:'none',fontWeight:500}}>
                      Forgot password?
                    </button>
                  </div>
                )}
                {error   && <div className="lp-err">⚠ {error}</div>}
                {success && <div className="lp-suc">✓ {success}</div>}
                <button type="submit" className="btn-primary" disabled={loading} style={{marginTop:4}}>
                  {loading ? '⏳ Please wait…' : mode==='login' ? 'Sign In to Platform' : 'Create Account'}
                </button>
              </form>
            )}

            <div className="lp-hr" style={{marginTop:18}}/>
            <div style={{textAlign:'center',color:'rgba(255,255,255,.18)',fontSize:11}}>
              Protected by enterprise-grade security · TLS 1.3 · AES-256
            </div>
          </div>

          {/* Footer */}
          <div style={{marginTop:18,textAlign:'center',display:'grid',gap:7}}>
            <div style={{display:'flex',justifyContent:'center',gap:18,flexWrap:'wrap'}}>
              {['Privacy Policy','Terms of Service','Contact Support'].map(l=>(
                <span key={l} style={{color:'rgba(255,255,255,.27)',fontSize:11.5,cursor:'pointer',transition:'color .15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(20,184,166,.7)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,.27)')}>{l}</span>
              ))}
            </div>
            <div style={{color:'rgba(255,255,255,.18)',fontSize:11}}>
              © {new Date().getFullYear()} ITER Pharmaceuticals · v2.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
