import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Eye } from 'lucide-react';

const FraudPanel = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/fraud-panel?page=${page}&limit=15`)
      .then(r => { setLogs(r.data.logs || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed to load fraud logs'))
      .finally(() => setLoading(false));
  }, [page]);

  const REC_COLORS = { APPROVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', REVIEW: 'text-amber-400 bg-amber-500/10 border-amber-500/20', REJECT: 'text-red-400 bg-red-500/10 border-red-500/20' };

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6">
          <h1 className="section-title flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-400" />Fraud Detection Panel</h1>
          <p className="section-sub">{total} fraud log entries, sorted by risk score</p>
        </div>

        <div className="card border border-slate-800 overflow-x-auto">
          <table className="w-full data-table min-w-[700px]">
            <thead><tr><th>Worker</th><th>Claim</th><th>Fraud Score</th><th>Flags</th><th>Recommendation</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="inline-block spinner scale-150" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No fraud logs</td></tr>
              ) : logs.map(l => (
                <>
                  <tr key={l._id} className="cursor-pointer" onClick={() => setExpanded(expanded === l._id ? null : l._id)}>
                    <td>
                      <p className="font-medium text-white">{l.worker_id?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{l.worker_id?.phone}</p>
                    </td>
                    <td className="capitalize text-xs">{l.claim_id?.disruption_type?.replace('_', ' ') || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-20">
                          <div className={`h-full rounded-full transition-all ${l.fraud_score < 30 ? 'bg-emerald-500' : l.fraud_score < 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${l.fraud_score}%` }} />
                        </div>
                        <span className={`font-bold text-sm ${l.fraud_score < 30 ? 'text-emerald-400' : l.fraud_score < 60 ? 'text-amber-400' : 'text-red-400'}`}>{l.fraud_score}</span>
                      </div>
                    </td>
                    <td className="text-xs text-slate-400">{Object.keys(l.flags || {}).length} flag{Object.keys(l.flags || {}).length !== 1 ? 's' : ''}</td>
                    <td><span className={`status-badge border text-xs ${REC_COLORS[l.recommendation] || ''}`}>{l.recommendation || '—'}</span></td>
                    <td className="text-xs text-slate-500">{formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}</td>
                    <td><Eye className="w-4 h-4 text-slate-600 hover:text-indigo-400" /></td>
                  </tr>
                  {expanded === l._id && (
                    <tr key={l._id + '-exp'}>
                      <td colSpan={7}>
                        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800 m-1">
                          <h4 className="text-sm font-semibold text-white mb-2">Fraud Flags Breakdown</h4>
                          {Object.keys(l.flags || {}).length === 0 ? (
                            <p className="text-xs text-slate-500">No specific flags</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(l.flags).map(([k, v]) => (
                                <div key={k} className="p-2.5 rounded bg-red-500/10 border border-red-500/20">
                                  <p className="text-xs text-red-400 font-semibold">{k.replace(/_/g, ' ')}</p>
                                  <p className="text-xs text-slate-300 mt-0.5">{typeof v === 'boolean' ? (v ? '⚠️ Triggered' : 'OK') : v}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {l.reviewed_by && <p className="text-xs text-slate-500 mt-2">Reviewed by: {l.reviewed_by?.name || l.reviewed_by?.email}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">{total} total entries</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
              <span className="px-3 py-1.5 text-xs text-slate-400">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 15} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default FraudPanel;
