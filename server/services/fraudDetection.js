'use strict';

/**
 * GigShield Fraud Detection Service — Section A
 *
 * Modular, side-effect-free fraud detection functions.
 * Each returns a structured result with a fraud_score_contribution (0.0–1.0)
 * and a reason string so they can be composed with computeFraudScore() in aiEngine.js.
 *
 * Functions:
 *   detectGpsSpoofing(currentGps, previousGps, timeDeltaSeconds)
 *     → GPS velocity analysis (Haversine) to catch impossible travel speeds
 *   validateWeatherClaim(claimedDisruptionType, weatherSnapshot)
 *     → Cross-checks claimed disruption against recorded weather data
 *   runFullFraudCheck(claimData, worker, previousGps, weatherSnapshot)
 *     → Orchestrates both checks and returns unified fraud flags
 *
 * Integration: called in claimController.js before computeFraudScore().
 */

// ── Haversine distance (km) between two GPS coords ───────────────────────────
/**
 * haversineKm(lat1, lon1, lat2, lon2) → distance in kilometres
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Thresholds ────────────────────────────────────────────────────────────────
const SPEED_DEFINITE_SPOOF_KMH  = 200;  // faster than any land vehicle → definite mock
const SPEED_SUSPICIOUS_KMH      = 120;  // fast but possible on highway — suspicious
const GPS_ACCURACY_MOCK_METERS  = 200;  // poor GPS accuracy implies software mock
const GPS_ACCURACY_HIGH_METERS  = 30;   // accurate GPS (good signal)

// ── Disruption ↔ Weather validation thresholds ───────────────────────────────
const WEATHER_THRESHOLDS = {
  rain:      { field: 'rainfall_mm_24h', min: 20,  label: 'Rainfall'     },  // mm/day
  heavy_rain:{ field: 'rainfall_mm_24h', min: 50,  label: 'Rainfall'     },
  flood:     { field: 'rainfall_mm_24h', min: 80,  label: 'Rainfall'     },
  heatwave:  { field: 'temperature_c',   min: 38,  label: 'Temperature'  },  // °C
  poor_aqi:  { field: 'aqi',             min: 200, label: 'AQI'          },  // CPCB
  cyclone:   { field: 'wind_speed_kmh',  min: 60,  label: 'Wind Speed'   },  // km/h
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * detectGpsSpoofing(currentGps, previousGps, timeDeltaSeconds)
 *
 * Detects GPS spoofing via two independent signals:
 *   1. Velocity check — impossibly fast travel between two GPS pings
 *   2. Accuracy check — GPS accuracy value > 200m suggests a software mock
 *
 * @param {{ lat, lng, accuracy, timestamp }} currentGps  - GPS at time of claim
 * @param {{ lat, lng, timestamp }|null}     previousGps  - Last known good GPS
 * @param {number} timeDeltaSeconds                        - Time between pings (optional override)
 * @returns {{
 *   isSpoofed:              boolean,
 *   isHighRisk:             boolean,
 *   reason:                 string,
 *   speed_kmh:              number|null,
 *   distance_km:            number|null,
 *   accuracy_m:             number|null,
 *   fraud_score_contribution: number,   // 0.0–0.40
 *   flags:                  string[],
 * }}
 */
function detectGpsSpoofing(currentGps, previousGps = null, timeDeltaSeconds = null) {
  const flags   = [];
  let   score   = 0.0;
  let   speed   = null;
  let   distance = null;

  const accuracy = currentGps?.accuracy ?? null;

  // ── Signal 1: GPS accuracy ────────────────────────────────────────────────
  if (accuracy !== null && accuracy > GPS_ACCURACY_MOCK_METERS) {
    flags.push('GPS_ACCURACY_TOO_LOW');
    score += 0.15;
  }

  // ── Signal 2: Velocity between two GPS pings ─────────────────────────────
  if (previousGps && currentGps?.lat && previousGps?.lat) {
    distance = haversineKm(
      previousGps.lat,  previousGps.lng,
      currentGps.lat,   currentGps.lng,
    );

    // Derive time delta from timestamps if not supplied
    const dtSec = timeDeltaSeconds
      || (currentGps.timestamp && previousGps.timestamp
        ? (new Date(currentGps.timestamp) - new Date(previousGps.timestamp)) / 1000
        : null);

    if (dtSec && dtSec > 0) {
      speed = (distance / dtSec) * 3600; // km/h

      if (speed > SPEED_DEFINITE_SPOOF_KMH) {
        flags.push('IMPOSSIBLE_TRAVEL_SPEED');
        score += 0.40;
      } else if (speed > SPEED_SUSPICIOUS_KMH) {
        flags.push('SUSPICIOUS_TRAVEL_SPEED');
        score += 0.20;
      }
    } else if (distance > 50) {
      // No time delta but massive location jump (> 50 km since last ping)
      flags.push('LOCATION_JUMP_DETECTED');
      score += 0.25;
    }
  }

  score = Math.min(0.40, parseFloat(score.toFixed(3)));

  return {
    isSpoofed:                score >= 0.30,
    isHighRisk:               score >= 0.15,
    reason:                   flags.join(' | ') || 'GPS_CLEAN',
    speed_kmh:                speed !== null ? parseFloat(speed.toFixed(1)) : null,
    distance_km:              distance !== null ? parseFloat(distance.toFixed(2)) : null,
    accuracy_m:               accuracy,
    fraud_score_contribution: score,
    flags,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * validateWeatherClaim(claimedDisruptionType, weatherSnapshot)
 *
 * Validates that the claimed disruption type is supported by actual recorded
 * weather data for the worker's zone. Catches fake weather claims.
 *
 * @param {string} claimedDisruptionType  - e.g. 'rain', 'heatwave', 'flood'
 * @param {Object} weatherSnapshot        - Recorded WeatherEvent data for the zone:
 *   { rainfall_mm_24h, temperature_c, aqi, wind_speed_kmh }
 * @returns {{
 *   isValid:                  boolean,
 *   reason:                   string,
 *   claimed_type:             string,
 *   actual_value:             number|null,
 *   required_threshold:       number|null,
 *   fraud_score_contribution: number,   // 0.0–0.35
 *   flags:                    string[],
 * }}
 */
function validateWeatherClaim(claimedDisruptionType, weatherSnapshot = null) {
  if (!weatherSnapshot) {
    // No weather data recorded — cannot validate; minor penalty only
    return {
      isValid: false,
      reason:  'NO_WEATHER_SNAPSHOT_AVAILABLE',
      claimed_type: claimedDisruptionType,
      actual_value: null,
      required_threshold: null,
      fraud_score_contribution: 0.10,
      flags: ['WEATHER_UNVERIFIABLE'],
    };
  }

  const threshold = WEATHER_THRESHOLDS[claimedDisruptionType?.toLowerCase()];
  if (!threshold) {
    // Unknown disruption type — not a fraud signal, just unrecognized
    return {
      isValid: true,
      reason:  'DISRUPTION_TYPE_UNRECOGNIZED_SKIPPED',
      claimed_type: claimedDisruptionType,
      actual_value: null,
      required_threshold: null,
      fraud_score_contribution: 0.0,
      flags: [],
    };
  }

  const actualValue = weatherSnapshot[threshold.field];

  if (actualValue === undefined || actualValue === null) {
    return {
      isValid: false,
      reason:  `WEATHER_FIELD_MISSING:${threshold.field}`,
      claimed_type: claimedDisruptionType,
      actual_value: null,
      required_threshold: threshold.min,
      fraud_score_contribution: 0.10,
      flags: ['WEATHER_DATA_INCOMPLETE'],
    };
  }

  if (actualValue < threshold.min) {
    const deficit = threshold.min - actualValue;
    // Severity of mismatch: bigger gap = stronger fraud signal
    const contribution = Math.min(0.35, parseFloat((deficit / threshold.min * 0.50).toFixed(3)));
    return {
      isValid: false,
      reason:  `WEATHER_MISMATCH:claimed=${claimedDisruptionType},actual_${threshold.field}=${actualValue},required>=${threshold.min}`,
      claimed_type: claimedDisruptionType,
      actual_value: actualValue,
      required_threshold: threshold.min,
      fraud_score_contribution: contribution,
      flags: ['FAKE_WEATHER_CLAIM'],
    };
  }

  return {
    isValid: true,
    reason:  `WEATHER_VERIFIED:${threshold.label}=${actualValue}>=${threshold.min}`,
    claimed_type: claimedDisruptionType,
    actual_value: actualValue,
    required_threshold: threshold.min,
    fraud_score_contribution: 0.0,
    flags: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * runFullFraudCheck(claimData, worker, previousGps, weatherSnapshot)
 *
 * Orchestrates GPS spoofing detection + weather claim validation.
 * Returns a fraud engine flags object compatible with computeFraudScore() in aiEngine.js.
 *
 * @param {Object} claimData         - { disruption_type, gps_at_claim, declared_income_loss_inr }
 * @param {Object} worker            - Worker document
 * @param {Object|null} previousGps  - Last known GPS from ActivityLog
 * @param {Object|null} weatherSnapshot - Recorded weather for zone
 * @returns {{
 *   combined_fraud_score: number,     // 0.0–1.0
 *   gps_result:           Object,
 *   weather_result:       Object,
 *   fraud_engine_flags:   Object,     // pass directly into computeFraudScore()
 *   all_flags:            string[],
 *   summary:              string,
 * }}
 */
function runFullFraudCheck(claimData = {}, worker = {}, previousGps = null, weatherSnapshot = null) {
  const gpsResult     = detectGpsSpoofing(claimData.gps_at_claim, previousGps);
  const weatherResult = validateWeatherClaim(claimData.disruption_type, weatherSnapshot);

  const combinedScore = Math.min(1.0,
    parseFloat((gpsResult.fraud_score_contribution + weatherResult.fraud_score_contribution).toFixed(3))
  );

  const allFlags = [...gpsResult.flags, ...weatherResult.flags];

  // Map to the flag schema expected by computeFraudScore() in aiEngine.js
  const fraudEngineFlags = {
    geo_fence_violation:          gpsResult.flags.includes('LOCATION_JUMP_DETECTED'),
    gps_mock_detected:            gpsResult.flags.includes('IMPOSSIBLE_TRAVEL_SPEED') || gpsResult.flags.includes('GPS_ACCURACY_TOO_LOW'),
    suspicious_travel_speed:      gpsResult.flags.includes('SUSPICIOUS_TRAVEL_SPEED'),
    fake_weather_claim:           weatherResult.flags.includes('FAKE_WEATHER_CLAIM'),
    weather_unverifiable:         weatherResult.flags.includes('WEATHER_UNVERIFIABLE'),
    insufficient_activity_history: !worker?.createdAt || ((Date.now() - new Date(worker.createdAt)) / (1000 * 60 * 60 * 24)) < 14,
  };

  let summary = 'CLEAN';
  if (combinedScore >= 0.50) summary = 'HIGH_FRAUD_RISK';
  else if (combinedScore >= 0.25) summary = 'MODERATE_FRAUD_RISK';
  else if (combinedScore > 0) summary = 'LOW_FRAUD_SIGNAL';

  return {
    combined_fraud_score: combinedScore,
    gps_result:           gpsResult,
    weather_result:       weatherResult,
    fraud_engine_flags:   fraudEngineFlags,
    all_flags:            allFlags,
    summary,
  };
}

module.exports = {
  detectGpsSpoofing,
  validateWeatherClaim,
  runFullFraudCheck,
  haversineKm,
  WEATHER_THRESHOLDS,
};
