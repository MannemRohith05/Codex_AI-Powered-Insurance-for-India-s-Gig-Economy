/**
 * ClaimTracker — 5-Step AI Pipeline Progress Stepper
 *
 * Upgraded from original 3-step to match the full GigShield claim pipeline:
 *   1. Submitted          — Claim received
 *   2. Parametric Verify  — Weather oracle confirms zone trigger
 *   3. AI Scoring         — LightGBM fraud + Isolation Forest anomaly
 *   4. Decision           — Decision gate output
 *   5. Payout             — UPI payout initiated
 *
 * Also shows fraud_score, anomaly_score, ai_confidence per claim card.
 */
import { Check, XCircle, Cloud, Cpu, GitBranch, Banknote, FileText } from 'lucide-react';
import { cn } from '../utils/cn';

const STEPS = [
  { key: 'submitted',  label: 'Submitted',         icon: FileText  },
  { key: 'parametric', label: 'Parametric Verify',  icon: Cloud     },
  { key: 'ai_scoring', label: 'AI Scoring',         icon: Cpu       },
  { key: 'decision',   label: 'Decision',           icon: GitBranch },
  { key: 'payout',     label: 'Payout',             icon: Banknote  },
];

// Map claim status → active step index
const STATUS_STEP = {
  pending:      1,   // waiting for parametric verify
  under_review: 3,   // post AI scoring, at manual decision
  approved:     4,   // approved, awaiting payout
  paid:         5,   // fully paid
  rejected:    -1,
  flagged:      3,
};

// ── Confidence badge ───────────────────────────────────────────────────────────
const ConfidenceBadge = ({ score, label }) => {
  if (score === undefined || score === null) return null;
  const pct = Math.round(score * 100);
  const color = pct < 30 ? '#22c55e' : pct < 70 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 7px',
      background: `${color}18`, color, borderRadius: 99,
      border: `1px solid ${color}40`,
    }}>
      {label}: {pct}%
    </span>
  );
};

// ── Reason code chips ──────────────────────────────────────────────────────────
const ReasonChips = ({ codes = [] }) => {
  if (!codes.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {codes.map(c => (
        <span key={c} style={{
          fontSize: 9, fontWeight: 700, padding: '2px 6px',
          background: '#fff7ed', color: '#c2410c',
          borderRadius: 6, border: '1px solid #fed7aa',
        }}>{c}</span>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ClaimTracker = ({ status, rejectionReason, fraudScore, anomalyScore, aiConfidence, reasonCodes }) => {
  const currentStep = STATUS_STEP[status?.toLowerCase()] ?? 1;
  const isRejected  = status?.toLowerCase() === 'rejected';

  if (isRejected) {
    return (
      <div>
        <div className="rounded-lg p-3.5 bg-red-50 border border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-700">Claim Rejected by AI Decision Gate</p>
          </div>
          {rejectionReason && (
            <p className="text-xs text-red-600 mt-1 ml-6">{rejectionReason}</p>
          )}
          {fraudScore !== undefined && (
            <div className="flex gap-2 mt-2 ml-6 flex-wrap">
              <ConfidenceBadge score={fraudScore} label="Fraud Score" />
              {anomalyScore !== undefined && (
                <ConfidenceBadge score={Math.abs(anomalyScore)} label="Anomaly" />
              )}
            </div>
          )}
          <ReasonChips codes={reasonCodes} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Step pipeline ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {STEPS.map((step, idx) => {
          const stepNum = idx + 1;
          const done    = stepNum < currentStep;
          const active  = stepNum === currentStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex', alignItems: 'center',
                flex: idx < STEPS.length - 1 ? 1 : undefined,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {/* Circle */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  border: `2px solid ${done ? '#22c55e' : active ? '#6366f1' : '#e2e8f0'}`,
                  background: done ? '#22c55e' : active ? '#6366f1' : '#fff',
                  color: done || active ? '#fff' : '#94a3b8',
                  boxShadow: active ? '0 0 0 3px #e0e7ff' : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}>
                  {done
                    ? <Check size={13} strokeWidth={3} />
                    : <StepIcon size={12} />
                  }
                </div>
                {/* Label */}
                <span style={{
                  fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
                  color: done ? '#16a34a' : active ? '#4f46e5' : '#94a3b8',
                  textAlign: 'center', maxWidth: 60,
                  lineHeight: 1.2,
                }}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  height: 2, flex: 1,
                  background: done ? '#22c55e' : '#e2e8f0',
                  marginBottom: 20, marginLeft: 2, marginRight: 2,
                  transition: 'background 0.4s ease',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── AI Score indicators (shown when claim is past AI scoring) ── */}
      {currentStep >= 3 && (fraudScore !== undefined || aiConfidence !== undefined) && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: '#f8fafc', borderRadius: 10,
          border: '1px solid #e2e8f0',
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>AI Scores:</span>
          {fraudScore !== undefined && (
            <ConfidenceBadge score={fraudScore} label="Fraud" />
          )}
          {anomalyScore !== undefined && (
            <ConfidenceBadge score={Math.abs(anomalyScore)} label="Anomaly" />
          )}
          {aiConfidence !== undefined && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              background: '#eff6ff', color: '#1d4ed8', borderRadius: 99,
              border: '1px solid #bfdbfe',
            }}>
              Confidence: {Math.round(aiConfidence * 100)}%
            </span>
          )}
          <ReasonChips codes={reasonCodes} />
        </div>
      )}
    </div>
  );
};

export default ClaimTracker;
