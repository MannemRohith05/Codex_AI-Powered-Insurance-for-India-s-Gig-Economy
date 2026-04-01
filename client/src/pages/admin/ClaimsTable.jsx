/**
 * ClaimsTable (Admin) — claim review with filter tabs, pagination, and reject modal.
 * Light theme, semantic classes only.
 */
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const STATUSES = ['', 'submitted', 'under_review', 'approved', 'rejected', 'paid'];
const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷' };

const FraudPill = ({ score }) => (
  <span className={cn(
    'text-sm font-bold',
    score < 30 ? 'text-success-600' : score < 60 ? 'text-warning-600' : 'text-danger-600'
  )}>
    {score}/100
  </span>
);

const ClaimsTable = () => {
  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('under_review');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter) params.set('status', filter);
      const { data } = await api.get(`/admin/claims?${params}`);
      setClaims(data.claims || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load claims'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClaims(); }, [filter, page]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/claim/${id}/approve`);
      toast.success('Claim approved & payout initiated');
      fetchClaims();
    } catch (err) { toast.error(err.response?.data?.error || 'Approval failed'); }
  };

  const handleReject = async () => {
    try {
      await api.put(`/admin/claim/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Claim rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchClaims();
    } catch (err) { toast.error(err.response?.data?.error || 'Rejection failed'); }
  };

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        {/* Header + filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Claims Management</h1>
            <p className="page-subtitle">{total} total claim{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize',
                  filter === s
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-slate-300'
                )}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[800px]">
              <thead>
                <tr>
                  <th>Worker</th><th>Type</th><th>Amount</th>
                  <th>Fraud Score</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((__, j) => (
                        <td key={j}><div className="animate-pulse h-4 rounded bg-slate-100 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : claims.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-[var(--color-text-muted)]">No claims found</td></tr>
                ) : claims.map(c => (
                  <tr key={c._id}>
                    <td>
                      <p className="font-medium text-[var(--color-text-primary)]">{c.worker_id?.name || '—'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{c.worker_id?.platform} • {c.worker_id?.city}</p>
                    </td>
                    <td className="capitalize">
                      {DISRUPTION_ICONS[c.disruption_type]} {c.disruption_type?.replace('_', ' ')}
                    </td>
                    <td className="font-medium">₹{((c.amount_claimed || 0) / 100).toLocaleString('en-IN')}</td>
                    <td><FraudPill score={c.fraud_score} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="text-xs">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</td>
                    <td>
                      {(c.status === 'submitted' || c.status === 'under_review') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(c._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success-50 border border-success-200 text-success-700 text-xs font-medium hover:bg-success-100 transition-colors"
                          >
                            <Check className="w-3 h-3" />Approve
                          </button>
                          <button
                            onClick={() => setRejectModal(c._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-xs font-medium hover:bg-danger-100 transition-colors"
                          >
                            <X className="w-3 h-3" />Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">Showing {claims.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
              <span className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={claims.length < 15}  className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
            </div>
          </div>
        </div>

        {/* Reject modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Reject Claim</h3>
              <div className="form-group">
                <label className="label">Reason for Rejection</label>
                <textarea
                  className="input-field resize-none h-24"
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleReject} disabled={!rejectReason} className="btn-danger flex-1">Confirm Reject</button>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </DashboardLayout>
  );
};

export default ClaimsTable;
