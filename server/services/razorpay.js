const Razorpay = require('razorpay');
const crypto = require('crypto');

// Premium tier config
const PREMIUM_TIERS = {
  low:    { amount: 19900, coverage: 300000, label: '₹199/month', coverage_label: '₹3,000/event' },
  medium: { amount: 39900, coverage: 750000, label: '₹399/month', coverage_label: '₹7,500/event' },
  high:   { amount: 79900, coverage: 1500000, label: '₹799/month', coverage_label: '₹15,000/event' },
};

// Payout multipliers based on disruption type + severity
const PAYOUT_AMOUNTS = {
  rain:     { low: 50000, medium: 150000, high: 300000 },   // ₹500, ₹1500, ₹3000
  heatwave: { low: 75000, medium: 200000, high: 400000 },   // ₹750, ₹2000, ₹4000
  flood:    { low: 100000, medium: 300000, high: 600000 },  // ₹1000, ₹3000, ₹6000
  poor_aqi: { low: 50000, medium: 100000, high: 200000 },   // ₹500, ₹1000, ₹2000
};

const getRazorpayClient = () => {
  if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('your_')) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

/**
 * Create Razorpay order for premium payment
 */
const createPremiumOrder = async (tier) => {
  const tierConfig = PREMIUM_TIERS[tier];
  if (!tierConfig) throw new Error('Invalid premium tier');

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    // Dev mock
    return {
      id: 'order_mock_' + Date.now(),
      amount: tierConfig.amount,
      currency: 'INR',
      mock: true,
    };
  }

  const order = await razorpay.orders.create({
    amount: tierConfig.amount,
    currency: 'INR',
    notes: { tier, coverage: tierConfig.coverage_label },
  });
  return order;
};

/**
 * Verify Razorpay payment signature
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
};

/**
 * Process UPI payout via Razorpay Payouts API
 */
const processPayout = async (upiId, amount, notes = {}) => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.startsWith('your_')) {
    console.log(`[Razorpay DEV] Mock payout ₹${amount / 100} to ${upiId}`);
    return { id: 'pout_mock_' + Date.now(), status: 'processed', mock: true };
  }

  // Razorpay Payouts API requires fund account setup
  try {
    const axios = require('axios');
    const res = await axios.post(
      'https://api.razorpay.com/v1/payouts',
      {
        account_number: process.env.RAZORPAY_PAYOUT_ACCOUNT,
        fund_account: {
          account_type: 'vpa',
          vpa: { address: upiId },
        },
        amount,
        currency: 'INR',
        mode: 'UPI',
        purpose: 'payout',
        notes,
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );
    return res.data;
  } catch (err) {
    throw new Error(`Razorpay payout failed: ${err.response?.data?.error?.description || err.message}`);
  }
};

module.exports = { PREMIUM_TIERS, PAYOUT_AMOUNTS, createPremiumOrder, verifyPaymentSignature, processPayout };
