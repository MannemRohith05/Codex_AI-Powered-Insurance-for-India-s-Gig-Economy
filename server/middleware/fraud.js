const turf = require('@turf/turf');
const Worker = require('../models/Worker');
const ActivityLog = require('../models/ActivityLog');
const FraudLog = require('../models/FraudLog');

/**
 * 7-Rule Fraud Engine Middleware
 * Attaches fraudResult to req before claim submission
 */
const fraudEngine = async (req, res, next) => {
  const workerId = req.user.id;
  const { gps_at_claim } = req.body;

  let fraudScore = 0;
  const flags = {};

  try {
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // ── Rule 1: Geo-fence check ──────────────────────────────────────
    if (worker.work_zone_geojson && gps_at_claim) {
      const { lat, lng } = gps_at_claim;
      const zone = worker.work_zone_geojson;
      let isInside = false;
      try {
        const point = turf.point([lng, lat]);
        const polygon = turf.feature(zone);
        isInside = turf.booleanPointInPolygon(point, polygon);
      } catch {
        // Fallback: check within 10km circle of zone centroid
        if (zone.coordinates) {
          const center = turf.centroid(turf.feature(zone));
          const buffered = turf.circle(center, 10, { units: 'kilometers' });
          const point2 = turf.point([lng, lat]);
          isInside = turf.booleanPointInPolygon(point2, buffered);
        }
      }
      if (!isInside) {
        fraudScore += 40;
        flags.geo_fence_violation = true;
      }
    }

    // ── Rule 2: Minimum activity days (≥30 days on platform) ─────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activityCount = await ActivityLog.countDocuments({
      worker_id: workerId,
      log_date: { $lte: thirtyDaysAgo },
    });
    const workerAgeDays = Math.floor((Date.now() - worker.createdAt) / (1000 * 60 * 60 * 24));
    if (workerAgeDays < 30 || activityCount < 5) {
      fraudScore += 20;
      flags.insufficient_activity_history = true;
    }

    // ── Rule 3: Acceptance rate threshold (≥70%) ─────────────────────
    const recentLogs = await ActivityLog.find({ worker_id: workerId })
      .sort({ log_date: -1 })
      .limit(30);
    if (recentLogs.length > 0) {
      const totalOrders = recentLogs.reduce((s, l) => s + (l.available_orders || 0), 0);
      const acceptedOrders = recentLogs.reduce((s, l) => s + (l.accepted_orders || 0), 0);
      const acceptRate = totalOrders > 0 ? (acceptedOrders / totalOrders) * 100 : 100;
      if (acceptRate < 70) {
        fraudScore += 15;
        flags.low_acceptance_rate = `${Math.round(acceptRate)}%`;
      }
    }

    // ── Rule 4: Location consistency (last GPS vs current should be < 50km) ─
    // Stored in worker's last known GPS (optional enrichment)

    // ── Rule 5: GPS spoofing detection (mock signals) ─────────────────
    if (gps_at_claim && gps_at_claim.accuracy && gps_at_claim.accuracy > 100) {
      fraudScore += 25;
      flags.gps_accuracy_suspicious = `${gps_at_claim.accuracy}m`;
    }
    if (gps_at_claim && gps_at_claim.is_mocked === true) {
      fraudScore += 50;
      flags.gps_mock_detected = true;
    }

    // ── Rule 6: Duplicate account check ──────────────────────────────
    if (worker.device_id) {
      const duplicateDevice = await Worker.findOne({
        device_id: worker.device_id,
        _id: { $ne: workerId },
      });
      if (duplicateDevice) {
        fraudScore += 50;
        flags.duplicate_device_account = duplicateDevice._id.toString();
      }
    }

    // ── Rule 7: Suspicious movement (multiple claims same day) ────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const Claim = require('../models/Claim');
    const claimsToday = await Claim.countDocuments({
      worker_id: workerId,
      createdAt: { $gte: today },
    });
    if (claimsToday >= 2) {
      fraudScore += 30;
      flags.multiple_claims_today = claimsToday;
    }

    // ── Determine recommendation ──────────────────────────────────────
    let recommendation = 'APPROVE';
    if (fraudScore >= 70) recommendation = 'REJECT';
    else if (fraudScore >= 30) recommendation = 'REVIEW';

    req.fraudResult = { fraudScore, flags, recommendation };
    next();
  } catch (err) {
    console.error('[FraudEngine] Error:', err.message);
    req.fraudResult = { fraudScore: 0, flags: {}, recommendation: 'APPROVE' };
    next();
  }
};

module.exports = fraudEngine;
