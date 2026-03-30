import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Shield, FileText, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#a855f7'];

const KPICard = ({ label, value, icon, color, link, sub }) => (
  <Link to={link || '#'} className={`card border ${color} hover:scale-105 transition-all duration-200 block`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="spinner scale-150" /></div>;

  const pieData = [
    { name: 'Workers', value: stats?.totalWorkers || 0 },
    { name: 'Active Policies', value: stats?.activePolicies || 0 },
    { name: 'Pending Claims', value: stats?.pendingClaims || 0 },
    { name: 'Fraud Flags', value: stats?.flaggedFraud || 0 },
  ];

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6">
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="section-sub">GigShield Insurance Operations Overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <KPICard label="Total Workers" value={stats?.totalWorkers || 0} icon="👷" color="border-indigo-500/20" link="/admin/workers" />
          <KPICard label="Active Policies" value={stats?.activePolicies || 0} icon="🛡️" color="border-emerald-500/20" />
          <KPICard label="Pending Claims" value={stats?.pendingClaims || 0} icon="⏳" color="border-amber-500/20" link="/admin/claims" />
          <KPICard label="Fraud Flags" value={stats?.flaggedFraud || 0} icon="🚨" color="border-red-500/20" link="/admin/fraud" />
          <KPICard label="Total Paid Out" value={`₹${((stats?.totalPaidOut || 0) / 100).toLocaleString('en-IN')}`} icon="💸" color="border-purple-500/20" sub="lifetime" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card border border-slate-800">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-400" />Operational Overview</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { name: 'Workers', count: stats?.totalWorkers || 0 },
                { name: 'Policies', count: stats?.activePolicies || 0 },
                { name: 'Pending', count: stats?.pendingClaims || 0 },
                { name: 'Fraud', count: stats?.flaggedFraud || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {[0,1,2,3].map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card border border-slate-800">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-rose-400" />Metric Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/admin/claims', label: 'Review Claims', icon: '📋', color: 'border-indigo-500/30 hover:bg-indigo-500/10' },
            { to: '/admin/fraud', label: 'Fraud Panel', icon: '🔍', color: 'border-red-500/30 hover:bg-red-500/10' },
            { to: '/admin/workers', label: 'Manage Workers', icon: '👷', color: 'border-emerald-500/30 hover:bg-emerald-500/10' },
            { to: '/admin/disruption', label: 'Declare Disruption', icon: '⚡', color: 'border-amber-500/30 hover:bg-amber-500/10' },
          ].map(({ to, label, icon, color }) => (
            <Link key={to} to={to} className={`card border text-center py-5 transition-all duration-200 hover:scale-105 cursor-pointer ${color}`}>
              <p className="text-3xl mb-2">{icon}</p>
              <p className="text-sm font-medium text-slate-300">{label}</p>
            </Link>
          ))}
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default AdminDashboard;
