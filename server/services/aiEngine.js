/**
 * GigShield AI Engine — Mock Implementation
 *
 * In production (v2), these functions would call ONNX model servers
 * running XGBoost, LightGBM, and Isolation Forest models.
 * For MVP, they implement rule-based logic that mirrors the model behavior
 * described in the README, with the same input features, output shapes,
 * and confidence ranges.
 *
 * Functions:
 *  computeRiskScore(worker)              → XGBoost Regressor mock
 *  computeFraudScore(claimData, worker, recentClaims) → LightGBM Classifier mock
 *  computeAnomalyScore(claimData, worker) → Isolation Forest mock
 */

'use strict';

// ── Lookup tables ─────────────────────────────────────────────────────────────

/** City flood vulnerability index (0.0–1.0).  Source: historical IMD data. */
const CITY_FLOOD_INDEX = {
  Mumbai:      0.92,
  Chennai:     0.85,
  Kolkata:     0.88,
  Vijayawada:  0.83,
  Patna:       0.80,
  Hyderabad:   0.65,
  Bangalore:   0.52,
  Delhi:       0.60,
  Pune:        0.55,
  Ahmedabad:   0.50,
};

/** Occupation risk weight (0.0–1.0). High-risk jobs = higher premium. */
const OCCUPATION_RISK = {
  construction_worker: 0.85,
  delivery_rider:      0.60,
  factory_worker:      0.70,
  auto_driver:         0.55,
  street_vendor:       0.40,
  domestic_worker:     0.45,
  other:               0.50,
};

/** Platform exposure weight — two-wheelers are more exposed than 4W. */
const PLATFORM_EXPOSURE = {
  Swiggy:  0.75,
  Zomato:  0.75,
  Zepto:   0.70,
  Dunzo:   0.65,
  Porter:  0.40,
  Amazon:  0.35,
  Other:   0.50,
};

/** Premium tiers (INR/week) matching README spec. */
const TIER_PREMIUMS = { LOW: 15, MEDIUM: 25, HIGH: 40 };

// ── Feature engineering helper ────────────────────────────────────────────────

/**
 * Build a feature vector for a worker (matches README's XGBoost feature table).
 * Missing values are imputed with safe defaults.
 */
function buildRiskFeatures(worker) {
  const floodIndex      = CITY_FLOOD_INDEX[worker.city] ?? 0.50;
  const platformWeight  = PLATFORM_EXPOSURE[worker.platform] ?? 0.50;
  const weeklyIncome    = worker.declared_weekly_income_inr || worker.avg_income * 7 / 30 || 3500;
  const monthsActive    = worker.createdAt
    ? Math.floor((Date.now() - new Date(worker.createdAt)) / (1000 * 60 * 60 * 24 * 30))
    : 1;
  const hasDevice       = worker.device_id ? 1 : 0;
  const zonePinCode     = worker.zone_pin_code || '';

  return {
    city_flood_index:              floodIndex,
    platform_exposure_weight:      platformWeight,
    occupation_risk:               OCCUPATION_RISK[worker.occupation_type] ?? 0.50,
    declared_weekly_income_inr:    weeklyIncome,
    months_active_on_platform:     monthsActive,
    has_device_id:                 hasDevice,
    zone_pin_code:                 zonePinCode,
    platform_type:                 worker.platform || 'Other',
    city:                          worker.city || 'Unknown',
  };
}

// ── Model 1: XGBoost Risk Score ───────────────────────────────────────────────

/**
 * computeRiskScore(worker)
 *
 * Mock XGBoost Regressor. Returns a risk score 0–100 and a tier (LOW/MEDIUM/HIGH).
 * Feature contributions are computed individually so the response includes
 * the contributing_factors array required by the README API spec.
 *
 * Production equivalent: POST to ONNX model server with feature vector.
 */
function computeRiskScore(worker) {
  const features  = buildRiskFeatures(worker);
  const factors   = [];
  let score       = 10; // base score

  // Feature 1: Occupation risk weight
  const occupationContribution = Math.round(features.occupation_risk * 25);
  score += occupationContribution;
  factors.push({
    feature: 'occupation_type',
    value:   worker.occupation_type || 'delivery_rider',
    impact:  occupationContribution > 18 ? 'HIGH' : occupationContribution > 12 ? 'MEDIUM' : 'LOW',
    contribution: occupationContribution,
  });

  // Feature 2: City flood vulnerability index
  const floodContribution = Math.round(features.city_flood_index * 35);
  score += floodContribution;
  factors.push({
    feature: 'city_flood_index',
    value:   features.city_flood_index,
    impact:  floodContribution > 22 ? 'HIGH' : floodContribution > 13 ? 'MEDIUM' : 'LOW',
    contribution: floodContribution,
  });

  // Feature 3: Platform exposure (two-wheeler vs four-wheeler)
  const platformContribution = Math.round(features.platform_exposure_weight * 15);
  score += platformContribution;
  factors.push({
    feature: 'platform_type',
    value:   features.platform_type,
    impact:  platformContribution > 10 ? 'HIGH' : platformContribution > 7 ? 'MEDIUM' : 'LOW',
    contribution: platformContribution,
  });

  // Feature 4: Declared weekly income (higher income → more to lose → higher tier)
  const incomeContribution = features.declared_weekly_income_inr > 7000 ? 10
    : features.declared_weekly_income_inr > 4500 ? 6 : 3;
  score += incomeContribution;
  factors.push({
    feature: 'declared_weekly_income_inr',
    value:   features.declared_weekly_income_inr,
    impact:  incomeContribution > 7 ? 'MEDIUM' : 'LOW',
    contribution: incomeContribution,
  });

  // Feature 5: Account tenure (newer workers = higher uncertainty)
  const tenureContribution = features.months_active_on_platform < 2 ? 10
    : features.months_active_on_platform < 6 ? 5 : 0;
  score += tenureContribution;
  factors.push({
    feature: 'months_active_on_platform',
    value:   features.months_active_on_platform,
    impact:  tenureContribution > 7 ? 'MEDIUM' : 'LOW',
    contribution: tenureContribution,
  });

  // Clamp to 0–100
  score = Math.min(100, Math.max(0, score));

  // Determine tier
  let tier;
  if (score >= 60)      tier = 'HIGH';
  else if (score >= 35) tier = 'MEDIUM';
  else                  tier = 'LOW';

  // Model validation metrics (from README): R² > 0.85 target
  const nearBoundary = (score > 55 && score < 65) || (score > 30 && score < 40);
  const ai_confidence = nearBoundary ? 0.84 : 0.92;

  return {
    risk_score:                score,
    risk_tier:                 tier,
    premium_recommendation_inr: TIER_PREMIUMS[tier],
    contributing_factors:      factors,
    ai_confidence,
    model:                     'XGBoost-Regressor-v1-mock',
    last_computed_at:          new Date().toISOString(),
  };
}

// ── Model 2: LightGBM Fraud Score ─────────────────────────────────────────────

/**
 * computeFraudScore(claimData, worker, recentClaims, fraudFlags)
 *
 * Mock LightGBM Binary Classifier.
 * Returns a fraud score 0.0–1.0 and named reason_codes.
 * README targets: Precision > 92%, Recall > 78%, AUC-ROC > 0.91.
 */
function computeFraudScore(claimData, worker, recentClaims = [], fraudEngineFlags = {}) {
  let score       = 0.0;
  const reasons   = [];

  // Feature 1: GPS zone mismatch
  if (fraudEngineFlags.geo_fence_violation) {
    score += 0.30;
    reasons.push('GPS_ZONE_MISMATCH');
  }

  // Feature 2: Claim frequency in last 30 days (> 3 is suspicious)
  const claimCount30d = recentClaims.filter(c => {
    const age = (Date.now() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
    return age <= 30;
  }).length;
  if (claimCount30d > 3) {
    score += 0.25;
    reasons.push('HIGH_CLAIM_FREQUENCY');
  }

  // Feature 3: Duplicate device account
  if (fraudEngineFlags.duplicate_device_account) {
    score += 0.25;
    reasons.push('DUPLICATE_DEVICE_ACCOUNT');
  }

  // Feature 4: GPS mock signal
  if (fraudEngineFlags.gps_mock_detected) {
    score += 0.35;
    reasons.push('GPS_MOCK_DETECTED');
  }

  // Feature 5: Declared loss exceeds 100% of weekly income
  const weeklyIncome = worker.declared_weekly_income_inr || worker.avg_income * 7 / 30 || 3500;
  if (claimData.declared_income_loss_inr > weeklyIncome) {
    score += 0.20;
    reasons.push('LOSS_EXCEEDS_DECLARED_INCOME');
  }

  // Feature 6: No photo evidence submitted (mild signal)
  if (!claimData.photo_evidence_url) {
    score += 0.05;
  }

  // Feature 7: Insufficient activity history
  if (fraudEngineFlags.insufficient_activity_history) {
    score += 0.10;
    reasons.push('INSUFFICIENT_ACTIVITY_HISTORY');
  }

  score = Math.min(1.0, Math.max(0.0, parseFloat(score.toFixed(3))));

  return {
    fraud_score: score,
    reason_codes: reasons,
    model: 'LightGBM-Classifier-v1-mock',
  };
}

// ── Model 3: Isolation Forest Anomaly Score ───────────────────────────────────

/**
 * computeAnomalyScore(claimData, worker, peerStats)
 *
 * Mock Isolation Forest detection.
 * Scores < -0.10 trigger manual review.
 */
function computeAnomalyScore(claimData, worker, peerStats = {}) {
  let score = 0.0;

  // Signal 1: Claim filed very shortly after policy purchase
  if (worker._policyAgeDays !== undefined && worker._policyAgeDays < 14) {
    score -= 0.15;
  }

  // Signal 2: Declared loss far exceeds peer average in zone
  if (peerStats.avg_loss_inr && claimData.declared_income_loss_inr) {
    const ratio = claimData.declared_income_loss_inr / peerStats.avg_loss_inr;
    if (ratio > 3.0)      score -= 0.20;
    else if (ratio > 2.0) score -= 0.10;
  }

  // Signal 3: GPS accuracy suspicious (> 100m = likely mocked)
  if (claimData.gps_at_claim?.accuracy > 100) {
    score -= 0.12;
  }

  score = Math.max(-0.5, score);

  return {
    anomaly_score:      parseFloat(score.toFixed(3)),
    is_anomalous:       score < -0.10,
    model:              'IsolationForest-v1-mock',
    flagged_for_review: score < -0.10,
  };
}

// ── Decision Gate ─────────────────────────────────────────────────────────────

/**
 * makeClaimDecision(fraudResult, anomalyResult)
 *
 * README thresholds:
 *   Fraud score < 0.30 AND no anomaly → AUTO_APPROVED
 *   Fraud score 0.30–0.70 OR anomaly  → FLAGGED (manual review)
 *   Fraud score > 0.70                → REJECTED
 */
function makeClaimDecision(fraudResult, anomalyResult) {
  const { fraud_score } = fraudResult;
  const { is_anomalous } = anomalyResult;

  if (fraud_score > 0.70) {
    return { decision: 'REJECTED',      ai_status: 'REJECTED',      confidence: 1 - fraud_score };
  }
  if (fraud_score >= 0.30 || is_anomalous) {
    return { decision: 'MANUAL_REVIEW', ai_status: 'FLAGGED',       confidence: 1 - fraud_score };
  }
  return   { decision: 'AUTO_APPROVED', ai_status: 'AUTO_APPROVED', confidence: 1 - fraud_score };
}

module.exports = {
  computeRiskScore,
  computeFraudScore,
  computeAnomalyScore,
  makeClaimDecision,
  TIER_PREMIUMS,
};
