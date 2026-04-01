/**
 * Worker Dashboard — the primary screen after login.
 * Priority hierarchy:
 * 1. Protection status (hero — most important signal)
 * 2. Live weather threats (actionable)
 * 3. Smart alert / upsell CTA
 * 4. Recent claims (historical context)
 */
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { ShieldCheck, ShieldOff, CloudRain, ThermometerSun, AlertTriangle, Bell, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

// ── Skeleton loader ──────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />
);

// ── Status badge for claims ──────────────────────────────────
const ClaimStatusBadge = ({ status }) => {
  if (status === 'approved') return (
    <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> Approved</span>
  );
  if (status === 'pending') return (
    <span className="badge-warning"><Clock className="w-3 h-3" /> Pending</span>
  );
  return (
    <span className="badge-danger"><XCircle className="w-3 h-3" /> Rejected</span>
  );
};

// ── Weather risk card ────────────────────────────────────────
const ThreatCard = ({ icon: Icon, title, value, subtitle, level }) => {
  const levelStyles = {
    high:   'border-danger-200  bg-danger-50  text-danger-700',
    medium: 'border-warning-200 bg-warning-50 text-warning-700',
    low:    'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]',
  };
  const iconColors = {
    high:   'text-danger-500',
    medium: 'text-warning-500',
    low:    'text-slate-400',
  };
  return (
    <div className={cn('card p-5 border', levelStyles[level] || levelStyles.low)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{title}</p>
        <Icon className={cn('w-5 h-5', iconColors[level] || iconColors.low)} />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs mt-1 opacity-80">{subtitle}</p>
      {level === 'high' && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Active alert — coverage triggered
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/policy/my').catch(() => ({ data: {} })),
      api.get('/claim/my').catch(() => ({ data: { claims: [] } })),
    ]).then(([policyRes, claimRes]) => {
      setData({
        policy: policyRes.data.policies?.find(p => p.status === 'active') || null,
        claims: claimRes.data.claims?.slice(0, 5) || [],
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="page-subtitle mt-0.5">Here's your protection status for today.</p>
          </div>
          <Link to="/worker/buy-policy" className="btn-secondary shrink-0 text-sm">
            Manage Plan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Hero: protection status ── */}
        {loading ? (
          <Skeleton className="h-28 mb-6 rounded-xl" />
        ) : data?.policy ? (
          <div className="mb-6 rounded-xl border border-success-200 bg-success-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-success-100 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-success-800">
                  Actively Protected — {data.policy.premium_tier?.charAt(0).toUpperCase() + data.policy.premium_tier?.slice(1)} Plan
                </p>
                <p className="text-sm text-success-600">
                  Valid until {new Date(data.policy.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-success-600 font-medium">Auto-claim on disruption</p>
              <span className="badge-success mt-1">● Live</span>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-warning-200 bg-warning-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-warning-100 rounded-xl flex items-center justify-center shrink-0">
                <ShieldOff className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <p className="font-semibold text-warning-800">No active coverage</p>
                <p className="text-sm text-warning-600">You're not protected against income loss from disruptions.</p>
              </div>
            </div>
            <Link to="/worker/buy-policy" className="btn-primary shrink-0 text-sm">
              Get Protected
            </Link>
          </div>
        )}

        {/* ── Weather threats ── */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--color-text-muted)]" />
            Live Threat Monitor
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ThreatCard icon={CloudRain}       title="Precipitation" value="Alert"   subtitle="Heavy rain expected at 4:00 PM." level="high"   />
            <ThreatCard icon={ThermometerSun}  title="Heat Index"    value="34°C"    subtitle="Normal levels. No action needed." level="low"  />
            <ThreatCard icon={AlertTriangle}   title="Air Quality"   value="AQI 142" subtitle="Moderate — no coverage triggered."  level="medium" />
          </div>
        </div>

        {/* ── Upsell CTA (loss aversion) ── */}
        <div className="mb-6 card border-orange-200 bg-orange-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-900 text-sm">Severe weather forecast for tomorrow</p>
              <p className="text-xs text-orange-700 mt-0.5">Protect your shift before premiums increase. Estimated income at risk: <strong>₹800</strong></p>
            </div>
          </div>
          <Link to="/worker/buy-policy" className="btn shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg">
            Protect for ₹35
          </Link>
        </div>

        {/* ── Recent claims ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Recent Claims</h2>
            <Link to="/worker/claims" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : data?.claims?.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.claims.map(claim => (
                      <tr key={claim._id}>
                        <td className="font-mono text-xs text-[var(--color-text-primary)]">#{claim._id?.slice(-6).toUpperCase()}</td>
                        <td className="capitalize">{claim.disruption_type || 'N/A'}</td>
                        <td>{new Date(claim.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="font-semibold text-[var(--color-text-primary)]">
                          {claim.payout_amount ? `₹${claim.payout_amount}` : '—'}
                        </td>
                        <td><ClaimStatusBadge status={claim.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No claims filed yet.</p>
              <Link to="/worker/submit-claim" className="btn-primary mt-4 inline-flex">File a Claim</Link>
            </div>
          )}
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default Dashboard;
