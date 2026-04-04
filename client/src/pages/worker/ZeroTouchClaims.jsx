/**
 * ZeroTouchClaims — 5 auto-triggered zero-touch claim scenarios.
 *
 * Triggers: Heavy rainfall, Govt curfew, Worker inactivity >24h,
 *           Accident self-report, Hospital SMS keyword.
 * UX: One-tap "Claim Now" → AI review → Approved → Payout
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { CloudRain, ShieldOff, WifiOff, Ambulance, MessageSquare, CheckCircle, Clock, Cpu, ChevronRight, AlertCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// ── Trigger definitions ────────────────────────────────────────────────────
const TRIGGERS = [
  {
    id: 'heavy_rain',
    icon: CloudRain,
    color: 'blue',
    title: 'Heavy Rainfall Alert',
    description: 'Parametric trigger: >50mm rainfall detected in your registered zone in last 24h.',
    payout: 800,
    source: 'OpenWeatherMap API (zone-level)',
    autoDetected: true,
  },
  {
    id: 'govt_curfew',
    icon: ShieldOff,
    color: 'rose',
    title: 'Government Shutdown / Curfew',
    description: 'Local authority declared shutdown or section 144 in your pin code zone.',
    payout: 1200,
    source: 'Govt Alert API (mock)',
    autoDetected: true,
  },
  {
    id: 'inactivity',
    icon: WifiOff,
    color: 'amber',
    title: 'Worker Inactivity >24 Hours',
    description: 'No GPS ping or app activity detected for more than 24 hours — possible distress.',
    payout: 600,
    source: 'Activity monitor (last ping: simulated)',
    autoDetected: true,
  },
  {
    id: 'accident',
    icon: Ambulance,
    color: 'orange',
    title: 'Accident Self-Report',
    description: 'Worker-initiated accident report. Attach photo evidence for instant approval.',
    payout: 2500,
    source: 'Self-report form',
    autoDetected: false,
    selfReport: true,
  },
  {
    id: 'hospital_sms',
    icon: MessageSquare,
    color: 'purple',
    title: 'Hospital Admission Detected',
    description: 'SMS keyword "ADMITTED" or "DISCHARGE" detected from registered mobile number.',
    payout: 3000,
    source: 'SMS keyword scan (simulated)',
    autoDetected: true,
  },
];

const STATUS_FLOW = ['Detected', 'Submitted', 'AI Review', 'Approved', 'Paid'];

const colorMap = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700'   },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   icon: 'text-rose-600',   badge: 'bg-rose-100 text-rose-700'   },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700'  },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
};

// ── Status Badge ─────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Detected:  'bg-slate-100 text-slate-600',
    Submitted: 'bg-blue-100 text-blue-700',
    'AI Review': 'bg-violet-100 text-violet-700',
    Approved:  'bg-emerald-100 text-emerald-700',
    Paid:      'bg-green-100 text-green-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', map[status])}>
      {status === 'AI Review' && <Cpu className="w-3 h-3" />}
      {status === 'Approved' || status === 'Paid' ? <CheckCircle className="w-3 h-3" /> : null}
      {status}
    </span>
  );
};

// ── Progress Bar ──────────────────────────────────────────────────────────
const StatusProgress = ({ status }) => {
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-0 mt-3">
      {STATUS_FLOW.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-500',
            i < idx ? 'bg-emerald-500 text-white' : i === idx ? 'bg-primary-600 text-white ring-2 ring-primary-200' : 'bg-slate-200 text-slate-400'
          )}>
            {i < idx ? '✓' : i + 1}
          </div>
          {i < STATUS_FLOW.length - 1 && (
            <div className={cn('h-0.5 flex-1 mx-1 transition-all duration-500', i < idx ? 'bg-emerald-400' : 'bg-slate-200')} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Accident Report Modal ─────────────────────────────────────────────────
const AccidentModal = ({ onSubmit, onClose }) => {
  const [desc, setDesc] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--color-text-primary)]">Accident Self-Report</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <textarea
          className="w-full border border-[var(--color-border)] rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-200"
          rows={3}
          placeholder="Briefly describe what happened…"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <div
          className="mt-3 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-300 transition-colors"
          onClick={() => { setHasPhoto(true); toast.info('Photo attached (mock)'); }}
        >
          {hasPhoto
            ? <p className="text-sm text-emerald-600 font-medium">✓ Photo evidence attached</p>
            : <p className="text-sm text-[var(--color-text-muted)]">📷 Tap to attach photo evidence</p>}
        </div>
        <button
          disabled={!desc.trim()}
          onClick={() => onSubmit(desc, hasPhoto)}
          className="mt-4 w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Submit Accident Report
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const ZeroTouchClaims = () => {
  const [claims, setClaims] = useState({});         // { triggerId: { claimId, status, payout } }
  const [loading, setLoading] = useState({});
  const [accidentModal, setAccidentModal] = useState(false);
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    api.get('/policy/my').then(r => {
      const active = r.data.policies?.find(p => p.status === 'active');
      setPolicy(active || null);
    }).catch(() => {});
  }, []);

  // Advance status with simulated delay
  const advanceStatus = (triggerId, current) => {
    const next = STATUS_FLOW[STATUS_FLOW.indexOf(current) + 1];
    if (!next) return;
    setTimeout(() => {
      setClaims(prev => ({
        ...prev,
        [triggerId]: { ...prev[triggerId], status: next },
      }));
      if (next !== 'Paid') advanceStatus(triggerId, next);
    }, next === 'AI Review' ? 1500 : next === 'Approved' ? 2500 : 3500);
  };

  const handleClaim = async (trigger, extraData = {}) => {
    if (!policy) {
      toast.error('You need an active policy to file a claim.');
      return;
    }
    setLoading(prev => ({ ...prev, [trigger.id]: true }));

    try {
      const { data } = await api.post('/claim/submit', {
        trigger_type: trigger.id,
        description: extraData.desc || `Auto-triggered: ${trigger.title}`,
        ...(extraData.hasPhoto ? { photo_evidence: true } : {}),
      });

      const claimId = data.claim?.claim_id || `CLM-${Date.now().toString(36).toUpperCase()}`;
      setClaims(prev => ({
        ...prev,
        [trigger.id]: { claimId, status: 'Submitted', payout: trigger.payout },
      }));
      toast.success(`✅ Claim ${claimId} submitted!`);
      advanceStatus(trigger.id, 'Submitted');
    } catch {
      // Offline / mock fallback
      const claimId = `CLM-${Date.now().toString(36).toUpperCase()}`;
      setClaims(prev => ({
        ...prev,
        [trigger.id]: { claimId, status: 'Submitted', payout: trigger.payout },
      }));
      toast.info(`Claim ${claimId} queued (demo mode)`);
      advanceStatus(trigger.id, 'Submitted');
    } finally {
      setLoading(prev => ({ ...prev, [trigger.id]: false }));
    }
  };

  return (
    <DashboardLayout sidebar={<Sidebar />}>
      <PageContent title="Zero-Touch Claims" subtitle="Auto-triggered income protection — 5 disruption scenarios">

        {/* Policy warning */}
        {!policy && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              You need an active policy to file claims. <a href="/worker/buy-policy" className="underline font-semibold">Activate a plan →</a>
            </p>
          </div>
        )}

        <div className="space-y-4 max-w-2xl mx-auto">
          {TRIGGERS.map(trigger => {
            const c = colorMap[trigger.color];
            const Icon = trigger.icon;
            const claim = claims[trigger.id];
            const isLoading = loading[trigger.id];

            return (
              <div key={trigger.id} className={cn('rounded-2xl border p-5 shadow-sm', c.bg, c.border)}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', 'bg-white border', c.border)}>
                    <Icon className={cn('w-5 h-5', c.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)]">{trigger.title}</h3>
                      {trigger.autoDetected && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', c.badge)}>
                          Auto-detected
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold flex items-center gap-0.5">
                        <Cpu className="w-3 h-3" /> AI
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{trigger.description}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Source: {trigger.source}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[var(--color-text-muted)]">Est. payout</p>
                    <p className="font-extrabold text-base text-[var(--color-text-primary)]">₹{trigger.payout.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Status + Progress */}
                {claim && (
                  <div className="mt-4 bg-white/70 rounded-xl p-3 border border-white/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[var(--color-text-muted)] font-mono">{claim.claimId}</span>
                      <StatusBadge status={claim.status} />
                    </div>
                    <StatusProgress status={claim.status} />
                    {claim.status === 'Paid' && (
                      <div className="mt-3 flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                        <CheckCircle className="w-4 h-4" />
                        ₹{claim.payout.toLocaleString('en-IN')} credited to your account!
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                {!claim && (
                  <button
                    disabled={isLoading || !policy}
                    onClick={() => {
                      if (trigger.selfReport) { setAccidentModal(trigger); }
                      else { handleClaim(trigger); }
                    }}
                    className={cn(
                      'mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      policy
                        ? 'bg-white border border-current hover:bg-opacity-90 shadow-sm hover:shadow'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                      c.icon
                    )}
                  >
                    {isLoading
                      ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <>Claim Now <ChevronRight className="w-4 h-4" /></>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PageContent>

      {/* Accident Modal */}
      {accidentModal && (
        <AccidentModal
          onClose={() => setAccidentModal(false)}
          onSubmit={(desc, hasPhoto) => {
            setAccidentModal(false);
            handleClaim(accidentModal, { desc, hasPhoto });
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default ZeroTouchClaims;
