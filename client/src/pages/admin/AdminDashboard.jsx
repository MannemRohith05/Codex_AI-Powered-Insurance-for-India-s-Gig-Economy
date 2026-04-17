/**
 * AdminDashboard — operational overview for insurance admins.
 * KPI cards at top, bar chart + pie chart below, actuarial health,
 * predictive analytics panel (Section C), and zone loss ratio table (Section H).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import ActuarialHealthCard from '../../components/ActuarialHealthCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import {
  Users, Shield, FileText, AlertTriangle, TrendingUp, ArrowRight,
  Activity, MapPin, Clapperboard,
} from 'lucide-react';
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

// ── Loss Ratio Status Badge ───────────────────────────────────
const LossRatioBadge = ({ status }) => {
  const map = {
    HEALTHY:  'bg-green-100 text-green-700',
    WARNING:  'bg-amber-100 text-amber-700',
    DANGER:   'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', map[status] || map.HEALTHY)}>
      {status}
    </span>
  );
};

const AdminDashboard = () => {
  const [stats,     setStats]     = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [zones,     setZones]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard').catch(() => ({ data: {} })),
      api.get('/admin/predictive-analytics').catch(() => ({ data: null })),
      api.get('/admin/zone-loss-ratios').catch(() => ({ data: null })),
    ]).then(([statsRes, analyticsRes, zonesRes]) => {
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setZones(zonesRes.data);
    }).catch(() => toast.error('Failed to load dashboard'))
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

  const claimsSummary = analytics?.claims_summary;
  const claimStatusData = claimsSummary ? [
    { name: 'Approved', value: claimsSummary.approved, fill: '#10b981' },
    { name: 'Pending',  value: claimsSummary.pending,  fill: '#f59e0b' },
    { name: 'Rejected', value: claimsSummary.rejected, fill: '#f43f5e' },
  ] : [];

  const pieData = [
    { name: 'Workers',  value: stats?.totalWorkers   || 0 },
    { name: 'Policies', value: stats?.activePolicies || 0 },
    { name: 'Pending',  value: stats?.pendingClaims  || 0 },
    { name: 'Fraud',    value: stats?.flaggedFraud   || 0 },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 8, color: '#0f172a', fontSize: 13,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    },
  };

  const dangerZones = zones?.zones?.filter(z => z.status === 'DANGER' || z.status === 'CRITICAL') || [];

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        {/* ── Page header ── */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">GigShield insurance operations overview</p>
          </div>
          <Link
            to="/admin/demo"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Clapperboard className="w-4 h-4" /> Run Demo
          </Link>
        </div>

        {/* ── Zone danger warning banner ── */}
        {dangerZones.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm text-red-800">
              <span className="font-semibold">{dangerZones.length} zone(s) have a loss ratio &gt; 0.75.</span>
              {' '}Premium adjustment recommended. See Zone Loss Ratio table below.
            </div>
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <KPICard label="Total Workers"   value={stats?.totalWorkers || 0}   icon={Users}         iconBg="bg-primary-50"  iconColor="text-primary-600" link="/admin/workers" />
          <KPICard label="Active Policies" value={stats?.activePolicies || 0} icon={Shield}        iconBg="bg-success-50"  iconColor="text-success-600" />
          <KPICard label="Pending Claims"  value={stats?.pendingClaims || 0}  icon={FileText}      iconBg="bg-warning-100" iconColor="text-warning-600" link="/admin/claims" />
          <KPICard label="Fraud Flags"     value={stats?.flaggedFraud || 0}   icon={AlertTriangle} iconBg="bg-danger-50"   iconColor="text-danger-600"  link="/admin/fraud" />
          <KPICard
            label="Total Paid Out"
            value={`₹${((stats?.totalPaidOut || 0) / 100).toLocaleString('en-IN')}`}
            icon={TrendingUp} iconBg="bg-slate-100" iconColor="text-slate-600"
            sub="lifetime"
          />
        </div>

        {/* ── Charts row ── */}
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

          {/* Claims status pie */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-5">
              <FileText className="w-4 h-4 text-rose-500" /> Claims — Approved vs Pending vs Rejected
            </h3>
            {claimStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={claimStatusData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                      {claimStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-5 mt-2">
                  {claimStatusData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      {d.name}: <strong>{d.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[180px]">
                <p className="text-sm text-[var(--color-text-muted)]">No claims data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Actuarial Health ── */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-indigo-500" /> Pool Sustainability — Actuarial Health Monitor
          </h3>
          <ActuarialHealthCard />
        </div>

        {/* ── Predictive Analytics (Section C) ── */}
        {analytics && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-violet-500" /> Predictive Analytics — Next 7 Days Forecast
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 7-day forecast chart */}
              <div className="lg:col-span-2 card p-5">
                <p className="text-xs text-[var(--color-text-muted)] mb-3">
                  Predicted claims based on active disruptions + 30-day historical frequency
                  {analytics.active_disruptions > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-orange-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      {analytics.active_disruptions} active disruption(s)
                    </span>
                  )}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.forecast} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v.slice(5)} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} formatter={(v, n) => [v, 'Predicted Claims']} />
                    <Bar dataKey="predicted_claims" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* High-risk zones */}
              <div className="card p-5">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Top Risk Zones
                </p>
                <div className="space-y-3">
                  {(analytics.high_risk_zones || []).map((z, i) => (
                    <div key={z.zone_pin} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{z.locality}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{z.city} · {z.zone_pin}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs font-bold text-rose-600">{(z.composite_risk * 100).toFixed(0)}%</p>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${z.composite_risk * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Zone Loss Ratio Table (Section H) ── */}
        {zones && zones.zones?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-orange-500" /> Zone Loss Ratio Analysis
              {zones.danger_zones > 0 && (
                <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  {zones.danger_zones} danger zone(s)
                </span>
              )}
            </h3>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zone PIN</th>
                      <th>City / Locality</th>
                      <th>Workers</th>
                      <th>Premiums Collected</th>
                      <th>Claims Paid</th>
                      <th>Loss Ratio</th>
                      <th>Status</th>
                      <th>Adjustment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.zones.slice(0, 10).map(z => (
                      <tr key={z.zone_pin}>
                        <td className="font-mono text-xs">{z.zone_pin}</td>
                        <td>
                          <p className="font-medium text-xs">{z.locality}</p>
                          <p className="text-[var(--color-text-muted)] text-xs">{z.city}</p>
                        </td>
                        <td>{z.worker_count}</td>
                        <td>₹{(z.premiums_collected || 0).toLocaleString('en-IN')}</td>
                        <td>₹{(z.claims_paid || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full min-w-[40px]">
                              <div
                                className={cn('h-full rounded-full', z.loss_ratio > 0.8 ? 'bg-red-500' : z.loss_ratio > 0.6 ? 'bg-amber-400' : 'bg-green-500')}
                                style={{ width: `${Math.min(100, z.loss_ratio * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums">{(z.loss_ratio * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td><LossRatioBadge status={z.status} /></td>
                        <td className={cn('text-xs font-semibold', z.suggested_premium_adjustment_pct > 0 ? 'text-orange-600' : 'text-slate-400')}>
                          {z.suggested_premium_adjustment_pct > 0 ? `+${z.suggested_premium_adjustment_pct}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { to: '/admin/claims',     label: 'Review Claims',  emoji: '📋', color: 'hover:border-primary-300 hover:bg-primary-50' },
              { to: '/admin/fraud',      label: 'Fraud Panel',    emoji: '🔍', color: 'hover:border-danger-300  hover:bg-danger-50'  },
              { to: '/admin/workers',    label: 'Workers',        emoji: '👷', color: 'hover:border-success-300 hover:bg-success-50' },
              { to: '/admin/disruption', label: 'Add Disruption', emoji: '⚡', color: 'hover:border-warning-300 hover:bg-warning-50' },
              { to: '/admin/demo',       label: 'Demo Mode',      emoji: '🎬', color: 'hover:border-amber-300   hover:bg-amber-50'   },
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


