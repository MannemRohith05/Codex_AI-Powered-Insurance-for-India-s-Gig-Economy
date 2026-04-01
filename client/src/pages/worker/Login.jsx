/**
 * Worker Login Page — clean, professional auth layout.
 * 
 * Design rationale:
 * - Split layout on desktop: left branding panel + right form
 * - Single centered card on mobile
 * - Demo credentials shown in a subtle info box — helps evaluators/teammates
 * - No particles, no 3D, no glows — pure clarity
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/worker/login', form);
      login(data.token, data.worker, 'worker');
      toast.success(`Welcome back, ${data.worker.name}!`);
      navigate('/worker/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">GigShield</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your income,<br />protected every shift.
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            Rain, heatwaves, floods, or poor air quality — when disruptions happen,
            your earnings are automatically protected with instant payouts.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Active Policies', value: '12,000+' },
              { label: 'Claims Paid',     value: '₹2.4 Cr' },
              { label: 'Avg. Payout',     value: '< 2 hrs'  },
              { label: 'Cities Covered',  value: '18'        },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-primary-200 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-300 text-sm">
          © 2025 GigShield. Income protection for India's gig workforce.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--color-background)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[var(--color-text-primary)] font-bold text-lg">GigShield</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1.5 text-sm">
              Delivery partner login — enter your credentials below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {/* Phone */}
            <div className="form-group">
              <label htmlFor="phone" className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  id="phone"
                  className="input-field pl-10"
                  type="tel"
                  placeholder="+919876543210"
                  value={form.phone}
                  autoComplete="username tel"
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  id="password"
                  className="input-field pl-10 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
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

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
            Don't have an account?{' '}
            <Link to="/worker/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-lg bg-primary-50 border border-primary-100">
            <p className="text-xs font-semibold text-primary-700 mb-1">🧪 Demo credentials</p>
            <p className="text-xs text-primary-600 font-mono">
              Phone: +919000000001 &nbsp;|&nbsp; Password: Worker@123
            </p>
          </div>

          {/* Portal links */}
          <div className="flex justify-center gap-6 mt-8 text-xs text-[var(--color-text-disabled)]">
            <Link to="/admin/login"    className="hover:text-[var(--color-text-muted)] transition-colors">Admin Portal</Link>
            <Link to="/platform/login" className="hover:text-[var(--color-text-muted)] transition-colors">Partner Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
