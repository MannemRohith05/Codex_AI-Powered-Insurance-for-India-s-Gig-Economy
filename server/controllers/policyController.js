const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const Worker = require('../models/Worker');
const { PREMIUM_TIERS, createPremiumOrder, verifyPaymentSignature } = require('../services/razorpay');

// POST /api/policy/order — create Razorpay order
const createOrder = async (req, res) => {
  try {
    const { tier } = req.body;
    if (!['low', 'medium', 'high'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Choose: low, medium, or high' });
    }
    const order = await createPremiumOrder(tier);
    res.json({
      order_id:      order.id,
      amount:        order.amount,
      currency:      'INR',
      tier,
      tier_config:   PREMIUM_TIERS[tier],
      razorpay_key:  process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/policy/buy — verify payment and activate policy
const buyPolicy = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { tier, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature (skip for mocked orders)
    if (!razorpay_payment_id.startsWith('pay_mock')) {
      const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!valid) return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Suspend existing active policy if any
    await Policy.findOneAndUpdate({ worker_id: workerId, status: 'active' }, { status: 'suspended' });

    const tierConfig = PREMIUM_TIERS[tier];
    const now = new Date();

    const policy = await Policy.create({
      worker_id:            workerId,
      premium_tier:         tier,
      premium_amount:       tierConfig.amount,          // raw (paise)
      premium_amount_inr:   Math.round(tierConfig.amount / 100), // rupees
      coverage_amount:      tierConfig.coverage,
      payment_id:           razorpay_payment_id,
      status:               'active',
      last_premium_paid_at: now,
      // waiting_period_end_date is auto-set in pre-save hook (start_date + 7 days)
    });

    res.status(201).json({
      message:                  'Policy activated',
      policy,
      waiting_period_ends:      policy.waiting_period_end_date,
      coverage_starts_fully:    policy.waiting_period_end_date,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/policy/my
const getMyPolicy = async (req, res) => {
  try {
    const workerId = req.user.id;
    const policies = await Policy.find({ worker_id: workerId }).sort({ createdAt: -1 });
    res.json({ policies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/policy/status — README spec endpoint
const getPolicyStatus = async (req, res) => {
  try {
    const workerId = req.user.id;
    const policy = await Policy.findOne({ worker_id: workerId, status: 'active' });

    if (!policy) {
      return res.status(404).json({ error: 'NO_ACTIVE_POLICY', message: 'No active policy found.' });
    }

    // Count approved claims this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const claimsThisMonth = await Claim.countDocuments({
      worker_id: workerId,
      status:    { $in: ['approved', 'paid'] },
      createdAt: { $gte: startOfMonth },
    });

    // Is waiting period still active?
    const now = new Date();
    const waitingPeriodActive = policy.waiting_period_end_date && now < policy.waiting_period_end_date;

    res.json({
      policy_id:               policy._id,
      status:                  'ACTIVE',
      risk_tier:               policy.premium_tier.toUpperCase(),
      premium_inr:             policy.premium_amount_inr || Math.round((policy.premium_amount || 0) / 100),
      coverage_start_date:     policy.start_date,
      waiting_period_end_date: policy.waiting_period_end_date,
      waiting_period_active:   waitingPeriodActive,
      claims_this_month:       claimsThisMonth,
      max_claims_allowed:      2,
      next_renewal_date:       policy.end_date,
      auto_renew:              policy.auto_renew,
      last_premium_paid_at:    policy.last_premium_paid_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createOrder, buyPolicy, getMyPolicy, getPolicyStatus };
