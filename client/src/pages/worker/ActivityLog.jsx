/**
 * ActivityLog — delivery performance log with chart.
 * Light chart theme, semantic table classes.
 */
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/worker/activity')
      .then(r => setLogs(r.data.logs || []))
      .catch(() => toast.error('Failed to load activity'))
      .finally(() => setLoading(false));
  }, []);

  const totals = logs.reduce((acc, l) => ({
    earnings:   acc.earnings   + (l.earnings      || 0),
    deliveries: acc.deliveries + (l.deliveries    || 0),
    hours:      acc.hours      + (l.hours_active  || 0),
    distance:   acc.distance   + (l.distance_km   || 0),
  }), { earnings: 0, deliveries: 0, hours: 0, distance: 0 });

  const chartData = [...logs].reverse().map(l => ({
    date:       format(new Date(l.log_date), 'dd/MM'),
    earnings:   Math.round(l.earnings     || 0),
    deliveries: l.deliveries || 0,
    hours:      l.hours_active || 0,
  }));

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
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Your delivery performance over the last 30 days</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Earnings', value: `₹${totals.earnings.toLocaleString('en-IN')}`, emoji: '💰' },
            { label: 'Deliveries',    value: totals.deliveries,                              emoji: '📦' },
            { label: 'Active Hours',  value: `${totals.hours.toFixed(0)}h`,                 emoji: '⏱️' },
            { label: 'Distance',      value: `${Math.round(totals.distance)} km`,            emoji: '🛵' },
          ].map(({ label, value, emoji }) => (
            <div key={label} className="kpi-card text-center">
              <p className="text-3xl">{emoji}</p>
              <p className="kpi-value text-2xl">{loading ? '—' : value}</p>
              <p className="kpi-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Earnings area chart */}
        <div className="card p-6 mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Daily Earnings (₹)</h3>
          {loading ? (
            <div className="animate-pulse h-48 rounded-lg bg-slate-100" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="earnings" stroke="#4f46e5" fill="url(#earningsGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily log table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Daily Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Hours</th><th>Deliveries</th>
                  <th>Distance</th><th>Acceptance</th><th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((__, j) => (
                        <td key={j}><div className="animate-pulse h-4 rounded bg-slate-100 w-16" /></td>
                      ))}
                    </tr>
                  ))
                  : logs.map(l => {
                    const rate = l.available_orders
                      ? Math.round((l.accepted_orders / l.available_orders) * 100)
                      : 100;
                    return (
                      <tr key={l._id}>
                        <td className="font-medium text-[var(--color-text-primary)]">
                          {format(new Date(l.log_date), 'dd MMM yyyy')}
                        </td>
                        <td>{l.hours_active}h</td>
                        <td>{l.deliveries}</td>
                        <td>{l.distance_km} km</td>
                        <td>
                          <span className={cn('font-semibold', rate >= 70 ? 'text-success-600' : 'text-warning-600')}>
                            {rate}%
                          </span>
                        </td>
                        <td className="font-semibold text-success-600">
                          ₹{(l.earnings || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default ActivityLog;
