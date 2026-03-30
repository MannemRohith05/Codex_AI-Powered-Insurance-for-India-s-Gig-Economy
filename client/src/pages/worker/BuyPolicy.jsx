import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { Shield, Check, CreditCard, Zap } from 'lucide-react';

const TIERS = [
  {
    key: 'low', name: 'Basic', price: '₹199', monthly: 19900, coverage: '₹3,000/event',
    color: 'border-slate-600', badge: '', features: ['Rain protection', 'Basic AQI cover', '5-day activation'],
    gradient: 'from-slate-700 to-slate-800',
  },
  {
    key: 'medium', name: 'Standard', price: '₹399', monthly: 39900, coverage: '₹7,500/event',
    color: 'border-indigo-500', badge: '⭐ Most Popular', features: ['All Basic features', 'Heatwave cover', 'Flood protection', '24hr support'],
    gradient: 'from-indigo-700 to-purple-700',
  },
  {
    key: 'high', name: 'Premium', price: '₹799', monthly: 79900, coverage: '₹15,000/event',
    color: 'border-purple-500', badge: '👑 Best Value', features: ['All Standard features', 'Instant payout', 'Priority review', 'Dedicated support'],
    gradient: 'from-purple-700 to-pink-700',
  },
];

const BuyPolicy = () => {
  const [selectedTier, setSelectedTier] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [myPolicy, setMyPolicy] = useState(null);

  useEffect(() => {
    api.get('/policy/my').then(r => {
      const active = r.data.policies?.find(p => p.status === 'active');
      if (active) setMyPolicy(active);
    }).catch(() => {});
  }, []);

  const handleBuy = async () => {
    setLoading(true);
    try {
      // Create order
      const { data: orderData } = await api.post('/policy/order', { tier: selectedTier });

      if (orderData.order_id.startsWith('order_mock')) {
        // Dev mode: bypass Razorpay
        await api.post('/policy/buy', {
          tier: selectedTier,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
        });
        toast.success('🎉 Policy activated! (Dev mode — payment mocked)');
        const { data } = await api.get('/policy/my');
        const active = data.policies?.find(p => p.status === 'active');
        if (active) setMyPolicy(active);
        return;
      }

      // Real Razorpay checkout
      const rzp = new window.Razorpay({
        key: orderData.razorpay_key,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: 'INR',
        name: 'GigShield Insurance',
        description: `${selectedTier} plan — ${orderData.tier_config?.coverage_label}`,
        theme: { color: '#6366f1' },
        handler: async (response) => {
          await api.post('/policy/buy', {
            tier: selectedTier,
            razorpay_order_id: orderData.order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          toast.success('🎉 Policy activated!');
          const { data } = await api.get('/policy/my');
          const active = data.policies?.find(p => p.status === 'active');
          if (active) setMyPolicy(active);
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="section-title">Choose Your Coverage Plan</h1>
            <p className="section-sub">Protected against rain, heatwave, flood, and poor air quality</p>
          </div>

          {myPolicy && (
            <div className="card border border-emerald-500/30 mb-6 flex items-center gap-4">
              <Shield className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">You have an active <span className="text-emerald-400 capitalize">{myPolicy.premium_tier}</span> plan</p>
                <p className="text-sm text-slate-400">Valid till {new Date(myPolicy.end_date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {TIERS.map(tier => (
              <div
                key={tier.key}
                onClick={() => setSelectedTier(tier.key)}
                className={`relative card border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${selectedTier === tier.key ? tier.color + ' shadow-xl' : 'border-slate-800 hover:border-slate-600'}`}
              >
                {tier.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${tier.gradient} whitespace-nowrap`}>
                    {tier.badge}
                  </div>
                )}
                {selectedTier === tier.key && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>
                <p className="text-sm text-emerald-400 font-semibold mb-4">{tier.coverage}</p>
                <ul className="space-y-2">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={handleBuy}
              className="btn-primary flex items-center gap-2 px-10 py-3.5 text-base"
              disabled={loading}
            >
              {loading ? <div className="spinner" /> : <><CreditCard className="w-5 h-5" /><Zap className="w-4 h-4" />Buy {TIERS.find(t => t.key === selectedTier)?.name} Plan — {TIERS.find(t => t.key === selectedTier)?.price}/month</>}
            </button>
          </div>
          <p className="text-center text-xs text-slate-600 mt-3">🔒 Powered by Razorpay • Secure payment</p>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default BuyPolicy;
