/**
 * Worker Register — Phase 2 enhanced.
 *
 * Step 1: Registration form with occupation type + Aadhaar mock upload
 * Step 2: Worker ID success card with risk tier + weekly premium
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import {
  Shield, User, Phone, Lock, Building2, MapPin, Wallet,
  Smartphone, Eye, EyeOff, ArrowRight, IndianRupee,
  HardHat, Truck, ShoppingBag, Home, Factory, Car, Upload,
  CheckCircle, Copy, Cpu
} from 'lucide-react';
import { cn } from '../../utils/cn';

const PLATFORMS = ['Swiggy', 'Zomato', 'Zepto', 'Dunzo', 'Porter', 'Amazon', 'Other'];
const CITIES    = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Vijayawada', 'Jaipur', 'Surat'];

const OCCUPATIONS = [
  { value: 'delivery_rider',      label: 'Delivery Rider',      icon: Truck,       risk: 'Medium' },
  { value: 'construction_worker', label: 'Construction Worker',  icon: HardHat,     risk: 'High'   },
  { value: 'street_vendor',       label: 'Street Vendor',        icon: ShoppingBag, risk: 'Low'    },
  { value: 'domestic_worker',     label: 'Domestic Worker',      icon: Home,        risk: 'Low'    },
  { value: 'factory_worker',      label: 'Factory Worker',       icon: Factory,     risk: 'Medium' },
  { value: 'auto_driver',         label: 'Auto / Cab Driver',    icon: Car,         risk: 'Medium' },
];

const RISK_COLOR = {
  Low:    'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  High:   'text-rose-600 bg-rose-50 border-rose-200',
};

// Worker ID Success Card
const SuccessCard = ({ workerId, name, occupation, riskTier, premium, onContinue }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(workerId).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };
  const tier = riskTier || 'LOW';
  const riskLabel = tier === 'HIGH' ? 'High' : tier === 'MEDIUM' ? 'Medium' : 'Low';
  const cardBorder = tier === 'HIGH' ? 'border-rose-200 bg-rose-50' : tier === 'MEDIUM' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
          <CheckCircle className="w-9 h-9 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">You're registered!</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">OTP sent to your phone. Save your Worker ID below.</p>
      </div>

      <div className={`rounded-2xl border-2 p-6 mb-4 shadow-lg ${cardBorder}`}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary-600" />
          <span className="font-bold text-sm text-[var(--color-text-primary)] tracking-wide uppercase">GigShield Worker ID</span>
        </div>
        <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between gap-2 border border-[var(--color-border)]">
          <span className="font-mono text-lg font-bold text-primary-700 tracking-widest">{workerId}</span>
          <button onClick={copy} className="p-1.5 rounded-lg hover:bg-slate-100 text-[var(--color-text-muted)] transition-colors">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Name</p>
            <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Occupation</p>
            <p className="font-semibold text-[var(--color-text-primary)] capitalize">{(occupation || '').replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1"><Cpu className="w-3 h-3" /> AI Risk Tier</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${RISK_COLOR[riskLabel]}`}>{tier}</span>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Weekly Premium</p>
            <p className="font-bold text-[var(--color-text-primary)]">Rs.{premium ?? '--'}/week</p>
          </div>
        </div>
      </div>

      <button onClick={onContinue} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
        Verify OTP <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// Main Register Component
const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', password: '', platform: '',
    occupation_type: '', city: '', zone_pin_code: '',
    declared_weekly_income_inr: '', upi_id: '',
  });
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [aadhaarFile, setAadhaarFile]         = useState(null);
  const [aadhaarDragging, setAadhaarDragging] = useState(false);
  const [success, setSuccess]                 = useState(null);

  const handleChange     = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleOccupation = val => setForm(f => ({ ...f, occupation_type: val }));

  const handleAadhaarDrop = e => {
    e.preventDefault(); setAadhaarDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setAadhaarFile(file); toast.info('Aadhaar document attached (demo mode)'); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password || !form.platform)
      return toast.error('Please fill all required fields');
    if (!form.occupation_type)
      return toast.error('Please select your occupation type');
    if (form.password.length < 8)
      return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const res = await api.post('/worker/register', {
        ...form,
        declared_weekly_income_inr: form.declared_weekly_income_inr ? parseFloat(form.declared_weekly_income_inr) : 0,
        device_id: `web_${navigator.userAgent.slice(0, 30)}`,
        aadhaar_mock_attached: !!aadhaarFile,
      });
      const rawId    = res.data.worker_id || `${Date.now().toString(36).toUpperCase()}`;
      const workerId = `WS-${rawId.toString().slice(-8).toUpperCase()}`;
      setSuccess({
        workerId,
        name:       form.name,
        occupation: form.occupation_type,
        riskTier:   res.data.risk_tier || 'LOW',
        premium:    res.data.premium_recommendation_inr,
        phone:      form.phone,
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4 py-10">
        <SuccessCard {...success} onContinue={() => navigate('/worker/verify-otp', { state: { phone: success.phone } })} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Join GigShield</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Create your income protection account in minutes</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">

            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="name" className="label"><User className="w-3.5 h-3.5 inline mr-1.5" />Full Name *</label>
                <input id="name" name="name" className="input-field" autoComplete="name" placeholder="Ravi Kumar"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="phone" className="label"><Phone className="w-3.5 h-3.5 inline mr-1.5" />Phone *</label>
                <input id="phone" name="phone" className="input-field" type="tel" autoComplete="tel" placeholder="+919876543210"
                  value={form.phone} onChange={handleChange} required />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="label"><Lock className="w-3.5 h-3.5 inline mr-1.5" />Password *</label>
              <div className="relative">
                <input id="password" name="password" className="input-field pr-10"
                  type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Min. 8 characters"
                  value={form.password} onChange={handleChange} required minLength={8} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  aria-label={showPassword ? 'Hide' : 'Show'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Occupation Type */}
            <div className="form-group">
              <label className="label flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" />Occupation Type *
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold flex items-center gap-0.5 ml-1">
                  <Cpu className="w-2.5 h-2.5" />AI Risk
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {OCCUPATIONS.map(occ => {
                  const Icon = occ.icon;
                  const selected = form.occupation_type === occ.value;
                  return (
                    <button type="button" key={occ.value} onClick={() => handleOccupation(occ.value)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150 ${selected ? 'border-primary-500 bg-primary-50' : 'border-[var(--color-border)] hover:border-slate-300 hover:bg-slate-50'}`}>
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${selected ? 'text-primary-600' : 'text-[var(--color-text-muted)]'}`} />
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${RISK_COLOR[occ.risk]}`}>{occ.risk}</span>
                      </div>
                      <span className={`text-xs font-semibold leading-tight ${selected ? 'text-primary-700' : 'text-[var(--color-text-secondary)]'}`}>{occ.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="platform" className="label"><Building2 className="w-3.5 h-3.5 inline mr-1.5" />Platform *</label>
                <select id="platform" name="platform" className="input-field" value={form.platform} onChange={handleChange} required>
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="city" className="label"><MapPin className="w-3.5 h-3.5 inline mr-1.5" />City</label>
                <select id="city" name="city" className="input-field" value={form.city} onChange={handleChange}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Zone PIN + Weekly Income */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="zone_pin_code" className="label"><MapPin className="w-3.5 h-3.5 inline mr-1.5" />Work Zone PIN</label>
                <input id="zone_pin_code" name="zone_pin_code" className="input-field"
                  type="text" placeholder="e.g. 500001" maxLength={6}
                  value={form.zone_pin_code} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="declared_weekly_income_inr" className="label"><IndianRupee className="w-3.5 h-3.5 inline mr-1.5" />Avg Weekly Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">Rs.</span>
                  <input id="declared_weekly_income_inr" name="declared_weekly_income_inr" className="input-field pl-9"
                    type="number" placeholder="e.g. 5000"
                    value={form.declared_weekly_income_inr} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Aadhaar Upload */}
            <div className="form-group">
              <label className="label"><Upload className="w-3.5 h-3.5 inline mr-1.5" />Aadhaar / ID Upload <span className="text-[var(--color-text-muted)] font-normal">(mock KYC)</span></label>
              <div
                onDragOver={e => { e.preventDefault(); setAadhaarDragging(true); }}
                onDragLeave={() => setAadhaarDragging(false)}
                onDrop={handleAadhaarDrop}
                onClick={() => document.getElementById('aadhaar-input').click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${aadhaarDragging ? 'border-primary-400 bg-primary-50' : aadhaarFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}`}>
                <input id="aadhaar-input" type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => { const f = e.target.files[0]; if (f) { setAadhaarFile(f); toast.info('Aadhaar attached (demo mode)'); } }} />
                {aadhaarFile ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">{aadhaarFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[var(--color-text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--color-text-secondary)]">Drag and drop or <span className="text-primary-600 font-medium">click to browse</span></p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">JPG, PNG, PDF — for demo purposes only</p>
                  </>
                )}
              </div>
            </div>

            {/* UPI */}
            <div className="form-group">
              <label htmlFor="upi_id" className="label">
                <Wallet className="w-3.5 h-3.5 inline mr-1.5" />UPI ID
                <span className="text-[var(--color-text-muted)] font-normal ml-1">(for instant payouts)</span>
              </label>
              <input id="upi_id" name="upi_id" className="input-field"
                autoComplete="off" placeholder="name@okicici"
                value={form.upi_id} onChange={handleChange} />
            </div>

            <button type="submit" className="btn-primary w-full py-3 mt-2 text-base" disabled={loading}>
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><Smartphone className="w-4 h-4" /><span>Create Account & Get OTP</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <hr className="divider my-6" />
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Already have an account?{' '}
            <Link to="/worker/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
