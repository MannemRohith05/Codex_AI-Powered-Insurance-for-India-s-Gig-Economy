/**
 * StatusBadge — pure Tailwind semantic badge, no inline styles.
 */
import { cn } from '../utils/cn';

const STATUS_MAP = {
  active:    { label: 'Active',    className: 'badge-success' },
  approved:  { label: 'Approved',  className: 'badge-success' },
  paid:      { label: 'Paid',      className: 'badge-success' },
  completed: { label: 'Completed', className: 'badge-success' },
  pending:   { label: 'Pending',   className: 'badge-warning' },
  flagged:   { label: 'Flagged',   className: 'badge-danger'  },
  rejected:  { label: 'Rejected',  className: 'badge-danger'  },
  cancelled: { label: 'Cancelled', className: 'badge-muted'   },
  inactive:  { label: 'Inactive',  className: 'badge-muted'   },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.cancelled;
  return <span className={s.className}><span className="w-1.5 h-1.5 rounded-full bg-current" />{s.label}</span>;
};

export default StatusBadge;
