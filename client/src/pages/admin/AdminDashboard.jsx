/**
 * AdminDashboard — operational overview for insurance admins.
 * KPI cards at top, bar chart + pie chart below, quick action grid at bottom.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { Users, Shield, FileText, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const PIE_COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#f43f5e'];

// ── KPI Card ─────────────────────────────────────────────────
const KPICard = ({ label, value, icon: Icon, iconColor, iconBg, sub, link }) => (
  <Link to={link || '#'} className={cn('kpi-card group transition-all duration-150 hover:shadow-md hover:-translate-y-0.5', !link && 'pointer-events-none')}>
    <div className="flex items-start justify-between">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
    </div>
    <div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value ?? '—'}</p>
      {sub && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
    </div>
    {link && (
      <div className="flex items-center gap-1 text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        View details <ArrowRight className="w-3 h-3" />
      </div>
    )}
  </Link>
);

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="page-header"><Skeleton className="h-7 w-48" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </PageContent>
    </DashboardLayout>
  );

  const barData = [
    { name: 'Workers',  count: stats?.totalWorkers   || 0 },
    { name: 'Policies', count: stats?.activePolicies || 0 },
    { name: 'Pending',  count: stats?.pendingClaims  || 0 },
    { name: 'Fraud',    count: stats?.flaggedFraud   || 0 },
  ];

  const pieData = [
    { name: 'Workers',  value: stats?.totalWorkers   || 0 },
    { name: 'Policies', value: stats?.activePolicies || 0 },
    { name: 'Pending',  value: stats?.pendingClaims  || 0 },
    { name: 'Fraud',    value: stats?.flaggedFraud   || 0 },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      color: '#0f172a',
      fontSize: 13,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    },
  };

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">GigShield insurance operations overview</p>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <KPICard
            label="Total Workers" value={stats?.totalWorkers || 0}
            icon={Users} iconBg="bg-primary-50" iconColor="text-primary-600"
            link="/admin/workers"
          />
          <KPICard
            label="Active Policies" value={stats?.activePolicies || 0}
            icon={Shield} iconBg="bg-success-50" iconColor="text-success-600"
          />
          <KPICard
            label="Pending Claims" value={stats?.pendingClaims || 0}
            icon={FileText} iconBg="bg-warning-100" iconColor="text-warning-600"
            link="/admin/claims"
          />
          <KPICard
            label="Fraud Flags" value={stats?.flaggedFraud || 0}
            icon={AlertTriangle} iconBg="bg-danger-50" iconColor="text-danger-600"
            link="/admin/fraud"
          />
          <KPICard
            label="Total Paid Out"
            value={`₹${((stats?.totalPaidOut || 0) / 100).toLocaleString('en-IN')}`}
            icon={TrendingUp} iconBg="bg-slate-100" iconColor="text-slate-600"
            sub="lifetime"
          />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar chart */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-primary-500" /> Operational Overview
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4 text-rose-500" /> Metric Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  outerRadius={90} innerRadius={45}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/admin/claims',     label: 'Review Claims',     emoji: '📋', color: 'hover:border-primary-300 hover:bg-primary-50' },
              { to: '/admin/fraud',      label: 'Fraud Panel',       emoji: '🔍', color: 'hover:border-danger-300  hover:bg-danger-50'   },
              { to: '/admin/workers',    label: 'Manage Workers',    emoji: '👷', color: 'hover:border-success-300 hover:bg-success-50'   },
              { to: '/admin/disruption', label: 'Add Disruption',    emoji: '⚡', color: 'hover:border-warning-300 hover:bg-warning-50'   },
            ].map(({ to, label, emoji, color }) => (
              <Link
                key={to} to={to}
                className={cn('card border text-center py-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm', color)}
              >
                <p className="text-3xl mb-2">{emoji}</p>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default AdminDashboard;
