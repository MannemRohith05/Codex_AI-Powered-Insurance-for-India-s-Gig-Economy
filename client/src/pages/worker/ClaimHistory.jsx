/**
 * ClaimHistory — expandable claim list with status tracker.
 *
 * Section B (Plan): Real-time payout polling.
 * PayoutStatusBadge polls /api/claim/my every 3 seconds while a claim
 * is in `approved` state (payout being processed). Transitions to
 * "✓ Paid" when status flips to `paid`. Auto-stops after 60 s.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import ClaimTracker from '../../components/ClaimTracker';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷', heavy_rain: '⛈️' };

const FraudScorePill = ({ score }) => {
  const color = score < 30 ? 'text-success-600' : score < 60 ? 'text-warning-600' : 'text-danger-600';
  return <span className={cn('font-semibold text-sm', color)}>{score}/100</span>;
};

/**
 * PayoutStatusBadge
 *
 * Shows a live animated "Processing payout…" spinner while a claim is
 * `approved` (not yet `paid`). Polls the parent's claim list every 3 s
 * and calls onPaid(claimId) when the backend confirms `paid` status.
 * Auto-stops polling after 60 seconds.
 */
const PayoutStatusBadge = ({ claim, onPaid }) => {
  const [localStatus, setLocalStatus] = useState(claim.status);
  const [amountPaid, setAmountPaid]   = useState(claim.amount_paid || claim.claim_amount_inr || 0);
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);
  const stopped     = useRef(false);

  const stopPolling = useCallback(() => {
    stopped.current = true;
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    // Only poll while status is `approved` (payout not yet confirmed)
    if (claim.status !== 'approved') {
      setLocalStatus(claim.status);
      return;
    }

    const poll = async () => {
      if (stopped.current) return;
      try {
        const res = await api.get('/claim/my');
        const updated = (res.data.claims || []).find(c => c._id === claim._id);
        if (updated?.status === 'paid') {
          setLocalStatus('paid');
          setAmountPaid(updated.amount_paid || updated.claim_amount_inr || amountPaid);
          stopPolling();
          onPaid?.(claim._id, updated);
        }
      } catch (_) { /* non-fatal — keep polling */ }
    };

    intervalRef.current = setInterval(poll, 3000);
    // Auto-stop after 60 s to avoid infinite polling
    timeoutRef.current  = setTimeout(stopPolling, 60_000);

    return () => stopPolling();
  }, [claim._id, claim.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (localStatus === 'paid') {
    const inrAmount = amountPaid > 1000
      ? Math.round(amountPaid / 100)   // stored in paise
      : amountPaid;                      // already in INR
    return (
      <div className="flex items-center gap-1.5 text-success-700 font-semibold text-sm animate-fade-in">
        <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
        <span>✓ Paid — ₹{inrAmount.toLocaleString('en-IN')}</span>
      </div>
    );
  }

  if (localStatus === 'approved') {
    return (
      <div className="flex items-center gap-1.5 text-amber-700 text-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span className="font-medium">Processing payout…</span>
        <span className="text-[10px] text-amber-500 animate-pulse">●</span>
      </div>
    );
  }

  // Fallback for all other statuses — defer to standard StatusBadge
  return <StatusBadge status={localStatus} />;
};

// ── Main component ─────────────────────────────────────────────────────────────
const ClaimHistory = () => {
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  const loadClaims = useCallback(() =>
    api.get('/claim/my')
      .then(r  => setClaims(r.data.claims || []))
      .catch(() => toast.error('Failed to load claims'))
      .finally(() => setLoading(false)),
  []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  // Called by PayoutStatusBadge when a claim transitions to `paid`
  const handlePaid = useCallback((claimId, updatedClaim) => {
    setClaims(prev => prev.map(c => c._id === claimId ? { ...c, ...updatedClaim } : c));
    toast.success('🎉 Payout confirmed! Funds transferred to your UPI ID.', { autoClose: 6000 });
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
                        {c.disruption_type?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Amount col */}
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-[var(--color-text-muted)]">
                        ₹{c.claim_amount_inr?.toLocaleString('en-IN')
                          || Math.round((c.amount_claimed || 0) / 100).toLocaleString('en-IN')} claimed
                      </p>
                    </div>

                    {/* Live payout badge — replaces static StatusBadge for approved/paid */}
                    {(c.status === 'approved' || c.status === 'paid') ? (
                      <PayoutStatusBadge claim={c} onPaid={handlePaid} />
                    ) : (
                      <StatusBadge status={c.status} />
                    )}

                    {expanded === c._id
                      ? <ChevronUp   className="w-4 h-4 text-[var(--color-text-muted)]" />
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
                      {c.razorpay_payout_id && (
                        <div className="col-span-2 p-3 rounded-lg bg-success-50 border border-success-200">
                          <p className="text-xs text-success-700 mb-1 font-medium">Razorpay Payout ID</p>
                          <p className="font-mono text-xs text-success-800 truncate">{c.razorpay_payout_id}</p>
                        </div>
                      )}
                      {c.settlement_date && (
                        <div className="col-span-2 p-3 rounded-lg bg-slate-50 border border-[var(--color-border)]">
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">Settlement Date</p>
                          <p className="text-sm font-medium">
                            {new Date(c.settlement_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>

                    {c.reason_codes?.length > 0 && (
                      <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
                        <p className="text-xs font-semibold text-danger-700 mb-1">Fraud Flags</p>
                        <ul className="space-y-0.5">
                          {c.reason_codes.map((r, i) => (
                            <li key={i} className="text-xs text-danger-600">• {r.replace(/_/g, ' ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}

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
