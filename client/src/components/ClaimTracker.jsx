/**
 * ClaimTracker — step progress indicator.
 * Pure Tailwind, no inline styles.
 */
import { Check, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'approved',  label: 'Approved'  },
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
      <div className="rounded-lg p-3.5 bg-danger-50 border border-danger-200">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-danger-600" />
          <p className="text-sm font-semibold text-danger-700">Claim Rejected</p>
        </div>
        {rejectionReason && (
          <p className="text-xs text-danger-600 mt-1 ml-6">{rejectionReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, idx) => {
        const done   = idx < currentStep;
        const active = idx === currentStep;

        return (
          <div key={step.key} className={cn('flex items-center', idx < STEPS.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              {/* Dot */}
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                done   ? 'bg-success-500 border-success-500 text-white'   :
                active ? 'bg-primary-600 border-primary-600 text-white'   :
                         'bg-white border-[var(--color-border)] text-[var(--color-text-muted)]'
              )}>
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : idx + 1}
              </div>
              {/* Label */}
              <span className={cn(
                'text-[10px] font-semibold whitespace-nowrap',
                done   ? 'text-success-600' :
                active ? 'text-primary-600' :
                         'text-[var(--color-text-muted)]'
              )}>
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mb-5 mx-1 transition-colors',
                done ? 'bg-success-400' : 'bg-[var(--color-border)]'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClaimTracker;
