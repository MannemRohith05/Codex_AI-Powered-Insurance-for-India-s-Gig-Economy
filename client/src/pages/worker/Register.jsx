/**
 * Worker Register Page — clean multi-field auth form.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Shield, User, Phone, Lock, Building2, MapPin, Wallet, Smartphone, Eye, EyeOff, ArrowRight, IndianRupee } from 'lucide-react';

const PLATFORMS = ['Swiggy', 'Zomato', 'Zepto', 'Dunzo', 'Porter', 'Amazon', 'Other'];
const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Vijayawada', 'Jaipur', 'Surat'];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '', platform: '', city: '', zone_pin_code: '', declared_weekly_income_inr: '', upi_id: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password || !form.platform)
      return toast.error('Please fill all required fields');
    if (form.password.length < 8)
      return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const res = await api.post('/worker/register', {
        ...form,
        declared_weekly_income_inr: form.declared_weekly_income_inr ? parseFloat(form.declared_weekly_income_inr) : 0,
        device_id: `web_${navigator.userAgent.slice(0, 30)}`,
      });
      const tierMsg = res.data.risk_tier ? ` Your risk tier: ${res.data.risk_tier} (₹${res.data.premium_recommendation_inr}/week).` : '';
      toast.success(`Registration successful! OTP sent to your phone.${tierMsg}`);
      navigate('/worker/verify-otp', { state: { phone: form.phone } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Join GigShield
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Create your delivery partner account in minutes
          </p>
        </div>

        {/* Form card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="name" className="label">
                  <User className="w-3.5 h-3.5 inline mr-1.5" />Full Name *
                </label>
                <input
                  id="name" name="name" className="input-field"
                  autoComplete="name" placeholder="Ravi Kumar"
                  value={form.name} onChange={handleChange} required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone" className="label">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5" />Phone *
                </label>
                <input
                  id="phone" name="phone" className="input-field"
                  type="tel" autoComplete="tel" placeholder="+919876543210"
                  value={form.phone} onChange={handleChange} required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="label">
                <Lock className="w-3.5 h-3.5 inline mr-1.5" />Password *
              </label>
              <div className="relative">
                <input
                  id="password" name="password" className="input-field pr-10"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" placeholder="Min. 8 characters"
                  value={form.password} onChange={handleChange} required minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Platform + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="platform" className="label">
                  <Building2 className="w-3.5 h-3.5 inline mr-1.5" />Platform *
                </label>
                <select
                  id="platform" name="platform" className="input-field"
                  value={form.platform} onChange={handleChange} required
                >
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="city" className="label">
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5" />City
                </label>
                <select
                  id="city" name="city" className="input-field"
                  value={form.city} onChange={handleChange}
                >
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Zone Pin Code + Weekly Income */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="zone_pin_code" className="label">
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5" />Area PIN Code
                </label>
                <input
                  id="zone_pin_code" name="zone_pin_code" className="input-field"
                  type="text" placeholder="e.g. 500001" maxLength={6}
                  value={form.zone_pin_code} onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="declared_weekly_income_inr" className="label">
                  <IndianRupee className="w-3.5 h-3.5 inline mr-1.5" />Avg Weekly Income
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">₹</span>
                  <input
                    id="declared_weekly_income_inr" name="declared_weekly_income_inr" className="input-field pl-7"
                    type="number" placeholder="e.g. 5000"
                    value={form.declared_weekly_income_inr} onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* UPI */}
            <div className="form-group">
              <label htmlFor="upi_id" className="label">
                <Wallet className="w-3.5 h-3.5 inline mr-1.5" />UPI ID
                <span className="text-[var(--color-text-muted)] font-normal ml-1">(for instant payouts)</span>
              </label>
              <input
                id="upi_id" name="upi_id" className="input-field"
                autoComplete="off" placeholder="name@okicici"
                value={form.upi_id} onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 mt-2 text-base"
              disabled={loading}
            >
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><Smartphone className="w-4 h-4" /><span>Create Account & Get OTP</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <hr className="divider my-6" />

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Already have an account?{' '}
            <Link to="/worker/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
