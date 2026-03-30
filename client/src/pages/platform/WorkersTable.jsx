import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

const CITIES = ['', 'Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune'];

const WorkersTable = () => {
  const [workers, setWorkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (city) params.set('city', city);
      const { data } = await api.get(`/platform/workers?${params}`);
      setWorkers(data.workers || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load workers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, [city, page]);

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="section-title">Your Workers</h1>
            <p className="section-sub">{total} delivery partners on your platform</p>
          </div>
          <select className="input-field w-auto text-sm" value={city} onChange={e => { setCity(e.target.value); setPage(1); }}>
            {CITIES.map(c => <option key={c} value={c}>{c || 'All Cities'}</option>)}
          </select>
        </div>

        <div className="card border border-slate-800 overflow-x-auto">
          <table className="w-full data-table min-w-[650px]">
            <thead><tr><th>Worker</th><th>City</th><th>Insurance</th><th>KYC</th><th>Coverage</th><th>Joined</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><div className="inline-block spinner scale-150" /></td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No workers in this filter</td></tr>
              ) : workers.map(w => (
                <tr key={w._id}>
                  <td>
                    <p className="font-medium text-white">{w.name}</p>
                    <p className="text-xs text-slate-500">{w.phone}</p>
                  </td>
                  <td>{w.city || '—'}</td>
                  <td><StatusBadge status={w.insurance_status} /></td>
                  <td><StatusBadge status={w.aadhaar_verified ? 'verified' : 'pending'} label={w.aadhaar_verified ? 'Verified' : 'Pending'} /></td>
                  <td className="text-emerald-400 font-semibold">
                    {w.policy ? `₹${((w.policy.coverage_amount || 0) / 100).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="text-xs text-slate-500">{formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">Showing {workers.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={workers.length < 20} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30">Next →</button>
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default WorkersTable;
