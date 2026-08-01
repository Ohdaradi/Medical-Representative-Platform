import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DoctorsPage from './pages/DoctorsPage';
import VisitsPage from './pages/VisitsPage';
import OrdersPage from './pages/OrdersPage';
import SamplesPage from './pages/SamplesPage';
import DashboardPage from './pages/DashboardPage';
import TerritoriesPage from './pages/TerritoriesPage';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';
import AuditLogsPage from './pages/AuditLogsPage';

// ── Navigation map per role ─────────────────────────────────
const NAV_REP = [
  { to: '/',             icon: '⊞',  label: 'Dashboard' },
  { to: '/doctors',      icon: '👨‍⚕️', label: 'Assigned Doctors' },
  { to: '/visits',       icon: '🏥', label: 'Visits' },
  { to: '/orders',       icon: '📦', label: 'Orders' },
  { to: '/samples',      icon: '💊', label: 'Samples' },
  { to: '/notifications',icon: '🔔', label: 'Notifications' },
  { to: '/profile',      icon: '👤', label: 'My Profile' },
  { to: '/help',         icon: '💬', label: 'Help & Support' },
];

const NAV_MANAGER = [
  { to: '/',              icon: '⊞',  label: 'Team Dashboard' },
  { to: '/users',         icon: '👥', label: 'Medical Representatives' },
  { to: '/doctors',       icon: '👨‍⚕️', label: 'Doctor Assignments' },
  { to: '/territories',   icon: '🗺️', label: 'Territory Monitoring' },
  { to: '/visits',        icon: '🏥', label: 'Visit Management' },
  { to: '/orders',        icon: '📦', label: 'Orders Review' },
  { to: '/reports',       icon: '📊', label: 'Reports & Analytics' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile',       icon: '👤', label: 'My Profile' },
];

const NAV_ADMIN = [
  { to: '/',              icon: '⊞',  label: 'System Dashboard' },
  { to: '/users',         icon: '👥', label: 'User Management' },
  { to: '/doctors',       icon: '👨‍⚕️', label: 'Doctors Directory' },
  { to: '/products',      icon: '💊', label: 'Medicines & Products' },
  { to: '/territories',   icon: '🗺️', label: 'Territories' },
  { to: '/samples',       icon: '🧪', label: 'Sample Inventory' },
  { to: '/orders',        icon: '📦', label: 'Orders' },
  { to: '/reports',       icon: '📊', label: 'Analytics & Reports' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/audit-logs',    icon: '📜', label: 'Audit Logs' },
  { to: '/profile',       icon: '👤', label: 'My Profile' },
];

function App() {
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const location = useLocation();
  const isLoginRoute = location.pathname === '/login';

  useEffect(() => {
    setRole(localStorage.getItem('role'));
  }, [location]);

  if (isLoginRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={(nextRole) => setRole(nextRole)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell-inner">
        {role && (
          <Sidebar
            role={role}
            onLogout={() => { localStorage.clear(); setRole(null); }}
          />
        )}

        <div className="content-area">
          <Topbar />

          <div className="page-wrapper">
            <Routes>
              <Route path="/"              element={role ? <DashboardPage /> : <Navigate to="/login" replace />} />
              <Route path="/doctors"       element={role ? <DoctorsPage /> : <Navigate to="/login" replace />} />
              <Route path="/visits"        element={role ? <VisitsPage /> : <Navigate to="/login" replace />} />
              <Route path="/orders"        element={role ? <OrdersPage /> : <Navigate to="/login" replace />} />
              <Route path="/samples"       element={role && role !== 'manager' ? <SamplesPage /> : <Navigate to="/" replace />} />
              <Route path="/territories"   element={role === 'manager' || role === 'admin' ? <TerritoriesPage /> : <Navigate to="/" replace />} />
              <Route path="/products"      element={role === 'admin' ? <ProductsPage /> : <Navigate to="/" replace />} />
              <Route path="/users"         element={role === 'manager' || role === 'admin' ? <UsersPage /> : <Navigate to="/" replace />} />
              <Route path="/notifications" element={role ? <NotificationsPage /> : <Navigate to="/login" replace />} />
              <Route path="/reports"       element={role === 'manager' || role === 'admin' ? <ReportsPage /> : <Navigate to="/" replace />} />
              <Route path="/audit-logs"    element={role === 'admin' ? <AuditLogsPage /> : <Navigate to="/" replace />} />
              <Route path="/profile"       element={role ? <ProfilePage /> : <Navigate to="/login" replace />} />
              <Route path="/help"          element={role ? <HelpPage /> : <Navigate to="/login" replace />} />
              <Route path="*"              element={<Navigate to={role ? '/' : '/login'} replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Topbar ──────────────────────────────────────────────────
function Topbar() {
  return (
    <div className="topbar">
      <ThemeToggle />
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────
function Sidebar({ role, onLogout }: { role: string; onLogout: () => void }) {
  const location = useLocation();

  const links =
    role === 'rep'     ? NAV_REP :
    role === 'manager' ? NAV_MANAGER :
    NAV_ADMIN;

  const roleLabel =
    role === 'rep'     ? 'Medical Representative' :
    role === 'manager' ? 'Field Manager' :
    'System Administrator';

  const fullName = localStorage.getItem('fullName') || localStorage.getItem('email') || '—';
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">I</div>
        <div>
          <div className="brand-title">ITER Pharmaceuticals</div>
          <div className="brand-subtitle">MR Platform</div>
        </div>
      </div>

      {/* User card */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initial}</div>
        <div style={{ minWidth: 0 }}>
          <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fullName}
          </div>
          <div className="sidebar-user-role">{roleLabel}</div>
        </div>
      </div>

      {/* Nav */}
      <div className="nav-section-label">Navigation</div>
      <nav className="nav-list" style={{ position: 'relative' }}>
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <span>↩</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

// ── Theme Toggle ─────────────────────────────────────────────
function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as any) || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    } else {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      if (e.matches) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  return (
    <div className="theme-toggle">
      {(['light', 'dark', 'system'] as const).map((t) => (
        <button
          key={t}
          type="button"
          className={`theme-btn ${theme === t ? 'active' : ''}`}
          onClick={() => setTheme(t)}
        >
          {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '⚙ Auto'}
        </button>
      ))}
    </div>
  );
}

export default App;
