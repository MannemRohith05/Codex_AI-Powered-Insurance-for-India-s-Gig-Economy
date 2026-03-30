import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Users, Shield, FileText, TrendingUp } from 'lucide-react';

const PlatformDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/platform/stats').then(r => setStats(r.data)).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="spinner scale-150" /></div>;

  const insuranceRate = stats?.totalWorkers ? Math.round((stats.insuredWorkers / stats.totalWorkers) * 100) : 0;

  const radialData = [{ name: 'Insured', value: insuranceRate, fill: '#6366f1' }];

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6">
          <h1 className="section-title">Platform Dashboard</h1>
          <p className="section-sub">{user?.company_name} — {user?.platform} | Insurance Status Overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Workers', value: stats?.totalWorkers || 0, icon: '👷', color: 'border-indigo-500/20' },
            { label: 'Insured Workers', value: stats?.insuredWorkers || 0, icon: '🛡️', color: 'border-emerald-500/20' },
            { label: 'Uninsured', value: stats?.uninsuredWorkers || 0, icon: '⚠️', color: 'border-amber-500/20' },
            { label: 'Total Claims', value: stats?.totalClaims || 0, icon: '📋', color: 'border-slate-700' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`card border ${color}`}>
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Insurance rate radial */}
          <div className="card border border-slate-800 flex flex-col items-center py-6">
            <h3 className="font-semibold text-white mb-2">Insurance Coverage Rate</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius={60} outerRadius={90} data={radialData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" background={{ fill: '#1e293b' }} cornerRadius={10} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-4xl font-bold gradient-text -mt-4">{insuranceRate}%</p>
            <p className="text-slate-400 text-sm mt-1">of your workers are insured</p>
          </div>

          {/* Claims overview */}
          <div className="card border border-slate-800">
            <h3 className="font-semibold text-white mb-3">Claims Summary</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Claims Filed', value: stats?.totalClaims || 0, color: 'bg-indigo-500' },
                { label: 'Claims Paid Out', value: stats?.paidClaims || 0, color: 'bg-emerald-500' },
                { label: 'Pending Review', value: (stats?.totalClaims || 0) - (stats?.paidClaims || 0), color: 'bg-amber-500' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-white font-semibold">{value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${stats?.totalClaims ? (value / stats.totalClaims) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Link to="/platform/workers" className="btn-primary flex-1 text-center text-sm py-2">View Workers</Link>
              <Link to="/platform/claims" className="btn-secondary flex-1 text-center text-sm py-2">Claims Feed</Link>
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default PlatformDashboard;
