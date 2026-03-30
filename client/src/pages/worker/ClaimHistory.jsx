import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import ClaimTracker from '../../components/ClaimTracker';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷' };

const ClaimHistory = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/claim/my').then(r => setClaims(r.data.claims || [])).catch(() => toast.error('Failed to load claims')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="spinner scale-150" /></div>;

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6">
          <h1 className="section-title">Claim History</h1>
          <p className="section-sub">{claims.length} total claim{claims.length !== 1 ? 's' : ''}</p>
        </div>

        {claims.length === 0 ? (
          <div className="card border border-slate-800 text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400">No claims filed yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map(c => (
              <div key={c._id} className="card border border-slate-800 cursor-pointer" onClick={() => setExpanded(expanded === c._id ? null : c._id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{DISRUPTION_ICONS[c.disruption_type]}</span>
                    <div>
                      <p className="font-semibold text-white capitalize">{c.disruption_type?.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={c.status} />
                    <p className="text-xs text-slate-400 mt-1">₹{((c.amount_claimed || 0) / 100).toLocaleString('en-IN')}</p>
                    {c.status === 'paid' && <p className="text-xs text-emerald-400 font-semibold">✓ ₹{((c.amount_paid || 0) / 100).toLocaleString('en-IN')} paid</p>}
                  </div>
                </div>

                {expanded === c._id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                    <ClaimTracker status={c.status} rejectionReason={c.rejection_reason} />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-slate-500 text-xs">Fraud Score</p>
                        <p className={`font-semibold ${c.fraud_score < 30 ? 'text-emerald-400' : c.fraud_score < 60 ? 'text-amber-400' : 'text-red-400'}`}>{c.fraud_score}/100</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50">
                        <p className="text-slate-500 text-xs">Policy Tier</p>
                        <p className="font-semibold text-white capitalize">{c.policy_id?.premium_tier || '—'}</p>
                      </div>
                    </div>
                    {c.notes && <p className="text-sm text-slate-400 italic">"{c.notes}"</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageContent>
    </DashboardLayout>
  );
};

export default ClaimHistory;
