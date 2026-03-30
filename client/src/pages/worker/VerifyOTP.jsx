import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Shield, MessageSquare, RefreshCw } from 'lucide-react';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const phone = location.state?.phone || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      await api.post('/worker/verify-otp', { phone, otp });
      toast.success('Phone verified! Please login.');
      navigate('/worker/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/worker/resend-otp', { phone });
      toast.success('OTP resent!');
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally { setResending(false); }
  };

  return (
    <div className="login-scene">
      <div className="login-scene-bg" />

      <div className="login-ambient-light" style={{ width: 350, height: 350, top: '20%', left: '10%', background: 'radial-gradient(circle, rgba(0,217,192,0.12) 0%, transparent 70%)' }} />
      <div className="login-ambient-light" style={{ width: 280, height: 280, bottom: '15%', right: '10%', background: 'radial-gradient(circle, rgba(255,107,53,0.10) 0%, transparent 70%)' }} />

      <div className="login-card-wrapper" style={{ maxWidth: 380 }}>
        <div className="text-center mb-8 float-in-1">
          <div className="shield-3d-wrapper inline-block mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #00f5dd, #00d9c0)', boxShadow: '0 10px 35px rgba(0,217,192,0.45), 0 0 60px rgba(0,217,192,0.15)' }}>
              <MessageSquare className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.40))' }} />
            </div>
          </div>
          <h1 className="hero-title gradient-text-teal" style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)' }}>
            Verify Phone
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(148,163,184,0.60)' }}>
            OTP sent to <span style={{ color: '#00d9c0', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{phone || 'your phone'}</span>
          </p>
        </div>

        <div className="card tilt-card float-in-2" style={{ padding: '28px' }}>
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="form-group">
              <label className="label">6-Digit OTP Code</label>
              <input
                className="input-field text-center text-2xl tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.35em' }}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>

            <button type="submit" className="btn-teal w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <div className="spinner" style={{ borderTopColor: '#050812' }} /> : <><Shield className="w-4 h-4" />Verify & Continue</>}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(0,217,192,0.05)', border: '1px solid rgba(0,217,192,0.12)' }}>
            <p className="text-xs" style={{ color: 'rgba(0,217,192,0.60)' }}>
              🔧 Dev mode: check server console for OTP, or use{' '}
              <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>123456</span> if Twilio is not configured.
            </p>
          </div>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm transition-colors"
            style={{ color: 'rgba(148,163,184,0.45)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff6b35'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.45)'}
          >
            {resending ? <div className="spinner" /> : <><RefreshCw className="w-3.5 h-3.5" />Resend OTP</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
