/**
 * BuyPolicy — plan selection with pricing cards.
 * 
 * Design: 3-tier cards with clear visual distinction.
 * Selected state: primary ring + checkmark. 
 * "Most Popular" badge sits above the recommended card.
 */
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Sidebar from '../../components/Sidebar';
import DashboardLayout, { PageContent } from '../../components/DashboardLayout';
import { Shield, Check, CreditCard, Lock } from 'lucide-react';
import { cn } from '../../utils/cn';

const TIERS = [
  {
    key: 'low',
    name: 'Basic',
    price: '₹60',
    monthly: 6000,
    coverage: '₹3,000 / event',
    badge: null,
    features: ['Rain protection', 'Basic AQI cover', '5-day activation'],
  },
  {
    key: 'medium',
    name: 'Standard',
    price: '₹100',
    monthly: 10000,
    coverage: '₹7,500 / event',
    badge: 'Most Popular',
    features: ['All Basic features', 'Heatwave cover', 'Flood protection', '24hr support'],
  },
  {
    key: 'high',
    name: 'Premium',
    price: '₹160',
    monthly: 16000,
    coverage: '₹15,000 / event',
    badge: 'Best Value',
    features: ['All Standard features', 'Instant payout', 'Priority review', 'Dedicated support'],
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
      const { data: orderData } = await api.post('/policy/order', { tier: selectedTier });

      if (orderData.order_id.startsWith('order_mock')) {
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

      const rzp = new window.Razorpay({
        key: orderData.razorpay_key,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: 'INR',
        name: 'GigShield Insurance',
        description: `${selectedTier} plan — ${orderData.tier_config?.coverage_label}`,
        theme: { color: '#4f46e5' },
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

  const selectedTierData = TIERS.find(t => t.key === selectedTier);

  return (
    <DashboardLayout>
      <Sidebar />
      <PageContent>
        <div className="max-w-4xl mx-auto">
          <div className="page-header">
            <h1 className="page-title">Choose Your Coverage Plan</h1>
            <p className="page-subtitle">Protected against rain, heatwave, flood, and poor air quality</p>
          </div>

          {/* Active policy banner */}
          {myPolicy && (
            <div className="mb-6 p-4 rounded-xl border border-success-200 bg-success-50 flex items-center gap-3">
              <div className="w-9 h-9 bg-success-100 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-success-800 text-sm">
                  Active <span className="capitalize">{myPolicy.premium_tier}</span> Plan
                </p>
                <p className="text-xs text-success-600">
                  Valid until {new Date(myPolicy.end_date).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {TIERS.map(tier => {
              const isSelected = selectedTier === tier.key;
              return (
                <button
                  key={tier.key}
                  type="button"
                  onClick={() => setSelectedTier(tier.key)}
                  className={cn(
                    'relative text-left rounded-xl border-2 p-6 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-[var(--color-border)] bg-white hover:border-slate-300 hover:shadow-sm'
                  )}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      {tier.badge}
                    </span>
                  )}

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}

                  <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-[var(--color-text-primary)]">{tier.price}</span>
                    <span className="text-[var(--color-text-muted)] text-sm">/month</span>
                  </div>
                  <p className="text-sm font-semibold text-success-600 mb-5">{tier.coverage}</p>

                  <ul className="space-y-2.5">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Check className="w-3.5 h-3.5 text-success-500 shrink-0" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 mb-12">
            <button
              onClick={handleBuy}
              className="btn-primary px-10 py-3.5 text-base"
              disabled={loading}
            >
              {loading
                ? <span className="spinner border-white border-t-transparent" />
                : <><CreditCard className="w-5 h-5" /><span>Buy {selectedTierData?.name} Plan — {selectedTierData?.price}/month</span></>
              }
            </button>
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Powered by Razorpay • Secure 256-bit payment
            </p>
          </div>

          {/* Coverage Exclusions */}
          <div className="border border-danger-200 bg-danger-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-danger-900 mb-2">Coverage Exclusions & Terms</h3>
            <div className="text-sm text-danger-800 space-y-2">
              <p><strong>What is NOT covered:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pandemics or government-mandated disease lockdowns.</li>
                <li>Self-caused vehicle breakdowns or negligence.</li>
                <li>War, civil unrest, or riots.</li>
                <li>Pre-existing medical conditions.</li>
              </ul>
              <p className="mt-3"><strong>Policy Terms:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>7-Day Waiting Period:</strong> Claims are not eligible within the first 7 days of registering for a new policy.</li>
                <li><strong>Settlement Timeline:</strong> Eligible claims are settled T+2 business days after AI approval.</li>
              </ul>
            </div>
          </div>
        </div>
      </PageContent>
    </DashboardLayout>
  );
};

export default BuyPolicy;
