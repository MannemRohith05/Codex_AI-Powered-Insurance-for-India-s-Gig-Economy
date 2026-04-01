/**
 * Sidebar — role-aware navigation panel.
 * 
 * Design decisions:
 * - Clean white surface, border-right separator — no dark overlays
 * - Active items: subtle primary-50 bg + left accent line (2px primary-600)
 * - Role-specific accent colors kept for the logo icon only (identity signal)
 * - Collapsible on desktop, drawer on mobile
 * - All colors come from Tailwind semantic classes — zero inline styles
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, FileText, AlertTriangle, Users,
  Cloud, Activity, LogOut, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

const workerLinks = [
  { to: '/worker/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/worker/buy-policy',   icon: Shield,           label: 'My Policy' },
  { to: '/worker/submit-claim', icon: FileText,         label: 'File Claim' },
  { to: '/worker/claims',       icon: Activity,         label: 'Claim History' },
  { to: '/worker/kyc',          icon: Users,            label: 'KYC / Aadhaar' },
  { to: '/worker/activity',     icon: AlertTriangle,    label: 'Activity Log' },
];

const adminLinks = [
  { to: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/claims',      icon: FileText,         label: 'Claims' },
  { to: '/admin/fraud',       icon: AlertTriangle,    label: 'Fraud Panel' },
  { to: '/admin/workers',     icon: Users,            label: 'Workers' },
  { to: '/admin/disruption',  icon: Cloud,            label: 'Disruptions' },
];

const platformLinks = [
  { to: '/platform/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/platform/workers',   icon: Users,            label: 'Workers' },
  { to: '/platform/claims',    icon: FileText,         label: 'Claims Feed' },
];

// Role config — only the logo icon accent differs per role
const roleConfig = {
  worker:   { links: workerLinks,   label: 'Worker Portal',  iconBg: 'bg-primary-600'  },
  admin:    { links: adminLinks,    label: 'Admin Portal',   iconBg: 'bg-rose-600'     },
  platform: { links: platformLinks, label: 'Partner Portal', iconBg: 'bg-emerald-600'  },
};

/** Shared nav content — used by both mobile drawer and desktop sidebar */
const NavContent = ({ config, role, user, collapsed, location, onLinkClick, onLogout, onToggleCollapse }) => (
  <div className="flex flex-col h-full">

    {/* ── Logo ── */}
    <div className={cn(
      'flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)] shrink-0',
      collapsed && 'justify-center px-0'
    )}>
      <div className={cn(
        'shrink-0 flex items-center justify-center rounded-lg w-9 h-9 text-white',
        config.iconBg
      )}>
        <Shield className="w-5 h-5" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="font-bold text-sm text-[var(--color-text-primary)] tracking-tight">GigShield</p>
          <p className="text-xs text-[var(--color-text-muted)] truncate">{config.label}</p>
        </div>
      )}
    </div>

    {/* ── Nav Links ── */}
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {config.links.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              collapsed && 'justify-center',
              active
                ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-600'
                : 'text-[var(--color-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-text-primary)] border-l-2 border-transparent'
            )}
          >
            <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary-600' : '')} />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>

    {/* ── User + Actions ── */}
    <div className="border-t border-[var(--color-border)] p-3 space-y-1 shrink-0">
      {/* User chip */}
      {!collapsed && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 mb-2">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0',
            config.iconBg
          )}>
            {(user?.name || user?.company_name || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
              {user?.name || user?.company_name || 'User'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] capitalize">{role}</p>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={onLogout}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-danger-600 hover:bg-danger-50 transition-colors',
          collapsed && 'justify-center'
        )}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        {!collapsed && 'Logout'}
      </button>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center w-full py-1.5 rounded-lg text-[var(--color-text-disabled)] hover:text-[var(--color-text-muted)] hover:bg-slate-100 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

const Sidebar = () => {
  const { role, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = roleConfig[role] || roleConfig.worker;

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => { logout(); navigate(`/${role}/login`); };

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-[var(--color-border)] shadow-md text-[var(--color-text-secondary)] transition-colors hover:text-primary-600"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          'md:hidden fixed top-0 left-0 h-full z-50 bg-white border-r border-[var(--color-border)] shadow-xl transition-transform duration-300 w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent
          config={config} role={role} user={user}
          collapsed={false} location={location}
          onLinkClick={() => setMobileOpen(false)}
          onLogout={handleLogout}
          onToggleCollapse={() => {}}
        />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-[var(--color-border)] shrink-0 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
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
