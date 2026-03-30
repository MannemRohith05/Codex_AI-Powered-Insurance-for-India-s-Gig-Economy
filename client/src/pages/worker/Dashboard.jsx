import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import ClaimTracker from '../../components/ClaimTracker';
import {
  Shield, TrendingUp, CloudRain, AlertTriangle, Plus, History,
  CheckCircle, XCircle, Zap, Bike, Wallet, Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷' };

const KPICard = ({ label, value, sub, icon, accentClass, glowColor }) => (
  <div
    className={`card tilt-card float-in ${accentClass || ''}`}
    style={{ borderColor: glowColor ? `${glowColor}22` : undefined }}
  >
    <div className="flex items-start gap-3">
      <div
        className="icon-badge p-3 rounded-xl"
        style={{
          background: glowColor ? `${glowColor}18` : 'rgba(255,107,53,0.12)',
          border: `1px solid ${glowColor ? glowColor + '25' : 'rgba(255,107,53,0.20)'}`,
          color: glowColor || '#ff6b35',
          fontSize: 20,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p className="kpi-value mt-0.5">{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.45)' }}>{sub}</p>}
      </div>
    </div>
  </div>
);

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/worker/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <span className="text-sm" style={{ color: 'rgba(148,163,184,0.55)' }}>Loading GigShield...</span>
      </div>
    </div>
  );

  const { worker, activePolicy, recentClaims, activeDisruptions, weekEarnings } = data || {};
  const riskScore = worker?.risk_score || 0;
  const riskColor = riskScore < 30 ? '#00d9c0' : riskScore < 60 ? '#fbbf24' : '#f43f5e';

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        {/* Welcome Header */}
        <div className="mb-7 float-in-1">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="section-accent-line" />
              <h1 className="hero-title" style={{ fontSize: '1.7rem', fontFamily: 'var(--font-display)' }}>
                <span style={{ marginRight: 8 }}>🛵</span>
                Welcome back, <span className="gradient-text">{worker?.name || 'Partner'}</span>!
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(148,163,184,0.50)' }}>
                {worker?.platform} • {worker?.city} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {activePolicy && (
              <Link to="/worker/submit-claim" className="btn-primary flex items-center gap-2">
                <Zap className="w-4 h-4" /> Claim Now
              </Link>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            label="Risk Score" value={riskScore} sub="out of 100"
            icon={<span style={{ color: riskColor, fontSize: 18 }}>⚡</span>}
            glowColor={riskColor}
          />
          <KPICard
            label="Policy Status" value={activePolicy ? 'Active' : 'None'}
            sub={activePolicy ? `₹${(activePolicy.coverage_amount / 100).toLocaleString('en-IN')} coverage` : 'Buy a policy'}
            icon={<Shield className="w-5 h-5" />}
            glowColor={activePolicy ? '#00d9c0' : '#64748b'}
          />
          <KPICard
            label="Total Claims" value={recentClaims?.length || 0} sub="in history"
            icon={<History className="w-5 h-5" />}
            glowColor="#ff6b35"
          />
          <KPICard
            label="Week Earnings" value={`₹${(weekEarnings || 0).toLocaleString('en-IN')}`} sub="last 7 days"
            icon={<Wallet className="w-5 h-5" />}
            glowColor="#a855f7"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active Policy Card */}
            <div className="card float-in-2" style={{ padding: '24px' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="icon-badge icon-badge-teal p-2 rounded-lg"><Shield className="w-4 h-4" /></div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Insurance Policy</h2>
                </div>
                {!activePolicy && (
                  <Link to="/worker/buy-policy" className="btn-primary text-xs py-1.5 px-3">Buy Policy</Link>
                )}
              </div>

              {activePolicy ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <StatusBadge status="active" />
                    <p className="text-sm mt-3" style={{ color: 'rgba(148,163,184,0.60)' }}>
                      Tier: <span style={{ color: '#f1f5f9', fontWeight: 700 }} className="capitalize">{activePolicy.premium_tier}</span>
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,0.60)' }}>
                      Premium: <span style={{ color: '#ff8c5a', fontWeight: 600 }}>₹{(activePolicy.premium_amount / 100).toLocaleString('en-IN')}/month</span>
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,0.60)' }}>
                      Coverage: <span style={{ color: '#00d9c0', fontWeight: 700 }}>₹{(activePolicy.coverage_amount / 100).toLocaleString('en-IN')}/event</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.35)' }}>
                      Valid till: {new Date(activePolicy.end_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  {/* Coverage big number */}
                  <div className="text-right p-4 rounded-xl" style={{
                    background: 'rgba(0,217,192,0.06)', border: '1px solid rgba(0,217,192,0.15)',
                    minWidth: 140,
                  }}>
                    <p className="text-xs mb-1" style={{ color: 'rgba(0,217,192,0.55)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coverage</p>
                    <p className="coverage-amount">₹{Math.round(activePolicy.coverage_amount / 100).toLocaleString('en-IN')}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(0,217,192,0.45)' }}>per event</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,107,53,0.25)' }} />
                  <p style={{ color: 'rgba(148,163,184,0.50)', fontSize: 14 }}>No active policy</p>
                  <p style={{ color: 'rgba(148,163,184,0.35)', fontSize: 12, marginTop: 4 }}>Get covered today and protect your income!</p>
                </div>
              )}
            </div>

            {/* Recent Claims */}
            <div className="card float-in-3" style={{ padding: '24px' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="icon-badge icon-badge-orange p-2 rounded-lg"><History className="w-4 h-4" /></div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Recent Claims</h2>
                </div>
                <Link to="/worker/claims" className="text-xs font-semibold transition-colors"
                  style={{ color: '#00d9c0' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00f5dd'}
                  onMouseLeave={e => e.currentTarget.style.color = '#00d9c0'}>
                  View all →
                </Link>
              </div>
              {recentClaims?.length ? (
                <div className="space-y-3">
                  {recentClaims.slice(0, 3).map(c => (
                    <div key={c._id} className="p-3 rounded-xl" style={{ background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.08)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold capitalize" style={{ color: '#e2e8f0' }}>
                          {DISRUPTION_ICONS[c.disruption_type]} {c.disruption_type?.replace('_', ' ')}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'rgba(148,163,184,0.50)' }}>
                        <span>₹{((c.amount_claimed || 0) / 100).toLocaleString('en-IN')} claimed</span>
                        <span>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <ClaimTracker status={c.status} rejectionReason={c.rejection_reason} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: 'rgba(148,163,184,0.40)', fontSize: 14 }}>No claims filed yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Verification Status */}
            <div className="card float-in-2" style={{ padding: '20px' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="icon-badge icon-badge-amber p-2 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>Verification</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Phone', verified: worker?.phone_verified },
                  { label: 'Aadhaar KYC', verified: worker?.aadhaar_verified },
                  { label: 'Platform', verified: worker?.platform_verified },
                ].map(({ label, verified }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'rgba(148,163,184,0.60)' }}>{label}</span>
                    {verified
                      ? <CheckCircle className="w-4 h-4" style={{ color: '#00d9c0' }} />
                      : <XCircle className="w-4 h-4" style={{ color: 'rgba(100,116,139,0.40)' }} />
                    }
                  </div>
                ))}
              </div>
              {!worker?.aadhaar_verified && (
                <Link to="/worker/kyc" className="btn-primary w-full text-sm mt-4 py-2 flex items-center justify-center gap-1">
                  Complete KYC →
                </Link>
              )}
            </div>

            {/* Active Disruptions */}
            <div className="card float-in-3" style={{ padding: '20px' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="icon-badge icon-badge-rose p-2 rounded-lg pulse-ring"><CloudRain className="w-4 h-4" /></div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>Active Disruptions</h2>
              </div>
              {activeDisruptions?.length ? (
                <div className="space-y-2">
                  {activeDisruptions.map(d => (
                    <div key={d._id}
                      className={`p-3 rounded-xl border ${d.type === 'rain' ? 'disruption-rain' : d.type === 'heatwave' ? 'disruption-heat' : d.type === 'flood' ? 'disruption-flood' : 'disruption-aqi'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{DISRUPTION_ICONS[d.type]}</span>
                        <div>
                          <p className="text-sm font-semibold capitalize" style={{ color: '#e2e8f0' }}>{d.type?.replace('_', ' ')}</p>
                          <p className="text-xs" style={{ color: 'rgba(148,163,184,0.50)' }}>{d.city} • Severity: {d.severity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activePolicy && (
                    <Link to="/worker/submit-claim"
                      className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{ background: 'rgba(255,107,53,0.10)', border: '1px solid rgba(255,107,53,0.22)', color: '#ff8c5a' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.10)'; }}
                    >
                      <Plus className="w-4 h-4" /> File Disruption Claim
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: 'rgba(148,163,184,0.40)' }}>No active disruptions 🌤️</p>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default WorkerDashboard;
