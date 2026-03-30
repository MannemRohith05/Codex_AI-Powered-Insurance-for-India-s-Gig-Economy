import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';

const STATUSES = ['', 'submitted', 'under_review', 'approved', 'paid', 'rejected'];
const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷' };

const ClaimsFeed = () => {
  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.set('status', status);
      const { data } = await api.get(`/platform/claims-feed?${params}`);
      setClaims(data.claims || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load claims'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClaims(); }, [status, page]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchClaims, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, status, page]);

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="section-title">Claims Feed</h1>
            <p className="section-sub">{total} claims from your delivery partners</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAutoRefresh(a => !a)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${autoRefresh ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
            >
              <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Auto-refresh off'}
            </button>
            <button onClick={fetchClaims} className="btn-secondary text-xs py-1.5 px-3">↺ Refresh</button>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${status === s ? 'bg-indigo-600 text-white' : 'glass text-slate-400 hover:text-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="card border border-slate-800 overflow-x-auto">
          <table className="w-full data-table min-w-[650px]">
            <thead><tr><th>Worker</th><th>City</th><th>Type</th><th>Amount</th><th>Status</th><th>Filed</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><div className="inline-block spinner scale-150" /></td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No claims found</td></tr>
              ) : claims.map(c => (
                <tr key={c._id}>
                  <td>
                    <p className="font-medium text-white">{c.worker_id?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{c.worker_id?.phone}</p>
                  </td>
                  <td className="text-sm">{c.worker_id?.city || '—'}</td>
                  <td>
                    <span className="capitalize">{DISRUPTION_ICONS[c.disruption_type]} {c.disruption_type?.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <p className="font-semibold">₹{((c.amount_claimed || 0) / 100).toLocaleString('en-IN')}</p>
                    {c.status === 'paid' && <p className="text-xs text-emerald-400">✓ ₹{((c.amount_paid || 0) / 100).toLocaleString('en-IN')} paid</p>}
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-xs text-slate-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">Showing {claims.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={claims.length < 20} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default ClaimsFeed;
