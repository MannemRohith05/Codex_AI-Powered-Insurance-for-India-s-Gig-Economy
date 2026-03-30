import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const KYC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1=enter aadhaar, 2=enter otp, 3=verified
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
      toast.success('OTP sent to Aadhaar-linked mobile number');
    } catch (err) {
      toast.error(err.response?.data?.error || 'KYC initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/worker/kyc/verify', { ref_id: refId, otp, aadhaar_number: aadhaar.replace(/\s/g, '') });
      setStep(3);
      toast.success('Aadhaar KYC verified successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
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
          <div className="mb-6">
            <h1 className="section-title">Aadhaar KYC Verification</h1>
            <p className="section-sub">Complete KYC to submit claims and increase your coverage limit</p>
          </div>

          {step === 3 ? (
            <div className="card border border-emerald-500/30 text-center py-10">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white">KYC Verified!</h2>
              <p className="text-slate-400 mt-2">Your Aadhaar identity has been successfully verified. You can now file claims up to your full coverage limit.</p>
            </div>
          ) : (
            <div className="card border border-slate-800">
              {/* Steps indicator */}
              <div className="flex items-center gap-3 mb-6">
                {[1, 2].map(s => (
                  <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${step === s ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30' : step > s ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-600 border border-slate-800'}`}>
                    {step > s ? <CheckCircle className="w-3 h-3" /> : <span>{s}</span>}
                    {s === 1 ? 'Enter Aadhaar' : 'Verify OTP'}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <form onSubmit={handleInitiate} className="space-y-4">
                  <div>
                    <label className="label">Aadhaar Number</label>
                    <input
                      className="input-field text-lg font-mono tracking-widest"
                      placeholder="XXXX XXXX XXXX"
                      value={aadhaar}
                      onChange={e => setAadhaar(formatAadhaar(e.target.value))}
                      maxLength={14}
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">Your Aadhaar number is hashed and securely stored (SHA-256)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">An OTP will be sent to the mobile number registered with your Aadhaar.</p>
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
                    {loading ? <div className="spinner" /> : <><Shield className="w-4 h-4" /> Send OTP</>}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="label">Enter OTP</label>
                    <input
                      className="input-field text-center text-2xl font-mono tracking-widest"
                      placeholder="______"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      inputMode="numeric"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">🔧 Dev mode: enter any 6-digit code (API is mocked)</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                    <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
                      {loading ? <div className="spinner" /> : 'Verify & Complete KYC'}
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
