/**
 * DemoPanel — Section D + Section I
 *
 * Admin-only page at /admin/demo.
 * Provides a clearly-labelled "Demo Mode" section with a one-click
 * "Run Demo" button that streams the 6-step pipeline via SSE,
 * highlighting each step as it completes.
 */
import { useState, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { cn } from '../../utils/cn';
import { toast } from 'react-toastify';
import {
  Shield, CloudRain, FileText, Search, CheckCircle2, Banknote,
  Play, RotateCcw, Loader2, AlertTriangle, Info,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

// ── Step definitions ─────────────────────────────────────────────────────────
const STEP_DEFS = [
  { step: 1, icon: Shield,       label: 'Coverage Active',      color: 'blue'   },
  { step: 2, icon: CloudRain,    label: 'Disruption Detected',  color: 'orange' },
  { step: 3, icon: FileText,     label: 'Claim Auto-Created',   color: 'purple' },
  { step: 4, icon: Search,       label: 'Fraud Check',          color: 'yellow' },
  { step: 5, icon: CheckCircle2, label: 'Claim Approved',       color: 'green'  },
  { step: 6, icon: Banknote,     label: 'Payout Sent',         color: 'emerald'},
];

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-300',   icon: 'text-blue-600',   badge: 'bg-blue-600'   },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-300', icon: 'text-orange-600', badge: 'bg-orange-500' },
  purple:  { bg: 'bg-violet-50',  border: 'border-violet-300', icon: 'text-violet-600', badge: 'bg-violet-600' },
  yellow:  { bg: 'bg-amber-50',   border: 'border-amber-300',  icon: 'text-amber-600',  badge: 'bg-amber-500'  },
  green:   { bg: 'bg-green-50',   border: 'border-green-300',  icon: 'text-green-600',  badge: 'bg-green-600'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300',icon: 'text-emerald-600',badge: 'bg-emerald-600'},
};

// ── Data preview for each step ────────────────────────────────────────────────
const DataPreview = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null;
  const entries = Object.entries(data).slice(0, 6);
  return (
    <div className="mt-3 bg-white rounded-lg border border-slate-100 p-3 text-xs font-mono space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-start gap-2">
          <span className="text-slate-400 shrink-0">{k}:</span>
          <span className="text-slate-700 break-all">
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Step Card ─────────────────────────────────────────────────────────────────
const StepCard = ({ def, status, data }) => {
  const c   = COLOR_MAP[def.color];
  const Icon = def.icon;

  const isActive = status === 'active';
  const isDone   = status === 'done';
  const isFailed = status === 'failed';
  const isPending= !status;

  return (
    <div className={cn(
      'rounded-xl border-2 p-4 transition-all duration-500',
      isDone   && `${c.bg} ${c.border} shadow-md`,
      isActive && `${c.bg} ${c.border} shadow-lg ring-2 ring-offset-1`,
      isActive && def.color === 'blue'    && 'ring-blue-300',
      isActive && def.color === 'orange'  && 'ring-orange-300',
      isActive && def.color === 'purple'  && 'ring-violet-300',
      isActive && def.color === 'yellow'  && 'ring-amber-300',
      isActive && def.color === 'green'   && 'ring-green-300',
      isActive && def.color === 'emerald' && 'ring-emerald-300',
      isFailed && 'bg-red-50 border-red-300',
      isPending && 'bg-slate-50 border-slate-200 opacity-50',
    )}>
      <div className="flex items-center gap-3">
        {/* Step number badge */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 transition-all',
          isDone   ? c.badge : '',
          isActive ? `${c.badge} animate-pulse` : '',
          isFailed ? 'bg-red-500' : '',
          isPending? 'bg-slate-300' : '',
        )}>
          {isDone ? '✓' : isFailed ? '✗' : def.step}
        </div>

        {/* Icon + label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isActive
              ? <Loader2 className={cn('w-4 h-4 animate-spin', c.icon)} />
              : <Icon className={cn('w-4 h-4', isDone ? c.icon : isFailed ? 'text-red-500' : 'text-slate-400')} />
            }
            <p className={cn(
              'text-sm font-semibold',
              isDone || isActive ? 'text-slate-800' : isFailed ? 'text-red-700' : 'text-slate-400',
            )}>
              {def.label}
            </p>
          </div>
        </div>

        {/* Status pill */}
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0',
          isDone   && `${c.badge} text-white`,
          isActive && 'bg-slate-200 text-slate-700 animate-pulse',
          isFailed && 'bg-red-100 text-red-700',
          isPending && 'bg-slate-100 text-slate-400',
        )}>
          {isDone ? 'Done' : isActive ? 'Running…' : isFailed ? 'Failed' : 'Waiting'}
        </span>
      </div>

      {/* Data preview */}
      {(isDone || isFailed) && <DataPreview data={data} />}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const DemoPanel = () => {
  const [stepStates, setStepStates]   = useState({}); // { [stepNum]: { status, data } }
  const [running, setRunning]         = useState(false);
  const [doneData, setDoneData]       = useState(null);
  const [errorMsg, setErrorMsg]       = useState(null);
  const [elapsed, setElapsed]         = useState(null);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  const updateStep = (step, status, data = {}) => {
    setStepStates(prev => ({ ...prev, [step]: { status, data } }));
  };

  const reset = () => {
    setStepStates({});
    setRunning(false);
    setDoneData(null);
    setErrorMsg(null);
    setElapsed(null);
    clearInterval(timerRef.current);
  };

  const runDemo = async () => {
    reset();
    setRunning(true);
    startRef.current = Date.now();

    // Live elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));
    }, 100);

    // Read token from gigshield_auth storage key
    const _authRaw = localStorage.getItem('gigshield_auth');
    const token = _authRaw ? JSON.parse(_authRaw).token : null;

    // Direct fetch POST with SSE streaming — the only reliable approach
    // since EventSource only supports GET and can't send Authorization headers.
    try {
      const resp = await fetch(`${API_BASE}/demo/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept':        'text/event-stream',
          'Content-Type':  'application/json',
        },
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const evt = JSON.parse(line.slice(6));
              handleEvent(evt);
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
      setRunning(false);
      clearInterval(timerRef.current);
    }
  };

  const handleEvent = (evt) => {
    if (evt.step === 0) {
      // DEMO_COMPLETE
      setDoneData(evt.data);
      setRunning(false);
      clearInterval(timerRef.current);
      setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));
      toast.success('🎉 Demo complete! Full pipeline ran successfully.');
      return;
    }
    if (evt.step === -1) {
      setErrorMsg(evt.data?.error || 'Demo failed');
      setRunning(false);
      clearInterval(timerRef.current);
      toast.error('Demo failed: ' + (evt.data?.error || 'Unknown error'));
      return;
    }
    updateStep(evt.step, evt.status, evt.data);
  };

  const allDone = doneData !== null;

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        {/* ── Page Header ── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="page-title flex items-center gap-2">
              🎬 Demo Mode
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                JUDGES PREVIEW
              </span>
            </h1>
            <p className="page-subtitle mt-0.5">
              One-click automated pipeline — watch the full insurance flow in real time
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(allDone || errorMsg) && (
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            )}
            <button
              onClick={runDemo}
              disabled={running}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg',
                running
                  ? 'bg-amber-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-xl hover:-translate-y-0.5',
              )}
            >
              {running
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Running… {elapsed}s</>
                : <><Play className="w-4 h-4" /> Run Demo</>
              }
            </button>
          </div>
        </div>

        {/* ── Info Banner ── */}
        {!running && !allDone && !errorMsg && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">What this demo shows</p>
              <p className="text-blue-700 leading-relaxed">
                Clicking <strong>Run Demo</strong> triggers a fully automated, end-to-end
                insurance pipeline: a Mumbai Kurla delivery worker's coverage is verified,
                a heavy rain disruption is detected (87mm/day), a claim is created,
                the AI fraud engine checks GPS and weather data, the claim is auto-approved,
                and a UPI payout is processed — all in under 10 seconds.
              </p>
            </div>
          </div>
        )}

        {/* ── Step Tracker ── */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Pipeline Steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {STEP_DEFS.map(def => (
              <StepCard
                key={def.step}
                def={def}
                status={stepStates[def.step]?.status}
                data={stepStates[def.step]?.data}
              />
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Demo Failed</p>
              <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
              <p className="text-xs text-red-500 mt-1">
                Make sure the backend is running and seeded with a demo worker.
              </p>
            </div>
          </div>
        )}

        {/* ── Success Summary ── */}
        {allDone && doneData && (
          <div className="mb-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-800 text-lg">🎉 Demo Complete!</p>
                <p className="text-sm text-emerald-600">Full pipeline completed in {elapsed}s</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Steps Completed', value: `6 / 6` },
                { label: 'Claim Amount',    value: doneData.amount_paid_inr ? `₹${doneData.amount_paid_inr.toLocaleString('en-IN')}` : '₹1,500' },
                { label: 'Transaction ID',  value: doneData.transaction_id || 'pout_mock_xxx' },
                { label: 'Time Elapsed',    value: `${elapsed}s` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">{label}</p>
                  <p className="text-sm font-bold text-emerald-900 mt-0.5 font-mono break-all">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="card p-5 border">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Pipeline Legend</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Coverage Active',     desc: 'Verify demo worker has active policy' },
              { label: 'Disruption Detected', desc: 'Mumbai Kurla — 87mm rainfall, flood alert' },
              { label: 'Claim Auto-Created',  desc: '₹1,500 payout created for worker' },
              { label: 'Fraud Check',         desc: 'GPS clean, weather verified, AI: 0.08 score' },
              { label: 'Claim Approved',      desc: 'AI auto-approves with 92% confidence' },
              { label: 'Payout Sent',         desc: 'UPI transfer to worker (mock Razorpay)' },
            ].map(({ label, desc }) => (
              <div key={label} className="text-xs">
                <p className="font-semibold text-slate-700">{label}</p>
                <p className="text-slate-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </PageContent>
    </DashboardLayout>
  );
};

export default DemoPanel;
