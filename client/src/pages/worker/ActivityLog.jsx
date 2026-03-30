import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/worker/activity').then(r => setLogs(r.data.logs || [])).catch(() => toast.error('Failed to load activity')).finally(() => setLoading(false));
  }, []);

  const totals = logs.reduce((acc, l) => ({
    earnings: acc.earnings + (l.earnings || 0),
    deliveries: acc.deliveries + (l.deliveries || 0),
    hours: acc.hours + (l.hours_active || 0),
    distance: acc.distance + (l.distance_km || 0),
  }), { earnings: 0, deliveries: 0, hours: 0, distance: 0 });

  const chartData = [...logs].reverse().map(l => ({
    date: format(new Date(l.log_date), 'dd/MM'),
    earnings: Math.round(l.earnings || 0),
    deliveries: l.deliveries || 0,
    hours: l.hours_active || 0,
  }));

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="spinner scale-150" /></div>;

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6">
          <h1 className="section-title">Activity Log</h1>
          <p className="section-sub">Your delivery performance over the last 30 days</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Earnings', value: `₹${totals.earnings.toLocaleString('en-IN')}`, icon: '💰' },
            { label: 'Deliveries', value: totals.deliveries, icon: '📦' },
            { label: 'Active Hours', value: `${totals.hours.toFixed(0)}h`, icon: '⏱️' },
            { label: 'Distance', value: `${Math.round(totals.distance)} km`, icon: '🛵' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card border border-slate-800 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Earnings chart */}
        <div className="card border border-slate-800 mb-6">
          <h3 className="font-semibold text-white mb-4">Daily Earnings (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="earnings" stroke="#6366f1" fill="url(#earningsGradient)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Log table */}
        <div className="card border border-slate-800 overflow-x-auto">
          <h3 className="font-semibold text-white mb-4">Daily Log</h3>
          <table className="w-full data-table">
            <thead><tr><th>Date</th><th>Hours</th><th>Deliveries</th><th>Distance</th><th>Acceptance Rate</th><th>Earnings</th></tr></thead>
            <tbody>
              {logs.map(l => {
                const rate = l.available_orders ? Math.round((l.accepted_orders / l.available_orders) * 100) : 100;
                return (
                  <tr key={l._id}>
                    <td>{format(new Date(l.log_date), 'dd MMM yyyy')}</td>
                    <td>{l.hours_active}h</td>
                    <td>{l.deliveries}</td>
                    <td>{l.distance_km} km</td>
                    <td><span className={`font-semibold ${rate >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{rate}%</span></td>
                    <td className="text-emerald-400 font-semibold">₹{(l.earnings || 0).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default ActivityLog;
