import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, Search, Filter } from 'lucide-react';

const STATUSES = ['', 'submitted', 'under_review', 'approved', 'rejected', 'paid'];
const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷' };

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
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="section-title">Claims Management</h1>
            <p className="section-sub">{total} total claim{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${filter === s ? 'bg-indigo-600 text-white' : 'glass text-slate-400 hover:text-white'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="card border border-slate-800 overflow-x-auto">
          <table className="w-full data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Worker</th><th>Type</th><th>Amount</th><th>Fraud Score</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="inline-block spinner scale-150" /></td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No claims found</td></tr>
              ) : claims.map(c => (
                <tr key={c._id}>
                  <td>
                    <p className="font-medium text-white">{c.worker_id?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{c.worker_id?.platform} • {c.worker_id?.city}</p>
                  </td>
                  <td><span className="capitalize">{DISRUPTION_ICONS[c.disruption_type]} {c.disruption_type?.replace('_', ' ')}</span></td>
                  <td className="font-semibold">₹{((c.amount_claimed || 0) / 100).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`font-bold text-sm ${c.fraud_score < 30 ? 'text-emerald-400' : c.fraud_score < 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {c.fraud_score}/100
                    </span>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-xs text-slate-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</td>
                  <td>
                    {(c.status === 'submitted' || c.status === 'under_review') && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(c._id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-600/40 transition-all">
                          <Check className="w-3 h-3" />Approve
                        </button>
                        <button onClick={() => setRejectModal(c._id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-600/40 transition-all">
                          <X className="w-3 h-3" />Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">Showing {claims.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
              <span className="px-3 py-1.5 text-xs text-slate-400">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={claims.length < 15} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
            </div>
          </div>
        </div>

        {/* Reject modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card border border-red-500/30 w-full max-w-md">
              <h3 className="text-lg font-bold text-white mb-3">Reject Claim</h3>
              <textarea
                className="input-field resize-none h-24 mb-4"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex gap-3">
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
