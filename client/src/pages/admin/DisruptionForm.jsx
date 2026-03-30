import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { CloudRain, Thermometer, Waves, Wind, MapPin, Send } from 'lucide-react';

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
const TYPES = [
  { key: 'rain', label: 'Heavy Rain', icon: CloudRain },
  { key: 'heatwave', label: 'Heatwave', icon: Thermometer },
  { key: 'flood', label: 'Flood', icon: Waves },
  { key: 'poor_aqi', label: 'Poor AQI', icon: Wind },
];

const DisruptionForm = () => {
  const [form, setForm] = useState({ city: 'Hyderabad', zone: '', type: 'rain', severity: 'medium' });
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  const loadRecent = async () => {
    try {
      const { data } = await api.get('/admin/disruptions');
      setRecent(data.events?.slice(0, 5) || []);
    } catch {}
  };

  useState(() => { loadRecent(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/admin/disruption', form);
      toast.success(`⚠️ ${form.type} disruption declared in ${form.city}!`);
      setForm(f => ({ ...f, zone: '' }));
      loadRecent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to declare disruption');
    } finally {
      setLoading(false);
    }
  };

  const DISRUPTION_ICONS = { rain: '🌧️', heatwave: '🌡️', flood: '🌊', poor_aqi: '😷' };
  const SEVERITY_COLORS = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="section-title">Declare Disruption Event</h1>
            <p className="section-sub">Manually trigger a weather disruption event to activate claims for affected workers</p>
          </div>

          <div className="card border border-slate-800 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label"><MapPin className="w-3.5 h-3.5 inline mr-1" />City</label>
                  <select className="input-field" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Zone / Area (optional)</label>
                  <input className="input-field" placeholder="e.g. Banjara Hills, Koramangala" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Disruption Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TYPES.map(({ key, label, icon: Icon }) => (
                    <button type="button" key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${form.type === key ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                      <Icon className="w-5 h-5" /><span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Severity</label>
                <div className="flex gap-3">
                  {['low', 'medium', 'high'].map(s => (
                    <button type="button" key={s} onClick={() => setForm(f => ({ ...f, severity: s }))}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold capitalize transition-all ${form.severity === s ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <div className="spinner" /> : <><Send className="w-4 h-4" />Declare Disruption Event</>}
              </button>
            </form>
          </div>

          {recent.length > 0 && (
            <div className="card border border-slate-800">
              <h3 className="font-semibold text-white mb-3">Recent Disruptions</h3>
              <div className="space-y-2">
                {recent.map(d => (
                  <div key={d._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{DISRUPTION_ICONS[d.type]}</span>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{d.type?.replace('_', ' ')} — {d.city}</p>
                        <p className="text-xs text-slate-500">{d.zone || 'City-wide'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold capitalize ${SEVERITY_COLORS[d.severity]}`}>{d.severity}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{d.is_active ? '🟢 Active' : '⚫ Closed'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default DisruptionForm;
