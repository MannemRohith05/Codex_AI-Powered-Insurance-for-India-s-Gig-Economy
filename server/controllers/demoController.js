'use strict';

/**
 * GigShield Demo Controller — Section D + Section I
 *
 * POST /api/demo/trigger
 *   Runs the full 6-step demo pipeline and streams progress via SSE.
 *   Steps:
 *     1. Coverage Active      — verify demo worker has active policy
 *     2. Disruption Detected  — create WeatherEvent + DisruptionEvent for Mumbai Kurla
 *     3. Claim Auto-Created   — create Claim document
 *     4. Fraud Check          — run fraudDetection + aiEngine scoring
 *     5. Claim Approved       — update claim status
 *     6. Payout Sent          — mock UPI payout, update to 'paid'
 *
 * GET /api/demo/status
 *   Returns the most recent demo run result (no auth, for judges).
 */

const Worker        = require('../models/Worker');
const Policy        = require('../models/Policy');
const Claim         = require('../models/Claim');
const WeatherEvent  = require('../models/WeatherEvent');
const FraudLog      = require('../models/FraudLog');
const DisruptionEvent = require('../models/DisruptionEvent');
const { runFullFraudCheck }                              = require('../services/fraudDetection');
const { computeFraudScore, computeAnomalyScore, makeClaimDecision } = require('../services/aiEngine');
const { processPayout }                                  = require('../services/razorpay');

// In-memory store of the last demo run (replaces writing to DB for demo state)
let lastDemoResult = null;

// ── SSE helper ─────────────────────────────────────────────────────────────────
function sendEvent(res, step, label, status, data = {}) {
  const payload = JSON.stringify({ step, label, status, data, ts: new Date().toISOString() });
  res.write(`data: ${payload}\n\n`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── POST /api/demo/trigger ─────────────────────────────────────────────────────
const triggerDemo = async (req, res) => {
  // ── Setup SSE headers ────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
  res.flushHeaders();

  const steps = [];
  const record = (step, label, status, data) => {
    steps.push({ step, label, status, data });
    sendEvent(res, step, label, status, data);
  };

  try {
    // ── STEP 1: Coverage Active ─────────────────────────────────────────────
    record(1, 'Coverage Active', 'active', {});
    await sleep(800);

    // Find demo worker (first active worker with upi_id, or any worker)
    let worker = await Worker.findOne({ upi_id: { $exists: true, $ne: '' } }).select('-password_hash');
    if (!worker) worker = await Worker.findOne().select('-password_hash');

    if (!worker) {
      record(1, 'Coverage Active', 'failed', { error: 'No demo worker found in DB. Run seed script first.' });
      res.end(); return;
    }

    let policy = await Policy.findOne({ worker_id: worker._id, status: 'active' });
    if (!policy) {
      // Auto-create a demo policy
      const end = new Date(); end.setMonth(end.getMonth() + 1);
      const wpe = new Date(); wpe.setDate(wpe.getDate() - 8); // waiting period already elapsed
      policy = await Policy.create({
        worker_id:               worker._id,
        premium_tier:            'medium',
        premium_amount_inr:      25,
        coverage_amount:         7500,
        status:                  'active',
        start_date:              new Date(),
        end_date:                end,
        waiting_period_end_date: wpe,
        next_renewal_date:       end,
      });
    }

    record(1, 'Coverage Active', 'done', {
      worker_name:   worker.name,
      platform:      worker.platform,
      city:          worker.city || 'Mumbai',
      premium_tier:  policy.premium_tier,
      coverage_inr:  policy.coverage_amount,
    });

    // ── STEP 2: Disruption Detected ─────────────────────────────────────────
    record(2, 'Disruption Detected', 'active', {});
    await sleep(1200);

    const weatherData = {
      zone_pin_code:          worker.zone_pin_code || '400078',
      city:                   worker.city || 'Mumbai',
      rainfall_mm_24h:        87,
      temperature_c:          29,
      aqi:                    145,
      wind_speed_kmh:         35,
      flood_alert_active:     true,
      cyclone_alert_active:   false,
      parametric_trigger_met: true,
      triggered_conditions:   ['HEAVY_RAIN', 'FLOOD_RISK'],
      data_source:            'DEMO_TRIGGER',
      recorded_at:            new Date(),
    };

    const weatherEvent = await WeatherEvent.create(weatherData);

    await DisruptionEvent.create({
      city:        worker.city || 'Mumbai',
      zone:        worker.zone_pin_code || '400078',
      type:        'rain',
      severity:    'high',
      weather_data: { rainfall_mm: 87 },
      is_active:   true,
    });

    record(2, 'Disruption Detected', 'done', {
      zone_pin:        worker.zone_pin_code || '400078',
      rainfall_mm_24h: weatherData.rainfall_mm_24h,
      triggers:        weatherData.triggered_conditions,
      parametric_met:  true,
    });

    // ── STEP 3: Claim Auto-Created ───────────────────────────────────────────
    record(3, 'Claim Auto-Created', 'active', {});
    await sleep(1000);

    const declaredLoss = 2800;
    const claimGps     = { lat: 19.072, lng: 72.978, accuracy: 12 };

    const claim = await Claim.create({
      worker_id:                worker._id,
      policy_id:                policy._id,
      weather_event_id:         weatherEvent._id,
      disruption_type:          'heavy_rain',
      declared_income_loss_inr: declaredLoss,
      gps_at_claim:             claimGps,
      weather_snapshot: {
        rainfall_mm_24h:  weatherData.rainfall_mm_24h,
        temperature_c:    weatherData.temperature_c,
        aqi:              weatherData.aqi,
        triggered:        weatherData.triggered_conditions,
      },
      amount_claimed:    150000,  // ₹1,500 in paise
      claim_amount_inr:  1500,
      photo_evidence_url: null,
      notes:             'DEMO: Heavy rain — all Kurla roads flooded.',
      status:            'submitted',
      ai_status:         'PENDING',
    });

    record(3, 'Claim Auto-Created', 'done', {
      claim_id:          claim._id,
      disruption_type:   'heavy_rain',
      declared_loss_inr: declaredLoss,
      claim_amount_inr:  claim.claim_amount_inr,
    });

    // ── STEP 4: Fraud Check ──────────────────────────────────────────────────
    record(4, 'Fraud Check', 'active', {});
    await sleep(1500);

    const fullFraud = runFullFraudCheck(
      { disruption_type: 'heavy_rain', gps_at_claim: claimGps, declared_income_loss_inr: declaredLoss },
      worker,
      null,
      weatherData,
    );

    const recentClaims = await Claim.find({ worker_id: worker._id })
      .sort({ createdAt: -1 }).limit(10).lean();

    worker._policyAgeDays = Math.floor(
      (Date.now() - new Date(policy.start_date)) / (1000 * 60 * 60 * 24)
    );

    const fraudResult  = computeFraudScore(
      { disruption_type: 'heavy_rain', declared_income_loss_inr: declaredLoss, gps_at_claim: claimGps },
      worker, recentClaims, fullFraud.fraud_engine_flags,
    );
    const anomalyResult = computeAnomalyScore(
      { disruption_type: 'heavy_rain', declared_income_loss_inr: declaredLoss, gps_at_claim: claimGps },
      worker,
    );
    const aiDecision = makeClaimDecision(fraudResult, anomalyResult);

    record(4, 'Fraud Check', 'done', {
      fraud_score:   fraudResult.fraud_score,
      anomaly_score: anomalyResult.anomaly_score,
      reason_codes:  fraudResult.reason_codes,
      ai_verdict:    aiDecision.decision,
      gps_clean:     fullFraud.gps_result.isSpoofed === false,
      weather_valid: fullFraud.weather_result.isValid,
      summary:       fullFraud.summary,
    });

    // ── STEP 5: Claim Approved ───────────────────────────────────────────────
    record(5, 'Claim Approved', 'active', {});
    await sleep(800);

    await FraudLog.create({
      claim_id:       claim._id,
      worker_id:      worker._id,
      flags:          fullFraud.fraud_engine_flags,
      fraud_score:    fraudResult.fraud_score,
      recommendation: aiDecision.decision,
    });

    await Claim.findByIdAndUpdate(claim._id, {
      fraud_score:   fraudResult.fraud_score,
      anomaly_score: anomalyResult.anomaly_score,
      reason_codes:  fraudResult.reason_codes,
      ai_status:     'AUTO_APPROVED',
      status:        'approved',
      settlement_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    record(5, 'Claim Approved', 'done', {
      ai_confidence:  parseFloat(aiDecision.confidence.toFixed(2)),
      ai_status:      'AUTO_APPROVED',
      settlement_eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // ── STEP 6: Payout Sent ──────────────────────────────────────────────────
    record(6, 'Payout Sent', 'active', {});
    await sleep(1200);

    const upiId  = worker.upi_id || 'demo@upi';
    const payout = await processPayout(upiId, claim.amount_claimed, {
      claim_id:   claim._id.toString(),
      demo:       true,
      worker_name: worker.name,
    });

    await Claim.findByIdAndUpdate(claim._id, {
      razorpay_payout_id: payout.id,
      amount_paid:        claim.amount_claimed,
      status:             'paid',
      settlement_date:    new Date(),
    });

    record(6, 'Payout Sent', 'done', {
      transaction_id: payout.id,
      upi_id:         upiId,
      amount_inr:     claim.claim_amount_inr,
      paid_at:        new Date().toISOString(),
      mock:           payout.mock ?? true,
    });

    // ── Final summary ────────────────────────────────────────────────────────
    lastDemoResult = {
      ran_at:      new Date().toISOString(),
      worker_name: worker.name,
      claim_id:    claim._id,
      steps,
      success:     true,
    };

    sendEvent(res, 0, 'DEMO_COMPLETE', 'done', {
      total_steps:     6,
      claim_id:        claim._id,
      amount_paid_inr: claim.claim_amount_inr,
      transaction_id:  payout.id,
      duration_note:   'Full pipeline completed in ~7 seconds',
    });

  } catch (err) {
    console.error('[DemoController] triggerDemo error:', err.message);
    sendEvent(res, -1, 'DEMO_ERROR', 'failed', { error: err.message });
    lastDemoResult = { ran_at: new Date().toISOString(), success: false, error: err.message };
  }

  res.end();
};

// ── GET /api/demo/status ──────────────────────────────────────────────────────
const getDemoStatus = (req, res) => {
  if (!lastDemoResult) {
    return res.json({
      status:  'NO_DEMO_RUN',
      message: 'No demo has been triggered yet. POST /api/demo/trigger to run the full pipeline.',
    });
  }
  res.json(lastDemoResult);
};

module.exports = { triggerDemo, getDemoStatus };
