import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Phone, Lock, Eye, EyeOff, Zap } from 'lucide-react';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1.2,
  left: Math.random() * 100,
  delay: Math.random() * 16,
  duration: Math.random() * 12 + 9,
  isOrange: Math.random() > 0.5,
}));

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
    <div className="login-scene">
      <div className="login-scene-bg" />
      <div className="login-scene-grid" />

      {/* Particles */}
      <div className="particles-layer">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className={`particle ${p.isOrange ? 'particle-orange' : 'particle-teal'}`}
            style={{
              width: p.size, height: p.size,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient blobs */}
      <div className="login-ambient-light" style={{
        width: 400, height: 400, top: '5%', left: '-10%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.14) 0%, transparent 70%)',
      }} />
      <div className="login-ambient-light" style={{
        width: 350, height: 350, bottom: '5%', right: '-8%',
        background: 'radial-gradient(circle, rgba(0,217,192,0.12) 0%, transparent 70%)',
      }} />

      {/* Card wrapper */}
      <div className="login-card-wrapper">

        {/* Logo */}
        <div className="text-center mb-8 float-in-1">
          <div className="shield-3d-wrapper inline-block mb-4">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl neon-border"
              style={{
                background: 'linear-gradient(135deg, rgba(255,140,90,0.95), rgba(255,107,53,0.95))',
                boxShadow: '0 12px 40px rgba(255,107,53,0.50), 0 0 80px rgba(255,107,53,0.20)',
              }}
            >
              <Shield className="w-10 h-10 text-white" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.40))' }} />
            </div>
          </div>
          <h1
            className="hero-title gradient-text"
            style={{ fontSize: '2.3rem', fontFamily: 'var(--font-display)' }}
          >
            GigShield
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(0,217,192,0.65)', fontWeight: 500 }}>
            Income protection for gig workers
          </p>
        </div>

        {/* Form card */}
        <div className="card tilt-card float-in-2" style={{ padding: '28px' }}>
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4" style={{ color: '#ff6b35' }} />
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#f1f5f9',
              letterSpacing: '-0.02em',
            }}>
              Delivery Partner Login
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div className="form-group">
              <label className="label">
                <Phone className="w-3 h-3 inline mr-1.5" />Phone Number
              </label>
              <input
                className="input-field"
                type="tel"
                placeholder="+919876543210"
                value={form.phone}
                autoComplete="username tel"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                onInput={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">
                <Lock className="w-3 h-3 inline mr-1.5" />Password
              </label>
              <div className="relative">
                <input
                  className="input-field pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  autoComplete="current-password"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onInput={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(0,217,192,0.45)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00d9c0'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,217,192,0.45)'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
              disabled={loading}
            >
              {loading ? <div className="spinner" /> : <><Shield className="w-4 h-4" />Sign In Securely</>}
            </button>
          </form>


          <hr className="divider mt-5" />

          <p className="text-center text-sm mt-4" style={{ color: 'rgba(148,163,184,0.55)' }}>
            New here?{' '}
            <Link to="/worker/register" className="font-semibold transition-all hover:brightness-125"
              style={{ color: '#ff6b35' }}>
              Create account
            </Link>
          </p>

          <div className="mt-4 p-3 rounded-lg" style={{
            background: 'rgba(0,217,192,0.05)',
            border: '1px solid rgba(0,217,192,0.12)',
          }}>
            <p className="text-xs mb-1" style={{ color: 'rgba(0,217,192,0.60)', fontWeight: 700 }}>🧪 Demo credentials</p>
            <p className="text-xs" style={{ color: 'rgba(148,163,184,0.60)' }}>
              Phone: <span style={{ color: '#10b981' }}>+919000000001</span>
              &nbsp;&nbsp; Password: <span style={{ color: '#10b981' }}>Worker@123</span>
            </p>
          </div>
        </div>

        {/* Portal links */}
        <div className="flex justify-center gap-6 mt-6 text-xs float-in-4" style={{ color: 'rgba(148,163,184,0.35)' }}>
          <Link to="/admin/login" className="hover:text-orange-400 transition-colors" style={{ color: 'inherit' }}>Admin Portal</Link>
          <Link to="/platform/login" className="hover:text-teal-400 transition-colors" style={{ color: 'inherit' }}>Partner Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
