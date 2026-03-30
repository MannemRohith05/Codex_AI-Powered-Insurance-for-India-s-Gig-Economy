const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const FraudLog = require('../models/FraudLog');
const Worker = require('../models/Worker');
const { PAYOUT_AMOUNTS, processPayout } = require('../services/razorpay');
const { fetchOpenWeatherMap } = require('../services/weather');

// POST /api/claim/submit
const submitClaim = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { disruption_type, gps_at_claim, notes } = req.body;
    const { fraudScore, flags, recommendation } = req.fraudResult || {};

    // Check active policy
    const policy = await Policy.findOne({ worker_id: workerId, status: 'active' });
    if (!policy) return res.status(400).json({ error: 'No active insurance policy. Please purchase one first.' });

    // Fetch current weather snapshot
    let weather_snapshot = null;
    if (gps_at_claim?.lat && gps_at_claim?.lng) {
      try {
        weather_snapshot = await fetchOpenWeatherMap(gps_at_claim.lat, gps_at_claim.lng);
      } catch (e) { /* non-fatal */ }
    }

    // Compute claim amount based on policy tier + disruption
    const disruptionAmounts = PAYOUT_AMOUNTS[disruption_type];
    const amount_claimed = disruptionAmounts?.[policy.premium_tier] || 50000;

    const claimStatus = recommendation === 'APPROVE' ? 'approved' :
                        recommendation === 'REJECT' ? 'rejected' : 'under_review';

    const claim = await Claim.create({
      worker_id: workerId,
      policy_id: policy._id,
      disruption_type,
      gps_at_claim,
      weather_snapshot,
      fraud_score: fraudScore || 0,
      fraud_flags: flags || {},
      amount_claimed,
      notes,
      status: claimStatus,
    });

    // Save fraud log
    await FraudLog.create({
      claim_id: claim._id,
      worker_id: workerId,
      flags,
      fraud_score: fraudScore,
      recommendation,
    });

    // Auto-payout if approved and worker has UPI
    if (claimStatus === 'approved') {
      const worker = await Worker.findById(workerId).select('upi_id');
      if (worker?.upi_id) {
        try {
          const payout = await processPayout(worker.upi_id, amount_claimed, { claim_id: claim._id.toString() });
          await Claim.findByIdAndUpdate(claim._id, {
            razorpay_payout_id: payout.id,
            amount_paid: amount_claimed,
            status: 'paid',
          });
        } catch (payoutErr) {
          console.error('[Payout] Failed:', payoutErr.message);
        }
      }
    }

    res.status(201).json({ message: 'Claim submitted', claim, fraud: { score: fraudScore, recommendation } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/claim/history/:workerId
const getClaimHistory = async (req, res) => {
  try {
    const claims = await Claim.find({ worker_id: req.params.id })
      .populate('policy_id', 'premium_tier coverage_amount')
      .sort({ createdAt: -1 });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/claim/my — claims for logged-in worker
const myClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ worker_id: req.user.id })
      .populate('policy_id', 'premium_tier coverage_amount')
      .sort({ createdAt: -1 });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { submitClaim, getClaimHistory, myClaims };
