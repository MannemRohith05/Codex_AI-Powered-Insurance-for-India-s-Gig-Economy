/**
 * ClaimHistory — expandable claim list with status tracker.
 */
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import ClaimTracker from '../../components/ClaimTracker';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';

const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷' };

const FraudScorePill = ({ score }) => {
  const color = score < 30 ? 'text-success-600' : score < 60 ? 'text-warning-600' : 'text-danger-600';
  return <span className={cn('font-semibold text-sm', color)}>{score}/100</span>;
};

const ClaimHistory = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/claim/my')
      .then(r => setClaims(r.data.claims || []))
      .catch(() => toast.error('Failed to load claims'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="page-header">
          <h1 className="page-title">Claim History</h1>
          {!loading && (
            <p className="page-subtitle">{claims.length} total claim{claims.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse h-20 rounded-xl bg-slate-100" />)}
          </div>
        ) : claims.length === 0 ? (
          <div className="card p-14 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-[var(--color-text-secondary)]">No claims filed yet</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Claims will appear here after you file them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map(c => (
              <div key={c._id} className="card overflow-hidden">
                {/* Summary row */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{DISRUPTION_ICONS[c.disruption_type] || '📋'}</span>
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)] capitalize">
                        {c.disruption_type?.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-[var(--color-text-muted)]">
                        ₹{((c.amount_claimed || 0) / 100).toLocaleString('en-IN')} claimed
                      </p>
                      {c.status === 'paid' && (
                        <p className="text-xs font-semibold text-success-600">
                          ✓ ₹{((c.amount_paid || 0) / 100).toLocaleString('en-IN')} paid
                        </p>
                      )}
                    </div>
                    <StatusBadge status={c.status} />
                    {expanded === c._id
                      ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                      : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === c._id && (
                  <div className="px-5 pb-5 border-t border-[var(--color-border)] pt-5 space-y-5">
                    <ClaimTracker status={c.status} rejectionReason={c.rejection_reason} />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-slate-50 border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Fraud Score</p>
                        <FraudScorePill score={c.fraud_score || 0} />
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Policy Tier</p>
                        <p className="font-semibold text-[var(--color-text-primary)] capitalize">
                          {c.policy_id?.premium_tier || '—'}
                        </p>
                      </div>
                    </div>
                    {c.notes && (
                      <p className="text-sm text-[var(--color-text-muted)] italic border-l-2 border-[var(--color-border)] pl-3">
                        "{c.notes}"
                      </p>
                    )}
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
