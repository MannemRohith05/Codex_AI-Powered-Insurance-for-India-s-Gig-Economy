const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const FraudLog = require('../models/FraudLog');
const Worker = require('../models/Worker');
const WeatherEvent = require('../models/WeatherEvent');
const { PAYOUT_AMOUNTS, processPayout } = require('../services/razorpay');
const { fetchOpenWeatherMap } = require('../services/weather');
const { getCachedWeatherForZone, evaluateParametricTriggers } = require('../services/weather');
const { computeFraudScore, computeAnomalyScore, makeClaimDecision } = require('../services/aiEngine');

// ── Constants (matching README spec) ─────────────────────────────────────────
const MIN_LOSS_THRESHOLD_INR = 300;   // Minimum declared loss to be eligible
const MAX_CLAIMS_PER_MONTH   = 2;     // Monthly claim cap per worker
const MAX_PAYOUT_PCT         = 0.40;  // Payout capped at 40% of declared weekly income

// ── POST /api/claim/submit  (also aliased as POST /api/claim/) ────────────────
/**
 * Submit a new disruption claim.
 * Pipeline:
 *   1. Validate active policy + waiting period
 *   2. Enforce min loss threshold + monthly cap
 *   3. Validate parametric trigger (weather event in zone)
 *   4. Run LightGBM fraud score + Isolation Forest anomaly score
 *   5. Make decision → auto-approve or escalate
 *   6. Initiate payout if approved
 */
const submitClaim = async (req, res) => {
  try {
    const workerId = req.user.id;
    const {
      disruption_type,
      declared_income_loss_inr,
      gps_at_claim,
      photo_evidence_url,
      notes,
    } = req.body;

    const { fraudScore: legacyFraudScore, flags: fraudFlags = {}, recommendation: legacyRecommendation } =
      req.fraudResult || {};

    // ── Step 1: Validate active policy ───────────────────────────────────────
    const policy = await Policy.findOne({ worker_id: workerId, status: 'active' });
    if (!policy) {
      return res.status(400).json({
        error: 'NO_ACTIVE_POLICY',
        message: 'No active insurance policy found. Please purchase one first.',
      });
    }

    // ── Step 1b: Enforce 7-day waiting period ────────────────────────────────
    const waitingEnd = policy.waiting_period_end_date || (() => {
      const d = new Date(policy.start_date);
      d.setDate(d.getDate() + 7);
      return d;
    })();
    if (new Date() < waitingEnd) {
      return res.status(400).json({
        error: 'WAITING_PERIOD_ACTIVE',
        message: 'Claims are not eligible during the 7-day waiting period.',
        waiting_period_ends: waitingEnd.toISOString(),
      });
    }

    // ── Step 2a: Minimum loss threshold ─────────────────────────────────────
    if (declared_income_loss_inr !== undefined && declared_income_loss_inr < MIN_LOSS_THRESHOLD_INR) {
      return res.status(400).json({
        error: 'BELOW_MIN_THRESHOLD',
        message: `Minimum income loss of ₹${MIN_LOSS_THRESHOLD_INR} required to file a claim.`,
        declared_loss: declared_income_loss_inr,
        minimum_required: MIN_LOSS_THRESHOLD_INR,
      });
    }

    // ── Step 2b: Monthly claim cap ───────────────────────────────────────────
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const approvedThisMonth = await Claim.countDocuments({
      worker_id: workerId,
      status:    { $in: ['approved', 'paid'] },
      createdAt: { $gte: startOfMonth },
    });
    if (approvedThisMonth >= MAX_CLAIMS_PER_MONTH) {
      return res.status(400).json({
        error:   'MONTHLY_CAP_REACHED',
        message: `Maximum ${MAX_CLAIMS_PER_MONTH} approved claims per month reached.`,
        claims_approved_this_month: approvedThisMonth,
        max_allowed: MAX_CLAIMS_PER_MONTH,
      });
    }

    // ── Step 3: Parametric trigger validation ────────────────────────────────
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Fetch latest weather event for worker's zone
    const weatherEvent = await getCachedWeatherForZone(worker.zone_pin_code, worker.city);
    let parametricTriggered = false;
    let weather_snapshot = null;

    if (weatherEvent) {
      parametricTriggered = weatherEvent.parametric_trigger_met;
      weather_snapshot = {
        rainfall_mm_24h:  weatherEvent.rainfall_mm_24h,
        temperature_c:    weatherEvent.temperature_c,
        aqi:              weatherEvent.aqi,
        triggered:        weatherEvent.triggered_conditions,
      };
    } else if (gps_at_claim?.lat && gps_at_claim?.lng) {
      // Fallback: live fetch
      try {
        const raw = await fetchOpenWeatherMap(gps_at_claim.lat, gps_at_claim.lng);
        const { triggered } = evaluateParametricTriggers(raw, null);
        parametricTriggered = triggered;
        weather_snapshot = raw;
      } catch (e) { /* non-fatal — proceed with review */ }
    }

    // If no parametric trigger met, auto-reject (non-parametric loss is excluded)
    if (!parametricTriggered && weatherEvent) {
      return res.status(400).json({
        error:   'NO_PARAMETRIC_TRIGGER',
        message: 'No qualifying weather event found in your zone for today. Only parametric disruptions are covered.',
        triggered_conditions: weatherEvent.triggered_conditions,
      });
    }

    // ── Step 4: AI scoring ───────────────────────────────────────────────────
    const recentClaims = await Claim.find({ worker_id: workerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Attach policy age for anomaly scorer
    worker._policyAgeDays = Math.floor((Date.now() - new Date(policy.start_date)) / (1000 * 60 * 60 * 24));

    const fraudResult   = computeFraudScore(
      { disruption_type, declared_income_loss_inr, gps_at_claim, photo_evidence_url },
      worker,
      recentClaims,
      fraudFlags,
    );

    const anomalyResult = computeAnomalyScore(
      { disruption_type, declared_income_loss_inr, gps_at_claim },
      worker,
    );

    // ── Step 5: Decision ─────────────────────────────────────────────────────
    const aiDecision = makeClaimDecision(fraudResult, anomalyResult);

    // Compute payout amount (capped at 40% of declared weekly income)
    const weeklyIncome    = worker.declared_weekly_income_inr || worker.avg_income * 7 / 30 || 3500;
    const tierPayout      = PAYOUT_AMOUNTS?.[disruption_type]?.[policy.premium_tier] || 50000;
    const maxAllowedPayout = Math.round(weeklyIncome * MAX_PAYOUT_PCT * 100); // in paise
    const amount_claimed  = Math.min(tierPayout, maxAllowedPayout);
    const claim_amount_inr = Math.round(amount_claimed / 100);

    // Map decision to Mongoose claim status
    const statusMap = {
      AUTO_APPROVED: 'approved',
      FLAGGED:       'under_review',
      MANUAL_REVIEW: 'under_review',
      REJECTED:      'rejected',
    };
    const claimStatus = statusMap[aiDecision.decision] || 'under_review';

    // Settlement ETA
    const settlementEta = new Date();
    settlementEta.setDate(settlementEta.getDate() + (claimStatus === 'approved' ? 1 : 2));

    const claim = await Claim.create({
      worker_id:                workerId,
      policy_id:                policy._id,
      weather_event_id:         weatherEvent?._id,
      disruption_type,
      declared_income_loss_inr: declared_income_loss_inr || 0,
      gps_at_claim,
      weather_snapshot,
      fraud_score:              fraudResult.fraud_score,
      fraud_flags:              fraudFlags,
      anomaly_score:            anomalyResult.anomaly_score,
      reason_codes:             fraudResult.reason_codes,
      amount_claimed,
      claim_amount_inr,
      photo_evidence_url:       photo_evidence_url || null,
      notes,
      status:                   claimStatus,
      ai_status:                aiDecision.ai_status,
      settlement_date:          claimStatus === 'approved' ? settlementEta : null,
    });

    // Save fraud log
    await FraudLog.create({
      claim_id:       claim._id,
      worker_id:      workerId,
      flags:          fraudFlags,
      fraud_score:    fraudResult.fraud_score,
      recommendation: aiDecision.decision,
    });

    // ── Step 6: Auto-payout ──────────────────────────────────────────────────
    if (claimStatus === 'approved') {
      if (worker?.upi_id) {
        try {
          const payout = await processPayout(worker.upi_id, amount_claimed, { claim_id: claim._id.toString() });
          await Claim.findByIdAndUpdate(claim._id, {
            razorpay_payout_id: payout.id,
            amount_paid:        amount_claimed,
            status:             'paid',
            settlement_date:    new Date(),
          });
        } catch (payoutErr) {
          console.error('[Payout] Failed:', payoutErr.message);
        }
      }
    }

    // ── Response (matches README API spec) ────────────────────────────────────
    if (claimStatus === 'approved') {
      return res.status(201).json({
        claim_id:         claim._id,
        status:           'AUTO_APPROVED',
        claim_amount_inr,
        settlement_eta:   settlementEta.toISOString(),
        ai_confidence:    parseFloat(aiDecision.confidence.toFixed(2)),
        message:          'Your claim has been approved. Payout will be credited within 24 hours.',
      });
    }
    if (claimStatus === 'rejected') {
      return res.status(200).json({
        claim_id:     claim._id,
        status:       'REJECTED',
        fraud_score:  fraudResult.fraud_score,
        reason_codes: fraudResult.reason_codes,
        message:      'Your claim was rejected by the fraud detection system.',
      });
    }
    // under_review / FLAGGED
    return res.status(200).json({
      claim_id:     claim._id,
      status:       'FLAGGED',
      message:      'Your claim has been flagged for manual review. Decision within 2 business days.',
      fraud_score:  fraudResult.fraud_score,
      reason_codes: fraudResult.reason_codes,
    });

  } catch (err) {
    console.error('[ClaimController] submitClaim error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/claim/history/:workerId ─────────────────────────────────────────
const getClaimHistory = async (req, res) => {
  try {
    const claims = await Claim.find({ worker_id: req.params.id })
      .populate('policy_id', 'premium_tier coverage_amount premium_amount_inr')
      .populate('weather_event_id', 'triggered_conditions rainfall_mm_24h temperature_c aqi')
      .sort({ createdAt: -1 });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/claim/my — claims for logged-in worker ──────────────────────────
const myClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ worker_id: req.user.id })
      .populate('policy_id', 'premium_tier coverage_amount premium_amount_inr')
      .populate('weather_event_id', 'triggered_conditions rainfall_mm_24h temperature_c aqi recorded_at')
      .sort({ createdAt: -1 });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { submitClaim, getClaimHistory, myClaims };
