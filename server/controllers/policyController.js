const Policy = require('../models/Policy');
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
      order_id: order.id,
      amount: order.amount,
      currency: 'INR',
      tier,
      tier_config: PREMIUM_TIERS[tier],
      razorpay_key: process.env.RAZORPAY_KEY_ID,
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
    const policy = await Policy.create({
      worker_id: workerId,
      premium_tier: tier,
      premium_amount: tierConfig.amount,
      coverage_amount: tierConfig.coverage,
      payment_id: razorpay_payment_id,
      status: 'active',
    });

    res.status(201).json({ message: 'Policy activated', policy });
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

module.exports = { createOrder, buyPolicy, getMyPolicy };
