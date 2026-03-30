import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Shield, User, Phone, Lock, Building2, MapPin, Wallet, Smartphone, Eye, EyeOff } from 'lucide-react';

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i, size: Math.random() * 3 + 1, left: Math.random() * 100,
  delay: Math.random() * 14, duration: Math.random() * 10 + 9,
  isOrange: Math.random() > 0.5,
}));

const PLATFORMS = ['Swiggy', 'Zomato', 'Zepto', 'Dunzo', 'Other'];
const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat'];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '', platform: '', city: '', upi_id: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password || !form.platform) return toast.error('Please fill all required fields');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/worker/register', { ...form, device_id: `web_${navigator.userAgent.slice(0, 30)}` });
      toast.success('Registration successful! OTP sent to your phone.');
      navigate('/worker/verify-otp', { state: { phone: form.phone } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-scene">
      <div className="login-scene-bg" />
      <div className="login-scene-grid" />
      <div className="particles-layer">
        {PARTICLES.map(p => (
          <div key={p.id} className={`particle ${p.isOrange ? 'particle-orange' : 'particle-teal'}`}
            style={{ width: p.size, height: p.size, left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
        ))}
      </div>

      <div className="login-ambient-light" style={{ width: 350, height: 350, top: '10%', right: '-5%', background: 'radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)' }} />
      <div className="login-ambient-light" style={{ width: 300, height: 300, bottom: '10%', left: '-8%', background: 'radial-gradient(circle, rgba(0,217,192,0.10) 0%, transparent 70%)' }} />

      <div className="login-card-wrapper" style={{ maxWidth: 480 }}>
        <div className="text-center mb-7 float-in-1">
          <div className="shield-3d-wrapper inline-block mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neon-border"
              style={{ background: 'linear-gradient(135deg, rgba(255,140,90,0.95), rgba(255,107,53,0.95))', boxShadow: '0 10px 35px rgba(255,107,53,0.45)' }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="hero-title gradient-text" style={{ fontSize: '2rem', fontFamily: 'var(--font-display)' }}>Join GigShield</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(0,217,192,0.65)' }}>Create your delivery partner account</p>
        </div>

        <div className="card float-in-2" style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label"><User className="w-3 h-3 inline mr-1" />Full Name *</label>
                <input className="input-field" name="name" autoComplete="name" placeholder="Ravi Kumar" value={form.name} onChange={handleChange} onInput={handleChange} required />
              </div>
              <div className="form-group">
                <label className="label"><Phone className="w-3 h-3 inline mr-1" />Phone *</label>
                <input className="input-field" name="phone" type="tel" autoComplete="tel" placeholder="+919876543210" value={form.phone} onChange={handleChange} onInput={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="label"><Lock className="w-3 h-3 inline mr-1" />Password *</label>
              <div className="relative">
                <input className="input-field pr-10" type={showPassword ? 'text' : 'password'} name="password"
                  autoComplete="new-password" placeholder="Min 8 characters" value={form.password} onChange={handleChange} onInput={handleChange} required minLength={8} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(0,217,192,0.45)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00d9c0'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,217,192,0.45)'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label"><Building2 className="w-3 h-3 inline mr-1" />Platform *</label>
                <select className="input-field" name="platform" value={form.platform} onChange={handleChange} required>
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label"><MapPin className="w-3 h-3 inline mr-1" />City</label>
                <select className="input-field" name="city" value={form.city} onChange={handleChange}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label"><Wallet className="w-3 h-3 inline mr-1" />UPI ID (for payouts)</label>
              <input className="input-field" name="upi_id" autoComplete="off" placeholder="name@okicici" value={form.upi_id} onChange={handleChange} onInput={handleChange} />
            </div>

            <button type="submit" className="btn-primary w-full mt-2 flex items-center justify-center gap-2 py-3" disabled={loading}>
              {loading ? <div className="spinner" /> : <><Smartphone className="w-4 h-4" />Create Account & Get OTP</>}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: 'rgba(148,163,184,0.55)' }}>
            Already have an account?{' '}
            <Link to="/worker/login" className="font-semibold transition-all hover:brightness-125" style={{ color: '#ff6b35' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
