/**
 * PlatformDashboard — partner coverage overview.
 * Light theme: radial coverage gauge, progress bars, quick links.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, Shield, FileText, TrendingUp, ArrowRight } from 'lucide-react';

const STAT_CARDS = (stats) => [
  { label: 'Total Workers',  value: stats?.totalWorkers   || 0, icon: Users,    iconBg: 'bg-primary-50',  iconColor: 'text-primary-600' },
  { label: 'Insured Workers',value: stats?.insuredWorkers  || 0, icon: Shield,   iconBg: 'bg-success-50',  iconColor: 'text-success-600' },
  { label: 'Uninsured',      value: stats?.uninsuredWorkers|| 0, icon: TrendingUp,iconBg: 'bg-warning-100',iconColor: 'text-warning-600' },
  { label: 'Total Claims',   value: stats?.totalClaims     || 0, icon: FileText,  iconBg: 'bg-slate-100',  iconColor: 'text-slate-600'   },
];

const PlatformDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/platform/stats')
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const insuranceRate = stats?.totalWorkers
    ? Math.round((stats.insuredWorkers / stats.totalWorkers) * 100)
    : 0;

  const tooltipStyle = {
    contentStyle: {
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      color: '#0f172a',
      fontSize: 13,
    },
  };

  const Skeleton = ({ className }) => <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="page-header">
          <h1 className="page-title">Platform Dashboard</h1>
          <p className="page-subtitle">
            {user?.company_name} — {user?.platform} insurance coverage overview
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            : STAT_CARDS(stats).map(({ label, value, icon: Icon, iconBg, iconColor }) => (
              <div key={label} className="kpi-card">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="kpi-label">{label}</p>
                  <p className="kpi-value text-2xl">{value}</p>
                </div>
              </div>
            ))
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Coverage rate radial */}
          <div className="card p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 self-start">Insurance Coverage Rate</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart cx="50%" cy="80%" innerRadius={60} outerRadius={90}
                data={[{ name: 'Insured', value: insuranceRate, fill: '#4f46e5' }]}
                startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" background={{ fill: '#f1f5f9' }} cornerRadius={8} />
                <Tooltip {...tooltipStyle} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-4xl font-bold text-primary-600 -mt-6">{loading ? '—' : `${insuranceRate}%`}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">of your workers are insured</p>
          </div>

          {/* Claims summary */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Claims Summary</h3>
            {loading ? (
              <div className="space-y-4"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
            ) : (
              <div className="space-y-5">
                {[
                  { label: 'Total Filed',    value: stats?.totalClaims || 0,  color: 'bg-primary-500' },
                  { label: 'Paid Out',       value: stats?.paidClaims  || 0,  color: 'bg-success-500' },
                  { label: 'Pending Review', value: (stats?.totalClaims || 0) - (stats?.paidClaims || 0), color: 'bg-warning-400' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[var(--color-text-secondary)]">{label}</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">{value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${stats?.totalClaims ? (value / stats.totalClaims) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Link to="/platform/workers" className="btn-primary flex-1 text-center text-sm py-2.5">
                View Workers <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/platform/claims" className="btn-secondary flex-1 text-center text-sm py-2.5">
                Claims Feed
              </Link>
            </div>
          </div>
        </div>

        {/* Premium Economics & Risk Register */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Platform Premium Economics</h3>
            <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
              <p>Current ecosystem snapshot based on average metrics:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs opacity-70">Weekly Pool (Est.)</p>
                  <p className="font-semibold text-lg text-primary-700">₹{(stats?.insuredWorkers || 0) * 25}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs opacity-70">Loss Ratio Target</p>
                  <p className="font-semibold text-lg text-success-700">65%</p>
                </div>
              </div>
              <p className="text-xs pt-2 italic opacity-80 border-t border-slate-100">
                Assumption: 100 users paying ₹25/week generates a ₹2,500 surplus. Maintaining a 60–70% loss ratio ensures sustainability against predictable weather disruptions.
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5">Live Risk Register</h3>
            <div className="space-y-3">
              {[
                { title: 'GPS Spoofing at Scale', action: 'Geo-velocity checks & device binding enabled.' },
                { title: 'Weather API Downtime', action: 'Fallback historical data sources active.' },
                { title: 'Low User Adoption', action: 'Subsidized premium campaign suggested for Platform Partners.' },
                { title: 'Model Drift (AI)', action: 'Quarterly Risk Model retraining cadence established.' },
              ].map(risk => (
                <div key={risk.title} className="text-sm border-l-2 border-danger-400 pl-3">
                  <p className="font-semibold text-[var(--color-text-primary)]">{risk.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{risk.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default PlatformDashboard;
