import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { Search } from 'lucide-react';

const PLATFORMS = ['', 'Swiggy', 'Zomato', 'Zepto', 'Dunzo', 'Other'];
const CITIES = ['', 'Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune'];

const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (platform) params.set('platform', platform);
      if (city) params.set('city', city);
      const { data } = await api.get(`/admin/workers?${params}`);
      setWorkers(data.workers || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load workers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, [platform, city, page]);

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="section-title">Worker Management</h1>
            <p className="section-sub">{total} registered workers</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="input-field w-auto text-sm" value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p || 'All Platforms'}</option>)}
            </select>
            <select className="input-field w-auto text-sm" value={city} onChange={e => { setCity(e.target.value); setPage(1); }}>
              {CITIES.map(c => <option key={c} value={c}>{c || 'All Cities'}</option>)}
            </select>
          </div>
        </div>

        <div className="card border border-slate-800 overflow-x-auto">
          <table className="w-full data-table min-w-[750px]">
            <thead><tr><th>Worker</th><th>Platform</th><th>City</th><th>KYC</th><th>Phone</th><th>Risk Score</th><th>Joined</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="inline-block spinner scale-150" /></td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No workers found</td></tr>
              ) : workers.map(w => (
                <tr key={w._id}>
                  <td>
                    <p className="font-medium text-white">{w.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{w.upi_id || 'No UPI'}</p>
                  </td>
                  <td>{w.platform}</td>
                  <td>{w.city || '—'}</td>
                  <td>
                    <StatusBadge status={w.aadhaar_verified ? 'verified' : 'pending'} label={w.aadhaar_verified ? 'Verified' : 'Pending'} />
                  </td>
                  <td>
                    <StatusBadge status={w.phone_verified ? 'verified' : 'pending'} label={w.phone_verified ? 'Verified' : 'Unverified'} />
                  </td>
                  <td>
                    <span className={`font-bold ${w.risk_score < 30 ? 'text-emerald-400' : w.risk_score < 60 ? 'text-amber-400' : 'text-red-400'}`}>{w.risk_score || 0}</span>
                  </td>
                  <td className="text-xs text-slate-500">{formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">Page {page} of workers</p>
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

export default WorkerManagement;
