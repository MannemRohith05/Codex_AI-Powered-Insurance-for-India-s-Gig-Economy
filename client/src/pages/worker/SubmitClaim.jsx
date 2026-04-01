/**
 * SubmitClaim — disruption type selector + GPS + notes form.
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { CloudRain, Thermometer, Waves, Wind, MapPin, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const DISRUPTION_TYPES = [
  { key: 'rain',     label: 'Heavy Rain',       icon: CloudRain,   selectedBg: 'border-blue-400  bg-blue-50  text-blue-700',   icon_cls: 'text-blue-500'   },
  { key: 'heatwave', label: 'Heatwave',          icon: Thermometer, selectedBg: 'border-orange-400 bg-orange-50 text-orange-700', icon_cls: 'text-orange-500' },
  { key: 'flood',    label: 'Flood',             icon: Waves,       selectedBg: 'border-cyan-400   bg-cyan-50   text-cyan-700',   icon_cls: 'text-cyan-500'   },
  { key: 'poor_aqi', label: 'Poor Air Quality',  icon: Wind,        selectedBg: 'border-purple-400 bg-purple-50 text-purple-700', icon_cls: 'text-purple-500' },
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
      await api.post('/claim/submit', { disruption_type: selected, gps_at_claim: gps, notes });
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
          <div className="page-header">
            <h1 className="page-title">File a Disruption Claim</h1>
            <p className="page-subtitle">Select the type of disruption affecting your work today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Disruption type */}
            <div className="card p-5">
              <h3 className="label mb-3">Disruption Type *</h3>
              <div className="grid grid-cols-2 gap-3">
                {DISRUPTION_TYPES.map(({ key, label, icon: Icon, selectedBg, icon_cls }) => (
                  <button
                    type="button" key={key}
                    onClick={() => setSelected(key)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                      selected === key
                        ? selectedBg
                        : 'border-[var(--color-border)] hover:border-slate-300 text-[var(--color-text-secondary)]'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 shrink-0', selected === key ? '' : icon_cls)} />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GPS */}
            <div className="card p-5">
              <h3 className="label mb-3">GPS Location</h3>
              {gps ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success-50 border border-success-200">
                  <MapPin className="w-5 h-5 text-success-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-success-800">Location captured</p>
                    <p className="text-xs text-success-600 font-mono">
                      {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)} (±{Math.round(gps.accuracy)}m)
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button" onClick={getGPS} disabled={fetchingGps}
                  className="btn-secondary w-full"
                >
                  {fetchingGps
                    ? <span className="spinner text-[var(--color-text-muted)]" />
                    : <MapPin className="w-4 h-4" />}
                  {fetchingGps ? 'Getting location...' : 'Capture GPS'}
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="card p-5">
              <h3 className="label mb-3">Additional Notes</h3>
              <textarea
                className="input-field resize-none h-24"
                placeholder="Describe how the disruption is affecting your work today..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Fraud notice */}
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-800">Fraud Prevention Notice</p>
                <p className="text-xs text-warning-700 mt-0.5">
                  False claims will be flagged by our fraud engine, which validates against real-time weather data and your work history. Violations may result in account suspension.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5 text-base"
              disabled={loading}
            >
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><FileText className="w-5 h-5" /><span>Submit Claim</span></>
              }
            </button>
          </form>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default SubmitClaim;
