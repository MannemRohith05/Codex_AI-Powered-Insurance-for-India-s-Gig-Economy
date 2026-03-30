import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { CloudRain, Thermometer, Waves, Wind, MapPin, FileText } from 'lucide-react';

const DISRUPTION_TYPES = [
  { key: 'rain', label: 'Heavy Rain', icon: CloudRain, color: 'border-blue-500/40 bg-blue-500/10' },
  { key: 'heatwave', label: 'Heatwave', icon: Thermometer, color: 'border-orange-500/40 bg-orange-500/10' },
  { key: 'flood', label: 'Flood', icon: Waves, color: 'border-cyan-500/40 bg-cyan-500/10' },
  { key: 'poor_aqi', label: 'Poor Air Quality', icon: Wind, color: 'border-purple-500/40 bg-purple-500/10' },
];

const SubmitClaim = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('rain');
  const [notes, setNotes] = useState('');
  const [gps, setGps] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [loading, setLoading] = useState(false);

  const getGPS = () => {
    setFetchingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          toast.success('📍 GPS location captured');
          setFetchingGps(false);
        },
        () => {
          // Dev fallback
          setGps({ lat: 17.385, lng: 78.4867, accuracy: 30 });
          toast.info('Using mock GPS location (geolocation denied)');
          setFetchingGps(false);
        }
      );
    } else {
      setGps({ lat: 17.385, lng: 78.4867, accuracy: 30 });
      setFetchingGps(false);
    }
  };

  useEffect(() => { getGPS(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/claim/submit', {
        disruption_type: selected,
        gps_at_claim: gps,
        notes,
      });
      toast.success('✅ Claim submitted successfully!');
      navigate('/worker/claims');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Claim submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <h1 className="section-title">File a Disruption Claim</h1>
            <p className="section-sub">Select the disruption type affecting your work today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Disruption type */}
            <div className="card border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Disruption Type *</h3>
              <div className="grid grid-cols-2 gap-3">
                {DISRUPTION_TYPES.map(({ key, label, icon: Icon, color }) => (
                  <button
                    type="button" key={key}
                    onClick={() => setSelected(key)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 text-left
                      ${selected === key ? color + ' border-opacity-100' : 'border-slate-800 hover:border-slate-600'}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GPS */}
            <div className="card border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">GPS Location</h3>
              {gps ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">Location captured</p>
                    <p className="text-xs text-slate-400 font-mono">{gps.lat.toFixed(4)}, {gps.lng.toFixed(4)} (±{Math.round(gps.accuracy)}m)</p>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={getGPS} disabled={fetchingGps} className="btn-secondary w-full flex items-center justify-center gap-2">
                  {fetchingGps ? <div className="spinner" /> : <MapPin className="w-4 h-4" />}
                  {fetchingGps ? 'Getting location...' : 'Capture GPS'}
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="card border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Additional Notes</h3>
              <textarea
                className="input-field resize-none h-24"
                placeholder="Describe how the disruption is affecting your work..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="card border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-2 text-sm text-amber-300">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold">Fraud Prevention Notice</p>
                  <p className="text-xs text-amber-400/80 mt-0.5">False claims will be flagged and may result in account suspension. Our fraud engine validates your claim against real-time weather data and your work history.</p>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <div className="spinner" /> : <><FileText className="w-5 h-5" />Submit Claim</>}
            </button>
          </form>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default SubmitClaim;
