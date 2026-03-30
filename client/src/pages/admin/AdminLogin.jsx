import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail } from 'lucide-react';

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  delay: Math.random() * 18,
  duration: Math.random() * 14 + 10,
  opacity: Math.random() * 0.4 + 0.15,
}));

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
    <div className="login-scene" style={{ background: 'var(--bg-base)' }}>
      <div className="login-scene-bg" style={{
        background: `
          radial-gradient(ellipse 75% 55% at 50% 40%, rgba(244,63,94,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 90% 70% at 20% 10%, rgba(99,102,241,0.08) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 80% 85%, rgba(168,85,247,0.07) 0%, transparent 55%),
          linear-gradient(170deg, #06050a 0%, #08070f 50%, #06050a 100%)`
      }} />
      <div className="login-scene-grid" />

      <div className="particles-layer">
        {PARTICLES.map(p => (
          <div key={p.id} className="particle" style={{
            width: p.size, height: p.size,
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            background: 'rgba(244,100,110,0.55)',
          }} />
        ))}
      </div>

      <div className="login-ambient-light" style={{
        width: 350, height: 350, top: '5%', left: '-6%',
        background: 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)',
      }} />
      <div className="login-ambient-light" style={{
        width: 280, height: 280, bottom: '5%', right: '-4%',
        background: 'radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)',
      }} />
      <div className="depth-fog" />

      <div className="login-card-wrapper">
        {/* Logo */}
        <div className="login-logo-wrap text-center mb-8 float-in-1">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 neon-border"
            style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.85), rgba(168,85,247,0.80))',
              boxShadow: '0 8px 32px rgba(244,63,94,0.40), 0 0 60px rgba(200,169,110,0.10)',
            }}
          >
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="cinematic-title" style={{ fontSize: '2rem' }}>GigShield Admin</h1>
          <p className="cinematic-subtitle text-sm mt-1">Insurance Operations Portal</p>
        </div>

        {/* Card */}
        <div className="card tilt-card float-in-2" style={{ padding: '28px' }}>
          <h2 className="mb-6" style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.3rem',
            fontWeight: 700, fontStyle: 'italic', color: '#ede0c8',
          }}>
            Admin Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div className="form-group">
              <label className="label"><Mail className="w-3.5 h-3.5 inline mr-1" />Email</label>
              <input className="input-field" type="email" placeholder="admin@gigshield.in"
                autoComplete="username email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onInput={e => setForm(f => ({ ...f, email: e.target.value }))}
                required />
            </div>
            <div className="form-group">
              <label className="label"><Lock className="w-3.5 h-3.5 inline mr-1" />Password</label>
              <input className="input-field" type="password" placeholder="Admin password"
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onInput={e => setForm(f => ({ ...f, password: e.target.value }))}
                required />
            </div>
            <button
              type="submit"
              className="w-full py-3 flex items-center justify-center gap-2 mt-2 rounded-xl font-semibold transition-all"
              disabled={loading}
              style={{
                background: 'linear-gradient(160deg, rgba(200,169,110,0.15) 0%, rgba(244,63,94,0.85) 50%, rgba(168,85,247,0.80) 100%)',
                color: '#ede0c8',
                boxShadow: '0 6px 20px rgba(244,63,94,0.40), 0 1px 0 rgba(232,200,122,0.25) inset, 0 3px 0 rgba(0,0,0,0.60)',
                border: '1px solid rgba(200,169,110,0.15)',
                fontSize: '14px',
              }}
            >
              {loading ? <div className="spinner" /> : 'Sign In as Admin'}
            </button>
          </form>

          <hr className="divider mt-5" />

          <div className="mt-4 p-3 rounded-lg" style={{
            background: 'rgba(244,63,94,0.05)',
            border: '1px solid rgba(244,63,94,0.15)',
          }}>
            <p className="text-xs mb-1" style={{ color: 'rgba(244,100,94,0.50)', fontWeight: 600 }}>🧪 Demo credentials:</p>
            <p className="text-xs" style={{ color: 'rgba(200,169,110,0.40)' }}>
              Email: <span style={{ color: '#f43f5e' }}>admin@gigshield.in</span>
              &nbsp;&nbsp; Password: <span style={{ color: '#f43f5e' }}>Admin@123</span>
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-6 text-xs float-in-4" style={{ color: 'rgba(167,150,120,0.35)' }}>
          <Link to="/worker/login" className="hover:text-amber-400 transition-colors" style={{ color: 'inherit' }}>Worker Portal</Link>
          <Link to="/platform/login" className="hover:text-amber-400 transition-colors" style={{ color: 'inherit' }}>Partner Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
