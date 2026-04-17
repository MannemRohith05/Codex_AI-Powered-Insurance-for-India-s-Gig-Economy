const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const FraudLog = require('../models/FraudLog');
const Policy = require('../models/Policy');
const DisruptionEvent = require('../models/DisruptionEvent');
const WeatherEvent = require('../models/WeatherEvent');
const { generateToken } = require('../utils/jwt');
const { processPayout } = require('../services/razorpay');
const { getActuarialSnapshot, getSustainabilityVerdict, computeLossRatio, computePerZoneLossRatio } = require('../services/actuarialHealth');
const { computeRiskScore, computeFraudScore, MODEL_METADATA } = require('../services/aiEngine');
const { getZoneData, HYPER_LOCAL_ZONE_TABLE, computeCompositeZoneRisk } = require('../services/zoneData');

// POST /api/admin/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid password' });
    const token = generateToken({ id: admin._id, role: 'admin', email: admin.email });
    res.json({ token, admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totalWorkers, activePolicies, pendingClaims, fraudLogs, totalPaid] = await Promise.all([
      Worker.countDocuments(),
      Policy.countDocuments({ status: 'active' }),
      Claim.countDocuments({ status: 'under_review' }),
      FraudLog.countDocuments({ recommendation: 'REJECT' }),
      Claim.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount_paid' } } }]),
    ]);
    res.json({
      totalWorkers, activePolicies, pendingClaims, flaggedFraud: fraudLogs,
      totalPaidOut: totalPaid[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/claims
const getClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate('worker_id', 'name phone platform city upi_id')
        .populate('policy_id', 'premium_tier coverage_amount')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Claim.countDocuments(filter),
    ]);
    res.json({ claims, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/claim/:id/approve
const approveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await Claim.findById(id).populate('worker_id', 'upi_id');
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    let payoutId = null;
    let paidAmount = null;
    if (claim.worker_id?.upi_id) {
      try {
        const payout = await processPayout(claim.worker_id.upi_id, claim.amount_claimed, { claim_id: id });
        payoutId = payout.id;
        paidAmount = claim.amount_claimed;
      } catch (e) {
        console.error('[Admin Approve] Payout failed:', e.message);
      }
    }

    const updated = await Claim.findByIdAndUpdate(id, {
      status: payoutId ? 'paid' : 'approved',
      razorpay_payout_id: payoutId,
      amount_paid: paidAmount,
    }, { new: true });

    await FraudLog.findOneAndUpdate({ claim_id: id }, { reviewed_by: req.user.id, reviewed_at: new Date() });

    res.json({ message: 'Claim approved', claim: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/claim/:id/reject
const rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await Claim.findByIdAndUpdate(id, { status: 'rejected', rejection_reason: reason }, { new: true });
    await FraudLog.findOneAndUpdate({ claim_id: id }, { reviewed_by: req.user.id, reviewed_at: new Date() });
    res.json({ message: 'Claim rejected', claim: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/fraud-panel
const getFraudPanel = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [logs, total] = await Promise.all([
      FraudLog.find()
        .populate('claim_id', 'disruption_type amount_claimed status createdAt')
        .populate('worker_id', 'name phone platform city fraud_score')
        .populate('reviewed_by', 'name email')
        .sort({ fraud_score: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      FraudLog.countDocuments(),
    ]);
    res.json({ logs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/workers
const getWorkers = async (req, res) => {
  try {
    const { platform, city, verified, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (platform) filter.platform = platform;
    if (city) filter.city = city;
    if (verified !== undefined) filter.aadhaar_verified = verified === 'true';
    const [workers, total] = await Promise.all([
      Worker.find(filter).select('-password_hash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Worker.countDocuments(filter),
    ]);
    res.json({ workers, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/disruption
const createDisruption = async (req, res) => {
  try {
    const { city, zone, type, severity, weather_data } = req.body;
    const event = await DisruptionEvent.create({
      city, zone, type, severity, weather_data,
      declared_by: req.user.id,
      is_active: true,
    });
    res.status(201).json({ message: 'Disruption event created', event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/disruptions
const getDisruptions = async (req, res) => {
  try {
    const events = await DisruptionEvent.find().sort({ createdAt: -1 }).limit(50).populate('declared_by', 'name');
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/claims/heatmap - returns GPS coords for active claims
const getClaimsHeatmap = async (req, res) => {
  try {
    const claims = await Claim.find({ gps_at_claim: { $exists: true } })
      .select('gps_at_claim disruption_type status amount_claimed')
      .limit(500);
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/actuarial-health
// Returns the full IRDAI-standard actuarial sustainability report:
//   loss ratio, reserve adequacy, burn rate, verdict (GREEN/AMBER/RED),
//   stress loading factor and recommended actions.
const getActuarialHealth = async (req, res) => {
  try {
    const snapshot = await getActuarialSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/recalibrate-premiums
// Re-computes the pool stress loading factor and returns the recommended
// premium adjustment. Admins trigger this after reviewing the actuarial
// health report. The factor feeds into computeRiskScore() via the opts arg.
const triggerPremiumRecalibration = async (req, res) => {
  try {
    const { loss_ratio, reserve_adequacy_ratio } = await computeLossRatio().then(async lr => {
      const burnData    = await require('../services/actuarialHealth').computeBurnRate();
      const reserveData = require('../services/actuarialHealth')
        .computeReserveAdequacy(500000, burnData.weekly_payout_inr);
      return { loss_ratio: lr.loss_ratio, reserve_adequacy_ratio: reserveData.reserve_adequacy_ratio };
    });

    const verdict = getSustainabilityVerdict(loss_ratio, reserve_adequacy_ratio);

    console.log(`[Actuarial] Recalibration triggered. verdict=${verdict.verdict} stress_factor=${verdict.stress_loading_factor}`);

    res.json({
      message:              'Premium recalibration complete',
      loss_ratio,
      sustainability_verdict: verdict.verdict,
      stress_loading_factor:  verdict.stress_loading_factor,
      recommended_actions:    verdict.recommended_actions,
      applied_at:             new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/zone-loss-ratios — per-zone loss ratio table (Section H)
const getZoneLossRatios = async (req, res) => {
  try {
    const zones = await computePerZoneLossRatio();
    const dangerZones = zones.filter(z => z.status === 'DANGER' || z.status === 'CRITICAL');
    res.json({
      zones,
      total_zones:  zones.length,
      danger_zones: dangerZones.length,
      has_warnings: dangerZones.length > 0,
      computed_at:  new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/predictive-analytics — 7-day forecast + high-risk zones (Section C)
const getPredictiveAnalytics = async (req, res) => {
  try {
    // Pull active disruptions to seed forecast
    const activeDisruptions = await DisruptionEvent.find({ is_active: true })
      .sort({ createdAt: -1 }).limit(20).lean();

    // Historical claim frequency (last 30 days) by disruption type
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const claimsByType = await Claim.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$disruption_type', count: { $sum: 1 } } },
    ]);
    const typeFreq = {};
    for (const t of claimsByType) typeFreq[t._id] = t.count;

    // Build 7-day forecast using active disruptions + historical rates
    const DISRUPTION_TYPES = ['rain', 'heavy_rain', 'flood', 'heatwave', 'poor_aqi'];
    const BASE_DAILY_RATE  = { rain: 2.1, heavy_rain: 3.5, flood: 5.0, heatwave: 1.8, poor_aqi: 1.2 };

    const activeTypes = new Set(activeDisruptions.map(d => d.type));
    const forecast = [];
    for (let day = 1; day <= 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      let predicted = 0;
      let dom_type  = 'none';
      let maxCount  = 0;
      for (const t of DISRUPTION_TYPES) {
        const active_multiplier = activeTypes.has(t) ? 2.0 : 0.6;
        const hist_multiplier   = typeFreq[t] ? (typeFreq[t] / 30) : 0.5;
        const daily             = parseFloat((BASE_DAILY_RATE[t] * active_multiplier * hist_multiplier).toFixed(1));
        predicted += daily;
        if (daily > maxCount) { maxCount = daily; dom_type = t; }
      }
      forecast.push({
        day,
        date:              date.toISOString().slice(0, 10),
        predicted_claims:  parseFloat(predicted.toFixed(1)),
        dominant_type:     dom_type,
        confidence:        activeTypes.size > 0 ? 0.78 : 0.55,
        active_disruptions: activeTypes.size,
      });
    }

    // Top 5 high-risk zones from zoneData
    const highRiskZones = Object.entries(HYPER_LOCAL_ZONE_TABLE)
      .map(([pin, z]) => ({ pin, ...z, composite: computeCompositeZoneRisk(z) }))
      .sort((a, b) => b.composite - a.composite)
      .slice(0, 5)
      .map(z => ({
        zone_pin:       z.pin,
        city:           z.city,
        locality:       z.locality,
        composite_risk: parseFloat(z.composite.toFixed(3)),
        flood_risk:     z.flood_risk,
        traffic_density: z.traffic_density,
      }));

    // Claim status summary
    const [totalClaims, approvedClaims, rejectedClaims, pendingClaims] = await Promise.all([
      Claim.countDocuments(),
      Claim.countDocuments({ status: { $in: ['approved', 'paid'] } }),
      Claim.countDocuments({ status: 'rejected' }),
      Claim.countDocuments({ status: 'under_review' }),
    ]);

    res.json({
      forecast,
      high_risk_zones:  highRiskZones,
      active_disruptions: activeDisruptions.length,
      claims_summary: { total: totalClaims, approved: approvedClaims, rejected: rejectedClaims, pending: pendingClaims },
      computed_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ml/predict — ML stub endpoint (Section F)
// Accepts exact feature vector a scikit-learn RandomForest would use.
// Backed by aiEngine.js simulation until a real .pkl model is wired in.
const mlPredict = async (req, res) => {
  try {
    const {
      rainfall_mm         = 0,
      distance_km         = 5,
      claimed_loss_amount = 1500,
      historical_fraud_score = 0.1,
      day_of_week         = new Date().getDay(),
      // Optional extended features
      zone_pin_code,
      platform,
      occupation_type,
    } = req.body;

    // Build synthetic worker for the risk scorer
    const syntheticWorker = {
      zone_pin_code:               zone_pin_code || '500034',
      platform:                    platform || 'Swiggy',
      occupation_type:             occupation_type || 'delivery_rider',
      declared_weekly_income_inr:  claimed_loss_amount * 2,
      avg_income:                  claimed_loss_amount * 2 * 30 / 7,
      createdAt:                   new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    };

    const riskResult  = computeRiskScore(syntheticWorker);
    const fraudResult = computeFraudScore(
      { declared_income_loss_inr: claimed_loss_amount, disruption_type: rainfall_mm > 50 ? 'heavy_rain' : 'rain' },
      syntheticWorker,
      [],
      { fake_weather_claim: rainfall_mm < 10 },
    );

    // Format identical to what a scikit-learn RandomForest API would return
    const fraud_probability = parseFloat((
      fraudResult.fraud_score * 0.60 + historical_fraud_score * 0.40
    ).toFixed(3));

    res.json({
      // Standard sklearn-compatible response schema
      prediction:   fraud_probability > 0.50 ? 1 : 0,
      probability:  [parseFloat((1 - fraud_probability).toFixed(3)), fraud_probability],
      class_labels: ['LEGITIMATE', 'FRAUD'],

      // Feature importance (matches MODEL_METADATA)
      feature_vector: {
        rainfall_mm,
        distance_km,
        claimed_loss_amount,
        historical_fraud_score,
        day_of_week,
        risk_score:   riskResult.risk_score,
        risk_tier:    riskResult.risk_tier,
      },

      // Engine metadata
      model:          'RandomForest-v1-stub',
      engine:         'aiEngine.js simulation (XGBoost + LightGBM ensemble)',
      engine_version: '1.4.2',
      note:           'TODO: Replace with Python microservice loading trained .pkl file. Feature vector is production-ready.',
      model_metadata: MODEL_METADATA.fraud_model,
      computed_at:    new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/ml/metadata — returns full MODEL_METADATA from aiEngine.js
const mlMetadata = (req, res) => {
  res.json({
    models:      MODEL_METADATA,
    description: 'GigShield AI Engine — XGBoost Risk + LightGBM Fraud + IsolationForest Anomaly (ONNX-export compatible format)',
    note:        'In production: models served via ONNX Runtime or scikit-learn microservice. Current: calibrated simulation.',
  });
};

module.exports = {
  login, getDashboard, getClaims, approveClaim, rejectClaim,
  getFraudPanel, getWorkers, createDisruption, getDisruptions,
  getClaimsHeatmap, getActuarialHealth, triggerPremiumRecalibration,
  getZoneLossRatios, getPredictiveAnalytics,
  mlPredict, mlMetadata,
};
