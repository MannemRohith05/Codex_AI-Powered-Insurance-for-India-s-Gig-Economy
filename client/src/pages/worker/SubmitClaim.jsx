/**
 * SubmitClaim — guided claim filing form aligned with README API spec.
 * Includes declared income loss, photo evidence, parametric trigger info,
 * and richer AI response display (confidence, settlement ETA, reason codes).
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import {
  CloudRain, Thermometer, Waves, Wind, MapPin, FileText, AlertCircle,
  CheckCircle2, Clock, IndianRupee, Camera, Info,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const DISRUPTION_TYPES = [
  { key: 'rain',     label: 'Heavy Rain',       icon: CloudRain,   selectedBg: 'border-blue-400  bg-blue-50  text-blue-700',   icon_cls: 'text-blue-500'   },
  { key: 'heatwave', label: 'Heatwave',          icon: Thermometer, selectedBg: 'border-orange-400 bg-orange-50 text-orange-700', icon_cls: 'text-orange-500' },
  { key: 'flood',    label: 'Flood',             icon: Waves,       selectedBg: 'border-cyan-400   bg-cyan-50   text-cyan-700',   icon_cls: 'text-cyan-500'   },
  { key: 'poor_aqi', label: 'Poor Air Quality',  icon: Wind,        selectedBg: 'border-purple-400 bg-purple-50 text-purple-700', icon_cls: 'text-purple-500' },
];

const MIN_LOSS = 300;

// ── Result display panel (shown after submission) ─────────────────────────────
const ClaimResultPanel = ({ result, onDone }) => {
  const isApproved = result.status === 'AUTO_APPROVED';
  const isFlagged  = result.status === 'FLAGGED';
  const isRejected = result.status === 'REJECTED';

  return (
    <div className={cn(
      'card p-6 border-2 text-center',
      isApproved ? 'border-success-300 bg-success-50' :
      isRejected  ? 'border-danger-300 bg-danger-50'  :
                    'border-warning-300 bg-warning-50'
    )}>
      <div className="flex justify-center mb-4">
        {isApproved && <CheckCircle2 className="w-14 h-14 text-success-500" />}
        {isFlagged  && <Clock       className="w-14 h-14 text-warning-500" />}
        {isRejected && <AlertCircle className="w-14 h-14 text-danger-500"  />}
      </div>

      <p className={cn('text-xl font-bold mb-1',
        isApproved ? 'text-success-800' : isRejected ? 'text-danger-800' : 'text-warning-800'
      )}>
        {isApproved ? '✅ Claim Approved' : isFlagged ? '⏳ Under Review' : '❌ Claim Rejected'}
      </p>

      <p className={cn('text-sm mb-4',
        isApproved ? 'text-success-700' : isRejected ? 'text-danger-700' : 'text-warning-700'
      )}>
        {result.message}
      </p>

      {/* Approved payout details */}
      {isApproved && (
        <div className="rounded-lg bg-success-100 border border-success-200 p-4 mb-4 text-left space-y-2">
          {result.claim_amount_inr && (
            <div className="flex justify-between text-sm">
              <span className="text-success-700 font-medium">Approved Payout</span>
              <span className="text-success-900 font-bold">₹{result.claim_amount_inr.toLocaleString('en-IN')}</span>
            </div>
          )}
          {result.settlement_eta && (
            <div className="flex justify-between text-sm">
              <span className="text-success-700 font-medium">Settlement ETA</span>
              <span className="text-success-900 font-bold">
                {new Date(result.settlement_eta).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
          {result.ai_confidence !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-success-700 font-medium">AI Confidence</span>
              <span className="text-success-900 font-bold">{Math.round(result.ai_confidence * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Flagged / review info */}
      {isFlagged && (
        <div className="rounded-lg bg-warning-100 border border-warning-200 p-4 mb-4 text-left">
          <p className="text-xs font-semibold text-warning-800 mb-2">Why was this flagged?</p>
          {result.reason_codes?.length > 0 ? (
            <ul className="space-y-1">
              {result.reason_codes.map((code, i) => (
                <li key={i} className="text-xs text-warning-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-warning-500 inline-block" />
                  {code.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-warning-700">Your claim is being manually reviewed by our team.</p>
          )}
          <p className="text-xs text-warning-600 mt-2 font-medium">Decision within 2 business days.</p>
        </div>
      )}

      {/* Rejected reason codes */}
      {isRejected && result.reason_codes?.length > 0 && (
        <div className="rounded-lg bg-danger-100 border border-danger-200 p-4 mb-4 text-left">
          <p className="text-xs font-semibold text-danger-800 mb-2">Rejection reasons:</p>
          <ul className="space-y-1">
            {result.reason_codes.map((code, i) => (
              <li key={i} className="text-xs text-danger-700 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-danger-500 inline-block" />
                {code.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={onDone} className="btn-primary mt-2">
        {isApproved ? 'View My Claims' : 'Back to Dashboard'}
      </button>
    </div>
  );
};

// ── Main form ─────────────────────────────────────────────────────────────────
const SubmitClaim = () => {
  const navigate    = useNavigate();
  const [selected,  setSelected]  = useState('rain');
  const [lossAmt,   setLossAmt]   = useState('');
  const [photoUrl,  setPhotoUrl]  = useState('');
  const [notes,     setNotes]     = useState('');
  const [gps,       setGps]       = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null); // successful submission result

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
    const parsedLoss = parseFloat(lossAmt);

    if (!lossAmt || isNaN(parsedLoss) || parsedLoss < MIN_LOSS) {
      toast.error(`Minimum declared income loss is ₹${MIN_LOSS}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/claim/submit', {
        disruption_type:          selected,
        declared_income_loss_inr: parsedLoss,
        photo_evidence_url:       photoUrl || undefined,
        gps_at_claim:             gps,
        notes,
      });
      setResult(res.data);
    } catch (err) {
      const errData = err.response?.data;
      // Show structured error messages from the server
      if (errData?.error === 'WAITING_PERIOD_ACTIVE') {
        const endsOn = errData.waiting_period_ends
          ? new Date(errData.waiting_period_ends).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          : '';
        toast.error(`⏳ Waiting period active. Claims eligible from ${endsOn}.`);
      } else if (errData?.error === 'MONTHLY_CAP_REACHED') {
        toast.error(`Monthly claim cap (${errData.max_allowed}) reached for this month.`);
      } else if (errData?.error === 'BELOW_MIN_THRESHOLD') {
        toast.error(`Minimum loss threshold is ₹${errData.minimum_required}.`);
      } else if (errData?.error === 'NO_PARAMETRIC_TRIGGER') {
        toast.error('No qualifying weather event in your zone today. Only parametric disruptions are covered.');
      } else {
        toast.error(errData?.message || errData?.error || 'Claim submission failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show result panel after successful submission
  if (result) {
    return (
      <DashboardLayout>
        <Sidebar />
        <PageContent>
          <div className="max-w-xl mx-auto">
            <div className="page-header">
              <h1 className="page-title">Claim Submitted</h1>
              <p className="page-subtitle">Here's the AI review result for your claim</p>
            </div>
            <ClaimResultPanel
              result={result}
              onDone={() => navigate(result.status === 'AUTO_APPROVED' ? '/worker/claims' : '/worker/dashboard')}
            />
          </div>
        </PageContent>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="max-w-xl mx-auto">
          <div className="page-header">
            <h1 className="page-title">File a Disruption Claim</h1>
            <p className="page-subtitle">Select the disruption type and provide details to get covered</p>
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

            {/* Declared income loss — required, min ₹300 */}
            <div className="card p-5">
              <h3 className="label mb-1 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4" />
                Declared Income Loss *
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                How much income did you lose today due to this disruption? Minimum ₹{MIN_LOSS}.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-medium text-sm">₹</span>
                <input
                  type="number"
                  className="input-field pl-7"
                  placeholder="e.g. 500"
                  min={MIN_LOSS}
                  step="50"
                  value={lossAmt}
                  onChange={e => setLossAmt(e.target.value)}
                  required
                />
              </div>
              {lossAmt && parseFloat(lossAmt) < MIN_LOSS && (
                <p className="text-xs text-danger-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Minimum ₹{MIN_LOSS} required to file a claim.
                </p>
              )}
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

            {/* Photo evidence (optional) */}
            <div className="card p-5">
              <h3 className="label mb-1 flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                Photo Evidence <span className="text-[var(--color-text-muted)] font-normal text-xs ml-1">(optional but recommended)</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                Paste a URL to a photo showing the disruption (flood, rain, etc.). Helps speed up approval.
              </p>
              <input
                type="url"
                className="input-field"
                placeholder="https://example.com/photo.jpg"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
              />
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

            {/* Policy info box */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">How claims are evaluated</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                  <li>A qualifying weather event must be active in your zone</li>
                  <li>Minimum income loss: ₹{MIN_LOSS} per claim</li>
                  <li>Maximum 2 approved claims per calendar month</li>
                  <li>Payout capped at 40% of your declared weekly income</li>
                  <li>Auto-approved claims are paid within 24 hours via UPI</li>
                </ul>
              </div>
            </div>

            {/* Fraud notice */}
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-800">Fraud Prevention Notice</p>
                <p className="text-xs text-warning-700 mt-0.5">
                  Claims are validated by our AI fraud detection engine using GPS data, weather records, and your work history. False claims result in account suspension.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5 text-base"
              disabled={loading || !lossAmt || parseFloat(lossAmt) < MIN_LOSS}
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
