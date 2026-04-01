/**
 * AdminLogin — authoritative portal login.
 * Uses a two-panel layout mirroring the worker login for brand consistency.
 * Admin panel uses rose accent instead of indigo to signal elevated privilege.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', form);
      login(data.token, data.admin, 'admin');
      toast.success(`Welcome, ${data.admin.name}!`);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-rose-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">GigShield Admin</span>
        </div>

        <div>
          <p className="text-rose-200 text-sm font-semibold uppercase tracking-widest mb-3">Operations Portal</p>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Insurance operations<br />at a glance.
          </h1>
          <p className="text-rose-200 text-lg leading-relaxed">
            Review claims, manage workers, detect fraud, and declare disruptions —
            all from one powerful dashboard.
          </p>

          <div className="mt-10 space-y-3">
            {['Review & approve insurance claims', 'Detect and flag fraudulent patterns', 'Manage registered delivery workers', 'Declare severe weather disruptions'].map(item => (
              <div key={item} className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-rose-300 text-sm">Restricted access — authorized personnel only.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--color-background)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[var(--color-text-primary)] font-bold text-lg">GigShield Admin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Admin Sign In</h2>
            <p className="text-[var(--color-text-muted)] mt-1.5 text-sm">GigShield insurance operations portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div className="form-group">
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  id="email"
                  className="input-field pl-10"
                  type="email"
                  placeholder="admin@gigshield.in"
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
                  placeholder="Admin password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn w-full py-3 text-base bg-rose-600 hover:bg-rose-700 text-white shadow-sm rounded-lg"
              disabled={loading}
            >
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><span>Sign In as Admin</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-rose-50 border border-rose-100">
            <p className="text-xs font-semibold text-rose-700 mb-1">🧪 Demo credentials</p>
            <p className="text-xs text-rose-600 font-mono">
              admin@gigshield.in &nbsp;|&nbsp; Admin@123
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-8 text-xs text-[var(--color-text-disabled)]">
            <Link to="/worker/login"   className="hover:text-[var(--color-text-muted)] transition-colors">Worker Portal</Link>
            <Link to="/platform/login" className="hover:text-[var(--color-text-muted)] transition-colors">Partner Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
