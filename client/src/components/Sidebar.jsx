import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, FileText, AlertTriangle, Users,
  Cloud, Activity, LogOut, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const workerLinks = [
  { to: '/worker/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/worker/buy-policy', icon: Shield, label: 'My Policy' },
  { to: '/worker/submit-claim', icon: FileText, label: 'File Claim' },
  { to: '/worker/claims', icon: Activity, label: 'Claim History' },
  { to: '/worker/kyc', icon: Users, label: 'KYC / Aadhaar' },
  { to: '/worker/activity', icon: AlertTriangle, label: 'Activity Log' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/claims', icon: FileText, label: 'Claims' },
  { to: '/admin/fraud', icon: AlertTriangle, label: 'Fraud Panel' },
  { to: '/admin/workers', icon: Users, label: 'Workers' },
  { to: '/admin/disruption', icon: Cloud, label: 'Disruptions' },
];

const platformLinks = [
  { to: '/platform/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/platform/workers', icon: Users, label: 'Workers' },
  { to: '/platform/claims', icon: FileText, label: 'Claims Feed' },
];

const roleConfig = {
  worker:   { links: workerLinks,   label: 'Worker Portal',  accent: '#ff6b35', glow: 'rgba(255,107,53,0.35)',  gradient: 'linear-gradient(135deg, #ff8c5a, #ff6b35)'  },
  admin:    { links: adminLinks,    label: 'Admin Portal',   accent: '#f43f5e', glow: 'rgba(244,63,94,0.35)',   gradient: 'linear-gradient(135deg, #fb7185, #f43f5e)'  },
  platform: { links: platformLinks, label: 'Partner Portal', accent: '#00d9c0', glow: 'rgba(0,217,192,0.35)',  gradient: 'linear-gradient(135deg, #00f5dd, #00d9c0)'  },
};

/* ── Shared nav content ── */
const NavContent = ({ config, role, user, collapsed, location, onLinkClick, onLogout, onToggleCollapse }) => (
  <>
    {/* Top accent line */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: config.gradient, opacity: 0.7 }} />

    {/* Logo */}
    <div
      className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}
      style={{ borderBottom: '1px solid rgba(255,107,53,0.07)' }}
    >
      <div
        className="shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 38, height: 38, background: config.gradient, boxShadow: `0 4px 18px ${config.glow}, 0 0 0 1px rgba(255,255,255,0.08) inset` }}
      >
        <Shield className="w-5 h-5 text-white" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            GigShield
          </span>
          <p className="text-xs truncate" style={{ color: 'rgba(148,163,184,0.50)', marginTop: 1 }}>{config.label}</p>
        </div>
      )}
    </div>

    {/* Nav */}
    <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2 scrollbar-thin">
      {config.links.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
            style={{
              color: active ? config.accent : 'rgba(148,163,184,0.55)',
              background: active ? `rgba(${role === 'worker' ? '255,107,53' : role === 'admin' ? '244,63,94' : '0,217,192'},0.08)` : 'transparent',
              borderLeft: active && !collapsed ? `2px solid ${config.accent}` : '2px solid transparent',
              transform: active ? 'translateX(2px)' : 'translateX(0)',
              boxShadow: active ? `inset 0 0 20px rgba(${role === 'worker' ? '255,107,53' : role === 'admin' ? '244,63,94' : '0,217,192'},0.05)` : 'none',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,107,53,0.05)'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(148,163,184,0.55)'; e.currentTarget.style.background = 'transparent'; } }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color: active ? config.accent : 'inherit', filter: active ? `drop-shadow(0 0 6px ${config.glow})` : 'none' }} />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>

    {/* User + Logout */}
    <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,107,53,0.07)' }}>
      {!collapsed && (
        <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: config.gradient, color: 'white' }}>
              {(user?.name || user?.company_name || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#e2e8f0' }}>{user?.name || user?.company_name || 'User'}</p>
              <p className="text-xs truncate capitalize" style={{ color: 'rgba(148,163,184,0.45)' }}>{role}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onLogout}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
        style={{ color: 'rgba(148,163,184,0.45)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.45)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        {!collapsed && 'Logout'}
      </button>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center w-full py-1.5 transition-colors rounded-lg"
        style={{ color: 'rgba(255,107,53,0.25)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,107,53,0.60)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,107,53,0.25)'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  </>
);

const Sidebar = () => {
  const { role, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = roleConfig[role] || roleConfig.worker;

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => { logout(); navigate(`/${role}/login`); };

  const sidebarStyle = {
    background: 'rgba(5, 8, 18, 0.98)',
    borderRight: '1px solid rgba(255,107,53,0.08)',
    boxShadow: '4px 0 60px rgba(0,0,0,0.70), 1px 0 0 rgba(255,107,53,0.05), inset -1px 0 0 rgba(0,0,0,0.30)',
  };

  return (
    <>
      {/* ── Mobile hamburger button ── */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-xl transition-all"
        style={{ background: 'rgba(5,8,18,0.95)', border: '1px solid rgba(255,107,53,0.20)', color: '#ff6b35', boxShadow: '0 4px 20px rgba(0,0,0,0.55)' }}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ── Mobile backdrop overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer (slides in from left) ── */}
      <aside
        className="md:hidden fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300"
        style={{
          width: 240,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          ...sidebarStyle,
        }}
      >
        <NavContent
          config={config} role={role} user={user}
          collapsed={false} location={location}
          onLinkClick={() => setMobileOpen(false)}
          onLogout={handleLogout}
          onToggleCollapse={() => {}}
        />
      </aside>

      {/* ── Desktop sidebar (always visible) ── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 glass transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
        style={sidebarStyle}
      >
        <NavContent
          config={config} role={role} user={user}
          collapsed={collapsed} location={location}
          onLinkClick={() => {}}
          onLogout={handleLogout}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
      </aside>
    </>
  );
};

export default Sidebar;
