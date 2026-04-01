/**
 * PlatformLogin — partner portal login.
 * Emerald accent, mirroring the worker/admin pattern.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

const PlatformLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/platform/login', form);
      login(data.token, data.partner, 'platform');
      toast.success(`Welcome, ${data.partner.company_name}!`);
      navigate('/platform/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">GigShield Partner</span>
        </div>

        <div>
          <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest mb-3">Platform Portal</p>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Empower your<br />delivery workforce.
          </h1>
          <p className="text-emerald-200 text-lg leading-relaxed">
            Real-time visibility into worker coverage, live claim feeds,
            and aggregate protection metrics for your platform.
          </p>

          <div className="mt-10 space-y-3">
            {['Track worker insurance enrollment', 'Live claim status feed', 'Aggregate payout analytics', 'Worker onboarding management'].map(item => (
              <div key={item} className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-emerald-300 text-sm">Swiggy • Zomato • Zepto • Dunzo partner access.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--color-background)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[var(--color-text-primary)] font-bold text-lg">GigShield Partner</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Platform Sign In</h2>
            <p className="text-[var(--color-text-muted)] mt-1.5 text-sm">Swiggy / Zomato / Zepto partner portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div className="form-group">
              <label htmlFor="email" className="label">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  id="email"
                  className="input-field pl-10"
                  type="email"
                  placeholder="partner@swiggy.com"
                  autoComplete="username email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  id="password"
                  className="input-field pl-10"
                  type="password"
                  placeholder="Partner password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn w-full py-3 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg"
              disabled={loading}
            >
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><span>Sign In as Platform</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 mb-1">🧪 Demo credentials</p>
            <p className="text-xs text-emerald-600 font-mono">
              partner@swiggy.com &nbsp;|&nbsp; Partner@123
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-8 text-xs text-[var(--color-text-disabled)]">
            <Link to="/worker/login" className="hover:text-[var(--color-text-muted)] transition-colors">Worker Portal</Link>
            <Link to="/admin/login"  className="hover:text-[var(--color-text-muted)] transition-colors">Admin Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformLogin;
