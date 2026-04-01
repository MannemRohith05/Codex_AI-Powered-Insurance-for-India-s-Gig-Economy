/**
 * KYC — Aadhaar verification flow (2-step).
 * Clean step indicator, form groups, light success state.
 */
import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const KYC = () => {
  const [step, setStep] = useState(1);
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [refId, setRefId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (aadhaar.replace(/\s/g, '').length !== 12) return toast.error('Enter valid 12-digit Aadhaar');
    setLoading(true);
    try {
      const { data } = await api.post('/worker/kyc/initiate', { aadhaar_number: aadhaar.replace(/\s/g, '') });
      setRefId(data.ref_id);
      setStep(2);
      toast.success('OTP sent to Aadhaar-linked mobile');
    } catch (err) {
      toast.error(err.response?.data?.error || 'KYC initiation failed');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/worker/kyc/verify', { ref_id: refId, otp, aadhaar_number: aadhaar.replace(/\s/g, '') });
      setStep(3);
      toast.success('Aadhaar KYC verified!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="max-w-lg mx-auto">
          <div className="page-header">
            <h1 className="page-title">Aadhaar KYC Verification</h1>
            <p className="page-subtitle">Complete KYC to submit claims and unlock your full coverage limit</p>
          </div>

          {step === 3 ? (
            /* ── Success state ── */
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-success-50 border border-success-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-success-600" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">KYC Verified!</h2>
              <p className="text-[var(--color-text-muted)] mt-2 text-sm max-w-xs mx-auto">
                Your Aadhaar identity has been verified. You can now file claims up to your full coverage limit.
              </p>
            </div>
          ) : (
            <div className="card p-6">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6">
                {[1, 2].map(s => (
                  <div
                    key={s}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      step === s
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : step > s
                        ? 'bg-success-50 text-success-700 border-success-200'
                        : 'text-[var(--color-text-muted)] border-[var(--color-border)]'
                    )}
                  >
                    {step > s ? <CheckCircle className="w-3 h-3" /> : <span>{s}</span>}
                    {s === 1 ? 'Enter Aadhaar' : 'Verify OTP'}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <form onSubmit={handleInitiate} className="space-y-5">
                  <div className="form-group">
                    <label htmlFor="aadhaar" className="label">Aadhaar Number</label>
                    <input
                      id="aadhaar"
                      className="input-field text-lg font-mono tracking-widest"
                      placeholder="XXXX XXXX XXXX"
                      value={aadhaar}
                      onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                      maxLength={14}
                      inputMode="numeric"
                      required
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                      Your Aadhaar is hashed (SHA-256) — never stored in plain text.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-warning-50 border border-warning-200">
                    <AlertCircle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-warning-700">
                      An OTP will be sent to the mobile number registered with your Aadhaar.
                    </p>
                  </div>
                  <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                    {loading
                      ? <span className="spinner border-white border-t-transparent" />
                      : <><Shield className="w-4 h-4" /><span>Send OTP</span></>
                    }
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="form-group">
                    <label htmlFor="kyc-otp" className="label">Enter OTP</label>
                    <input
                      id="kyc-otp"
                      className="input-field text-center text-2xl font-mono tracking-[0.5em] py-4"
                      placeholder="······"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      inputMode="numeric"
                      required
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                      🔧 Dev mode: enter any 6-digit code (API is mocked)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                      ← Back
                    </button>
                    <button type="submit" className="btn-primary flex-1" disabled={loading}>
                      {loading
                        ? <span className="spinner border-white border-t-transparent" />
                        : 'Verify & Complete KYC'
                      }
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default KYC;
