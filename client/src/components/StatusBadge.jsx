const STATUS_MAP = {
  active:    { label: 'Active',    color: '#00d9c0', bg: 'rgba(0,217,192,0.12)',    border: 'rgba(0,217,192,0.25)',  dot: '#00d9c0' },
  approved:  { label: 'Approved',  color: '#34d399', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.25)', dot: '#34d399' },
  pending:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.25)', dot: '#fbbf24' },
  rejected:  { label: 'Rejected',  color: '#fb7185', bg: 'rgba(244,63,94,0.12)',    border: 'rgba(244,63,94,0.25)',  dot: '#fb7185' },
  flagged:   { label: 'Flagged',   color: '#ff8c5a', bg: 'rgba(255,107,53,0.12)',   border: 'rgba(255,107,53,0.25)', dot: '#ff8c5a' },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', dot: '#64748b' },
  completed: { label: 'Completed', color: '#34d399', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.25)', dot: '#34d399' },
  inactive:  { label: 'Inactive',  color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', dot: '#64748b' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.cancelled;
  return (
    <span
      className="status-badge"
      style={{
        color: s.color,
        background: s.bg,
        borderColor: s.border,
      }}
    >
      <span
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: s.dot,
          display: 'inline-block',
          boxShadow: `0 0 6px ${s.dot}`,
          animation: status === 'active' || status === 'pending' ? 'neonSpin 1s linear infinite' : 'none',
          animationName: status === 'active' ? 'activePulse' : 'none',
        }}
      />
      {s.label}
    </span>
  );
};

export default StatusBadge;
