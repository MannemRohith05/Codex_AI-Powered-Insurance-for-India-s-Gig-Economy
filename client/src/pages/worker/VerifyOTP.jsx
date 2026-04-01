/**
 * VerifyOTP — clean, focused single-action screen.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Shield, MessageSquare, RefreshCw, ArrowRight } from 'lucide-react';

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
    } catch {
      toast.error('Failed to resend OTP');
    } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-success-50 border border-success-200 rounded-2xl mb-4">
            <MessageSquare className="w-7 h-7 text-success-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Verify your phone
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-[var(--color-text-secondary)] font-mono">
              {phone || 'your phone'}
            </span>
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="form-group">
              <label htmlFor="otp" className="label">6-Digit OTP Code</label>
              <input
                id="otp"
                className="input-field text-center text-3xl font-mono tracking-[0.5em] py-4"
                placeholder="······"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-success w-full py-3 text-base"
              disabled={loading}
            >
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><Shield className="w-4 h-4" /><span>Verify & Continue</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="mt-5 p-3.5 rounded-lg bg-primary-50 border border-primary-100">
            <p className="text-xs text-primary-700">
              🔧 Dev mode: check server console for OTP, or use{' '}
              <code className="font-semibold bg-primary-100 px-1 rounded">123456</code>{' '}
              if Twilio is not configured.
            </p>
          </div>

          <button
            onClick={handleResend}
            disabled={resending}
            className="btn-ghost w-full mt-4 text-sm"
          >
            {resending
              ? <span className="spinner text-[var(--color-text-muted)]" />
              : <><RefreshCw className="w-3.5 h-3.5" /><span>Resend OTP</span></>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
