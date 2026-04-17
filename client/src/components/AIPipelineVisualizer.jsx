/**
 * AIPipelineVisualizer — Animated 3-Stage AI Decision Pipeline
 *
 * Shows the GigShield ML pipeline in action:
 *   Stage 1: Parametric Trigger Check (Weather Oracle)
 *   Stage 2: LightGBM Fraud Scorer
 *   Stage 3: Decision Gate (Auto-Approve / Flag / Reject)
 *
 * Props:
 *   fraudScore   {number}  0.0–1.0
 *   anomalyScore {number}  -0.5 to 0.0
 *   decision     {string}  AUTO_APPROVED | FLAGGED | REJECTED
 *   triggered    {boolean} whether parametric trigger is met
 *   reasonCodes  {Array}   fraud reason codes
 *   isRunning    {boolean} show in-progress animation
 */
import { useEffect, useState } from 'react';
import { Cloud, Cpu, GitBranch, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';

// ── Score bar ─────────────────────────────────────────────────────────────────
const ScoreBar = ({ value, max = 1, color, label, animated }) => {
  const [width, setWidth] = useState(0);
  const pct = Math.round((value / max) * 100);

  useEffect(() => {
    if (animated) {
      const t = setTimeout(() => setWidth(pct), 200);
      return () => clearTimeout(t);
    }
    setWidth(pct);
  }, [pct, animated]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{
        height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${width}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
};

// ── Stage card ────────────────────────────────────────────────────────────────
const Stage = ({ icon: Icon, title, subtitle, status, children, delay = 0, isRunning }) => {
  const [visible, setVisible] = useState(!isRunning);

  useEffect(() => {
    if (isRunning) {
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }
    setVisible(true);
  }, [isRunning, delay]);

  const borderColor = status === 'pass'   ? '#22c55e'
                    : status === 'warn'   ? '#f59e0b'
                    : status === 'fail'   ? '#ef4444'
                    : status === 'active' ? '#6366f1'
                    : '#e2e8f0';

  const bgColor     = status === 'pass'   ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)'
                    : status === 'warn'   ? 'linear-gradient(135deg,#fffbeb,#fef3c7)'
                    : status === 'fail'   ? 'linear-gradient(135deg,#fff1f2,#ffe4e6)'
                    : status === 'active' ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)'
                    : 'linear-gradient(135deg,#f8fafc,#f1f5f9)';

  const statusIcon  = status === 'pass'   ? <CheckCircle size={16} color="#22c55e" />
                    : status === 'warn'   ? <AlertCircle size={16} color="#f59e0b" />
                    : status === 'fail'   ? <XCircle size={16} color="#ef4444" />
                    : status === 'active' ? <Zap size={16} color="#6366f1" />
                    : null;

  return (
    <div style={{
      background: bgColor,
      border: `2px solid ${borderColor}`,
      borderRadius: 16,
      padding: '16px 18px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{subtitle}</div>
        </div>
        {statusIcon}
      </div>
      {visible && children}
    </div>
  );
};

// ── Pulse dot ─────────────────────────────────────────────────────────────────
const PulseDot = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
    <div style={{
      width: 2, height: 24, background: 'linear-gradient(#6366f1,#a5b4fc)',
      borderRadius: 99,
    }} />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AIPipelineVisualizer = ({
  fraudScore    = 0.08,
  anomalyScore  = 0,
  decision      = 'AUTO_APPROVED',
  triggered     = true,
  reasonCodes   = [],
  isRunning     = false,
}) => {
  const fraudStatus   = fraudScore > 0.70   ? 'fail'
                      : fraudScore >= 0.30  ? 'warn'
                      : 'pass';

  const decisionStatus = decision === 'AUTO_APPROVED' ? 'pass'
                       : decision === 'REJECTED'       ? 'fail'
                       : 'warn';

  const decisionLabel  = decision === 'AUTO_APPROVED' ? '✅ Claim Auto-Approved'
                       : decision === 'REJECTED'       ? '❌ Claim Rejected'
                       : '⚠️ Flagged for Manual Review';

  const decisionColor  = decision === 'AUTO_APPROVED' ? '#15803d'
                       : decision === 'REJECTED'       ? '#b91c1c'
                       : '#b45309';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* Stage 1: Parametric Trigger */}
      <Stage
        icon={Cloud}
        title="Parametric Trigger Check"
        subtitle="OpenWeatherMap Oracle · IMD Cross-validation"
        status={triggered ? 'pass' : 'fail'}
        delay={0}
        isRunning={isRunning}
      >
        <div style={{ fontSize: 12, color: triggered ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
          {triggered
            ? '✓ Weather event confirmed in worker zone'
            : '✗ No qualifying weather event — claim ineligible'}
        </div>
        {triggered && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {['HEAVY_RAIN', 'FLOOD_RISK'].map(r => (
              <span key={r} style={{
                fontSize: 10, fontWeight: 700,
                background: '#dcfce7', color: '#15803d',
                borderRadius: 6, padding: '2px 8px', border: '1px solid #bbf7d0',
              }}>{r}</span>
            ))}
          </div>
        )}
      </Stage>

      <PulseDot />

      {/* Stage 2: LightGBM Fraud Scorer */}
      <Stage
        icon={Cpu}
        title="LightGBM Fraud Classifier"
        subtitle="AUC-ROC 0.914 · Precision 92.3% · 9 features"
        status={fraudStatus}
        delay={600}
        isRunning={isRunning}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ScoreBar
            value={fraudScore}
            label="Fraud Score"
            color={fraudScore > 0.70 ? '#ef4444' : fraudScore >= 0.30 ? '#f59e0b' : '#22c55e'}
            animated={isRunning}
          />
          <ScoreBar
            value={Math.abs(anomalyScore)}
            label="Anomaly Signal (Isolation Forest)"
            color={Math.abs(anomalyScore) > 0.10 ? '#f59e0b' : '#22c55e'}
            animated={isRunning}
          />
          {reasonCodes.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
              {reasonCodes.map(r => (
                <span key={r} style={{
                  fontSize: 10, fontWeight: 700,
                  background: '#fff7ed', color: '#c2410c',
                  borderRadius: 6, padding: '2px 8px', border: '1px solid #fed7aa',
                }}>{r}</span>
              ))}
            </div>
          )}
        </div>
      </Stage>

      <PulseDot />

      {/* Stage 3: Decision Gate */}
      <Stage
        icon={GitBranch}
        title="Ensemble Decision Gate"
        subtitle="fraud < 0.30 → Auto-Approve · 0.30–0.70 → Flag · > 0.70 → Reject"
        status={decisionStatus}
        delay={1200}
        isRunning={isRunning}
      >
        <div style={{
          fontSize: 14, fontWeight: 800, color: decisionColor,
          letterSpacing: '0.02em',
        }}>
          {decisionLabel}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
          Fraud score: {(fraudScore * 100).toFixed(1)}% ·
          Threshold: {decision === 'AUTO_APPROVED' ? '< 30%' : decision === 'REJECTED' ? '> 70%' : '30–70%'}
        </div>
      </Stage>

    </div>
  );
};

export default AIPipelineVisualizer;
