/**
 * Worker Dashboard — the primary screen after login.
 * Priority hierarchy:
 * 1. Protection status with waiting period awareness (most critical signal)
 * 2. AI Risk Profile with contributing factors breakdown
 * 3. Live weather threats (actionable)
 * 4. Monthly claim cap status
 * 5. Recent claims with AI status + settlement date
 */
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import {
  ShieldCheck, ShieldOff, CloudRain, ThermometerSun, AlertTriangle, Bell,
  CheckCircle2, Clock, XCircle, ArrowRight, TrendingUp, Calendar, BarChart2,
  Info, Clapperboard, Wallet, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDemo } from '../../context/DemoContext';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

// ── Skeleton loader ──────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />
);

// ── Status badge for claims ──────────────────────────────────
const ClaimStatusBadge = ({ status }) => {
  if (status === 'approved' || status === 'paid') return (
    <span className="badge-success"><CheckCircle2 className="w-3 h-3" /> {status === 'paid' ? 'Paid' : 'Approved'}</span>
  );
  if (status === 'under_review') return (
    <span className="badge-warning"><Clock className="w-3 h-3" /> In Review</span>
  );
  return (
    <span className="badge-danger"><XCircle className="w-3 h-3" /> {status === 'rejected' ? 'Rejected' : 'Submitted'}</span>
  );
};

// ── AI Status badge ──────────────────────────────────────────
const AIStatusBadge = ({ status }) => {
  const label = status || 'PENDING';
  const normalized = label.toUpperCase().replace('-', '_');
  if (normalized === 'AUTO_APPROVED' || normalized === 'AUTO-APPROVED') return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success-100 text-success-700">✓ AI Approved</span>
  );
  if (normalized === 'FLAGGED') return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-danger-100 text-danger-700">⚑ Flagged</span>
  );
  if (normalized === 'MANUAL_REVIEW') return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">👁 Manual Review</span>
  );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">— Pending</span>
  );
};

// ── Contributing factor impact pill ─────────────────────────
const ImpactPill = ({ impact }) => {
  const map = {
    HIGH:   'bg-red-100 text-red-700',
    MEDIUM: 'bg-orange-100 text-orange-700',
    LOW:    'bg-slate-100 text-slate-600',
  };
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider', map[impact] || map.LOW)}>
      {impact}
    </span>
  );
};

// ── Weather risk card ────────────────────────────────────────
const ThreatCard = ({ icon: Icon, title, value, subtitle, level }) => {
  const levelStyles = {
    high:   'border-danger-200  bg-danger-50  text-danger-700',
    medium: 'border-warning-200 bg-warning-50 text-warning-700',
    low:    'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]',
  };
  const iconColors = { high: 'text-danger-500', medium: 'text-warning-500', low: 'text-slate-400' };
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

// ── Main component ────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { demoMode, toggleDemo, activeScenario, setScenario, DEMO_SCENARIOS } = useDemo();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/policy/status').catch(() => api.get('/policy/my').catch(() => ({ data: {} }))),
      api.get('/claim/my').catch(() => ({ data: { claims: [] } })),
      api.get('/worker/risk-score').catch(() => ({ data: { risk_score: null } })),
    ]).then(([policyRes, claimRes, riskRes]) => {
      // Handle both /status and /my responses
      const pData = policyRes.data;
      const policy = pData.policy_id ? pData           // /status response
        : pData.policies?.find(p => p.status === 'active') || null; // /my response

      setData({
        policy,
        claims:   claimRes.data.claims?.slice(0, 5) || [],
        risk:     riskRes.data || null,
      });
    }).finally(() => setLoading(false));
  }, []);

  const waitingActive = data?.policy?.waiting_period_active ||
    (data?.policy?.waiting_period_end_date && new Date() < new Date(data.policy.waiting_period_end_date));

  const waitingEnd = data?.policy?.waiting_period_end_date;

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
          <div className="flex items-center gap-2 shrink-0">
            {/* Demo Mode toggle — for judges/reviewers */}
            <div className="flex items-center gap-1.5">
              {demoMode && (
                <select
                  value={activeScenario}
                  onChange={e => setScenario(e.target.value)}
                  className="text-xs border border-amber-300 bg-amber-50 text-amber-800 rounded-lg px-2 py-1.5 font-medium focus:outline-none"
                >
                  {Object.entries(DEMO_SCENARIOS).map(([key, s]) => (
                    <option key={key} value={key}>{s.label}</option>
                  ))}
                </select>
              )}
              <button
                onClick={toggleDemo}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                  demoMode
                    ? 'bg-amber-500 border-amber-400 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
                )}
                title={demoMode ? 'Exit demo mode' : 'Activate demo mode for presentation'}
              >
                🎬 {demoMode ? 'Exit Demo' : 'Demo Mode'}
              </button>
            </div>
            <Link to="/worker/buy-policy" className="btn-secondary text-sm">
              Manage Plan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Hero: protection status + waiting period ── */}
        {loading ? (
          <Skeleton className="h-28 mb-6 rounded-xl" />
        ) : data?.policy ? (
          <div className={cn(
            'mb-6 rounded-xl border p-5 flex flex-col gap-3',
            waitingActive
              ? 'border-blue-200 bg-blue-50'
              : 'border-success-200 bg-success-50'
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                  waitingActive ? 'bg-blue-100' : 'bg-success-100'
                )}>
                  {waitingActive
                    ? <Clock className="w-6 h-6 text-blue-600" />
                    : <ShieldCheck className="w-6 h-6 text-success-600" />}
                </div>
                <div>
                  <p className={cn('font-semibold', waitingActive ? 'text-blue-800' : 'text-success-800')}>
                    {waitingActive
                      ? 'Waiting Period Active — Claims Not Yet Eligible'
                      : `Actively Protected — ${(data.policy.premium_tier || data.policy.risk_tier || 'medium')?.charAt(0).toUpperCase() + (data.policy.premium_tier || data.policy.risk_tier || 'medium')?.slice(1).toLowerCase()} Plan`}
                  </p>
                  <p className={cn('text-sm', waitingActive ? 'text-blue-600' : 'text-success-600')}>
                    {waitingActive && waitingEnd
                      ? `Claims eligible from ${new Date(waitingEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : data.policy.next_renewal_date || data.policy.end_date
                        ? `Valid until ${new Date(data.policy.next_renewal_date || data.policy.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Active policy'}
                  </p>
                </div>
              </div>
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                <p className={cn('text-xs font-medium', waitingActive ? 'text-blue-600' : 'text-success-600')}>
                  {waitingActive ? '7-day waiting period' : 'Auto-claim on disruption'}
                </p>
                <span className={waitingActive ? 'badge-warning mt-1' : 'badge-success mt-1'}>
                  {waitingActive ? '⏳ Waiting' : '● Live'}
                </span>
              </div>
            </div>

            {/* Claims usage bar */}
            {!waitingActive && (
              <div className="pt-2 border-t border-success-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-success-700 font-medium">Monthly claims used</p>
                  <p className="text-xs text-success-700 font-bold">
                    {data.policy.claims_this_month ?? 0} / {data.policy.max_claims_allowed ?? 2}
                  </p>
                </div>
                <div className="h-1.5 bg-success-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success-500 rounded-full transition-all"
                    style={{ width: `${((data.policy.claims_this_month ?? 0) / (data.policy.max_claims_allowed ?? 2)) * 100}%` }}
                  />
                </div>
              </div>
            )}
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

        {/* ── This Week at a Glance ── */}
        {!loading && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Earnings protected this week */}
            <div className="card p-5 border border-emerald-200 bg-emerald-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Earnings Protected This Week</p>
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {(() => {
                  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                  const earned = (data?.claims || []).filter(c =>
                    (c.status === 'paid' || c.status === 'approved') &&
                    new Date(c.createdAt) >= sevenDaysAgo
                  ).reduce((s, c) => s + (c.claim_amount_inr || 0), 0);
                  return `₹${earned.toLocaleString('en-IN')}`;
                })()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">From approved claims (last 7 days)</p>
            </div>

            {/* Active coverage amount */}
            <div className="card p-5 border border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Active Coverage</p>
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {data?.policy?.coverage_amount
                  ? `₹${Number(data.policy.coverage_amount).toLocaleString('en-IN')}`
                  : data?.policy ? 'Active' : 'None'}
              </p>
              <p className="text-xs text-blue-600 mt-1 capitalize">
                {data?.policy
                  ? `${(data.policy.premium_tier || 'medium')} plan • per event`
                  : 'No active policy'}
              </p>
            </div>

            {/* Weekly claim usage */}
            <div className="card p-5 border border-violet-200 bg-violet-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Weekly Summary</p>
                <BarChart2 className="w-4 h-4 text-violet-500" />
              </div>
              <p className="text-2xl font-bold text-violet-900">
                {(() => {
                  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                  return (data?.claims || []).filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
                })()} <span className="text-sm font-normal text-violet-600">claim(s)</span>
              </p>
              <p className="text-xs text-violet-600 mt-1">Filed this week</p>
            </div>
          </div>
        )}

        {/* ── Weather threats + AI Risk Profile (side by side) ── */}}
        <div className="mb-6 grid gap-6 lg:grid-cols-5">
          {/* Weather threats — 3 cols */}
          <div className="lg:col-span-3">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--color-text-muted)]" />
              Live Threat Monitor
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <ThreatCard icon={CloudRain}      title="Precipitation" value="Alert"   subtitle="Heavy rain expected at 4:00 PM." level="high"   />
              <ThreatCard icon={ThermometerSun} title="Heat Index"    value="34°C"    subtitle="Normal levels."                  level="low"    />
              <ThreatCard icon={AlertTriangle}  title="Air Quality"   value="AQI 142" subtitle="Moderate — no coverage triggered." level="medium" />
            </div>
          </div>

          {/* AI Risk Profile — 2 cols with contributing factors */}
          <div className="lg:col-span-2">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[var(--color-text-muted)]" />
              AI Risk Profile
            </h2>
            {loading ? (
              <Skeleton className="h-[160px] rounded-xl" />
            ) : (
              <div className="card p-5 border border-primary-200 bg-primary-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 opacity-80">Risk Tier</p>
                    <p className="text-2xl font-bold tracking-tight text-primary-900 capitalize">
                      {(data?.risk?.risk_tier || 'Unknown').toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-primary-700">Score</p>
                    <p className="text-xl font-bold text-primary-800">{data?.risk?.risk_score ?? '--'}<span className="text-xs font-normal">/100</span></p>
                  </div>
                </div>
                {/* Contributing factors */}
                {data?.risk?.contributing_factors?.length > 0 && (
                  <div className="space-y-1.5 border-t border-primary-200 pt-3">
                    {data.risk.contributing_factors.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <p className="text-xs text-primary-700 capitalize truncate max-w-[60%]">
                          {f.feature.replace(/_/g, ' ')}
                        </p>
                        <ImpactPill impact={f.impact} />
                      </div>
                    ))}
                  </div>
                )}
                {data?.risk?.premium_recommendation_inr && (
                  <p className="text-xs text-primary-600 mt-3 font-medium">
                    Recommended premium: ₹{data.risk.premium_recommendation_inr}/week
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Upsell CTA ── */}
        <div className="mb-6 card border-orange-200 bg-orange-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-900 text-sm">Severe weather forecast for tomorrow</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Protect your shift before premiums increase. Estimated income at risk: <strong>₹800</strong>
              </p>
            </div>
          </div>
          <Link to="/worker/buy-policy" className="btn shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg">
            Protect for ₹35
          </Link>
        </div>

        {/* ── Phase 2: Quick Access ── */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/worker/dynamic-premium" className="flex items-center gap-4 rounded-xl border border-violet-200 bg-violet-50 p-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-violet-900">AI Premium Calculator</p>
              <p className="text-xs text-violet-600 mt-0.5">View live breakdown of your weekly premium</p>
            </div>
            <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/worker/zero-touch-claims" className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-emerald-900">Zero-Touch Auto-Claims</p>
              <p className="text-xs text-emerald-600 mt-0.5">5 automated disruption triggers — one tap to claim</p>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
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
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : data?.claims?.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Loss Declared</th>
                      <th>Payout</th>
                      <th>AI Review</th>
                      <th>Status</th>
                      <th>Settlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.claims.map(claim => (
                      <tr key={claim._id}>
                        <td className="font-mono text-xs text-[var(--color-text-primary)]">
                          #{claim._id?.slice(-6).toUpperCase()}
                        </td>
                        <td className="capitalize">{(claim.disruption_type || 'N/A').replace('_', ' ')}</td>
                        <td>{new Date(claim.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="text-[var(--color-text-secondary)]">
                          {claim.declared_income_loss_inr ? `₹${claim.declared_income_loss_inr.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="font-semibold text-[var(--color-text-primary)]">
                          {claim.claim_amount_inr
                            ? `₹${claim.claim_amount_inr.toLocaleString('en-IN')}`
                            : claim.amount_claimed
                              ? `₹${Math.round(claim.amount_claimed / 100).toLocaleString('en-IN')}`
                              : '—'}
                        </td>
                        <td><AIStatusBadge status={claim.ai_status} /></td>
                        <td><ClaimStatusBadge status={claim.status} /></td>
                        <td className="text-xs text-[var(--color-text-secondary)]">
                          {claim.settlement_date
                            ? new Date(claim.settlement_date).toLocaleDateString('en-IN')
                            : claim.status === 'approved' || claim.status === 'paid' ? 'Initiated' : '—'}
                        </td>
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
