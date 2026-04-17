/**
 * ActuarialHealthCard — IRDAI-Standard Pool Sustainability Dashboard
 *
 * Displays the live actuarial health of the GigShield insurance pool:
 *   - Loss Ratio gauge with GREEN/AMBER/RED verdict
 *   - Reserve Adequacy Ratio
 *   - Weekly Burn Rate
 *   - Projected months of runway
 *   - Recommended actions
 *   - Stress Loading Factor applied to new premiums
 *
 * Fetches from GET /api/admin/actuarial-health
 * Admin-only component.
 */
import { useState, useEffect } from 'react';
import { TrendingUp, Shield, AlertTriangle, CheckCircle, RefreshCw, Activity, Zap } from 'lucide-react';
import api from '../utils/api';

// ── Gauge Arc ─────────────────────────────────────────────────────────────────
const GaugeArc = ({ value, max = 1, color, label, benchmark }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const stroke = color;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={110} height={70} viewBox="0 0 110 70">
        {/* Background arc (half circle) */}
        <path
          d="M 10 60 A 45 45 0 0 1 100 60"
          fill="none" stroke="#f1f5f9" strokeWidth={10} strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 60 A 45 45 0 0 1 100 60"
          fill="none" stroke={stroke} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 142} 142`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Center text */}
        <text x="55" y="56" textAnchor="middle" fontSize="15" fontWeight="800" fill="#1e293b">
          {(value * 100).toFixed(0)}%
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{label}</div>
        {benchmark && (
          <div style={{ fontSize: 10, color: '#94a3b8' }}>IRDAI benchmark: {benchmark}</div>
        )}
      </div>
    </div>
  );
};

// ── Stat tile ─────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, unit, icon: Icon, color = '#6366f1', sub }) => (
  <div style={{
    background: '#f8fafc', borderRadius: 12, padding: '12px 14px',
    border: '1px solid #e2e8f0', flex: 1, minWidth: 120,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
      {value}<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginLeft: 2 }}>{unit}</span>
    </div>
    {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ── Verdict banner ────────────────────────────────────────────────────────────
const VerdictBanner = ({ verdict, color, stress_loading_factor }) => {
  const icons = { GREEN: CheckCircle, AMBER: AlertTriangle, RED: AlertTriangle };
  const Icon  = icons[verdict] || CheckCircle;
  const msgs  = {
    GREEN: 'Pool is healthy — no premium adjustment needed',
    AMBER: `Stress loading active: +${Math.round((stress_loading_factor - 1) * 100)}% on new premiums`,
    RED:   `Emergency surcharge: +${Math.round((stress_loading_factor - 1) * 100)}% — immediate action required`,
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      background: `${color}15`, border: `2px solid ${color}40`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color }}>
          {verdict} — Pool {verdict === 'GREEN' ? 'Healthy' : verdict === 'AMBER' ? 'Under Stress' : 'Critical'}
        </div>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{msgs[verdict]}</div>
      </div>
      {stress_loading_factor > 1 && (
        <div style={{
          marginLeft: 'auto', background: color, color: '#fff',
          fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
          flexShrink: 0,
        }}>
          ×{stress_loading_factor.toFixed(2)}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ActuarialHealthCard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [recalib, setRecalib] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get('/admin/actuarial-health');
      setData(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load actuarial data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalibrate = async () => {
    setRecalib(true);
    try {
      await api.post('/admin/recalibrate-premiums');
      await fetchData();
    } finally {
      setRecalib(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const verdictColor = data?.verdict_color || '#22c55e';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        padding: '18px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
              Actuarial Health Monitor
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              IRDAI-standard pool sustainability metrics
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '6px 12px', color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {error && (
          <div style={{
            padding: 16, background: '#fff1f2', borderRadius: 12,
            border: '1px solid #fecdd3', color: '#b91c1c', fontSize: 13,
          }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Verdict Banner */}
            <VerdictBanner
              verdict={data.sustainability_verdict}
              color={verdictColor}
              stress_loading_factor={data.stress_loading_factor}
            />

            {/* Gauges */}
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 }}>
              <GaugeArc
                value={data.loss_ratio}
                label="Loss Ratio"
                color={data.loss_ratio < 0.70 ? '#22c55e' : data.loss_ratio < 0.90 ? '#f59e0b' : '#ef4444'}
                benchmark="< 70%"
              />
              <GaugeArc
                value={Math.min(data.reserve_adequacy_ratio, 3) / 3}
                label="Reserve Adequacy"
                color={data.is_reserve_adequate ? '#22c55e' : '#ef4444'}
                benchmark="≥ 100%"
              />
            </div>

            {/* Stat tiles */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <StatTile
                label="Premiums Collected"
                value={`₹${(data.total_premiums_collected_inr / 1000).toFixed(1)}k`}
                icon={TrendingUp} color="#6366f1"
                sub="All time"
              />
              <StatTile
                label="Claims Paid"
                value={`₹${(data.total_claims_paid_inr / 1000).toFixed(1)}k`}
                icon={Activity} color="#22c55e"
                sub="All time"
              />
              <StatTile
                label="Weekly Burn"
                value={`₹${(data.weekly_payout_inr / 1000).toFixed(1)}k`}
                icon={Zap} color="#f59e0b"
                sub={`${data.claims_paid_last_7d} claims`}
              />
              {data.months_of_runway !== null && (
                <StatTile
                  label="Runway"
                  value={data.months_of_runway?.toFixed(1) ?? '∞'}
                  unit="mo"
                  icon={Shield}
                  color={data.months_of_runway > 3 ? '#22c55e' : '#ef4444'}
                  sub="at current burn rate"
                />
              )}
            </div>

            {/* Recommended Actions */}
            {data.recommended_actions?.length > 0 && (
              <div style={{
                background: `${verdictColor}08`,
                border: `1px solid ${verdictColor}30`,
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#475569',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Recommended Actions
                </div>
                {data.recommended_actions.map((a, i) => (
                  <div key={i} style={{
                    fontSize: 12, color: '#334155', marginBottom: 4,
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <span style={{ color: verdictColor, fontWeight: 700, flexShrink: 0 }}>→</span>
                    {a}
                  </div>
                ))}
              </div>
            )}

            {/* Recalibrate Button */}
            <button
              onClick={handleRecalibrate}
              disabled={recalib}
              style={{
                width: '100%', padding: '10px 0',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: recalib ? 0.7 : 1,
              }}
            >
              <Zap size={14} />
              {recalib ? 'Recalibrating...' : 'Recalibrate Premium Stress Loading'}
            </button>

            {/* IRDAI footnote */}
            <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
              {data.irdai_benchmarks?.standard} · Updated {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ActuarialHealthCard;
