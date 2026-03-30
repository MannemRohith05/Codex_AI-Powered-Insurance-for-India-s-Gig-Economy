import { CheckCircle } from 'lucide-react';

const STEPS = [
  { key: 'submitted',  label: 'Submitted' },
  { key: 'reviewing',  label: 'Reviewing' },
  { key: 'approved',   label: 'Approved'  },
];

const STATUS_STEP = {
  pending:   0,
  reviewing: 1,
  approved:  2,
  rejected:  -1,
  flagged:   0,
};

const ClaimTracker = ({ status, rejectionReason }) => {
  const currentStep = STATUS_STEP[status?.toLowerCase()] ?? 0;
  const isRejected = status?.toLowerCase() === 'rejected';

  if (isRejected) {
    return (
      <div
        className="rounded-lg p-3 text-xs"
        style={{
          background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.20)',
        }}
      >
        <p className="font-semibold" style={{ color: '#fb7185' }}>❌ Claim Rejected</p>
        {rejectionReason && (
          <p className="mt-0.5" style={{ color: 'rgba(251,113,133,0.70)' }}>{rejectionReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, idx) => {
        const done   = idx < currentStep;
        const active = idx === currentStep;
        const pending = idx > currentStep;

        return (
          <div key={step.key} className="flex items-center" style={{ flex: idx < STEPS.length - 1 ? 1 : 'none' }}>
            <div className="flex flex-col items-center gap-1 step-pop" style={{ animationDelay: `${idx * 0.08}s` }}>
              <div
                className="step-dot"
                style={
                  done   ? { background: 'linear-gradient(135deg,#00d9c0,#00a896)', borderColor: '#00d9c0', color: '#050812', width: 24, height: 24, fontSize: 11, boxShadow: '0 0 12px rgba(0,217,192,0.45)' } :
                  active ? { background: 'linear-gradient(135deg,#ff8c5a,#ff6b35)', borderColor: '#ff6b35', color: '#fff',    width: 24, height: 24, fontSize: 11, boxShadow: '0 0 14px rgba(255,107,53,0.55)' } :
                           { background: 'rgba(15,23,42,0.80)', borderColor: 'rgba(100,116,139,0.25)', color: 'rgba(100,116,139,0.45)', width: 24, height: 24, fontSize: 11 }
                }
              >
                {done ? <CheckCircle className="w-3 h-3" /> : idx + 1}
              </div>
              <span className="text-xs whitespace-nowrap" style={{
                color: done ? '#00d9c0' : active ? '#ff8c5a' : 'rgba(100,116,139,0.45)',
                fontSize: 9, fontWeight: active || done ? 700 : 400,
              }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className="step-line"
                style={{
                  background: done
                    ? 'linear-gradient(90deg, #00d9c0, #ff6b35)'
                    : 'rgba(100,116,139,0.18)',
                  height: 2,
                  flex: 1,
                  marginBottom: 16,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClaimTracker;
