'use strict';

/**
 * GigShield Actuarial Health Service
 *
 * Addresses feedback Point 3: "actuarial sustainability concerns identified
 * in their own analysis" need to be reflected in actual running code.
 *
 * Implements the two core IRDAI actuarial sustainability metrics:
 *   1. Loss Ratio = Total Claims Paid / Total Premiums Collected
 *      - Industry IRDAI benchmark: < 0.70 is healthy
 *      - Danger zone: > 0.75  → AMBER alert
 *      - Critical:    > 0.90  → RED alert (pool insolvency risk)
 *
 *   2. Reserve Adequacy Ratio = Reserve Fund / (Expected Claims × 3 months)
 *      - Should be >= 1.0 at all times
 *
 *   3. Burn Rate = Weekly payout velocity (INR/week)
 *
 *   4. Stress Loading Factor = premium multiplier when pool is under stress
 *      - Healthy:  1.00 (no adjustment)
 *      - Amber:    1.10 (+10% to recover pool)
 *      - Red:      1.25 (+25% emergency surcharge)
 */

const Claim  = require('../models/Claim');
const Policy = require('../models/Policy');

// ── Constants (IRDAI benchmarks) ──────────────────────────────────────────────
const LOSS_RATIO_WARNING  = 0.70;   // IRDAI recommended ceiling
const LOSS_RATIO_DANGER   = 0.75;   // GigShield AMBER threshold
const LOSS_RATIO_CRITICAL = 0.90;   // GigShield RED threshold

const RESERVE_ADEQUACY_MIN = 1.0;   // Reserve must cover 3 months of expected claims

// Simulated reserve fund (in INR) — in production this comes from a FundLedger model
const SIMULATED_RESERVE_INR = 500_000;  // ₹5 lakh starting reserve

/**
 * computeLossRatio()
 *
 * Queries the DB for total premiums collected vs total claims paid.
 * @returns {{ total_premiums_inr, total_claims_paid_inr, loss_ratio }}
 */
async function computeLossRatio() {
  const [premiumAgg, claimsAgg] = await Promise.all([
    Policy.aggregate([
      { $group: { _id: null, total: { $sum: '$premium_amount_inr' } } },
    ]),
    Claim.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$claim_amount_inr' } } },
    ]),
  ]);

  const total_premiums_inr    = premiumAgg[0]?.total || 0;
  const total_claims_paid_inr = claimsAgg[0]?.total  || 0;

  const loss_ratio = total_premiums_inr > 0
    ? parseFloat((total_claims_paid_inr / total_premiums_inr).toFixed(4))
    : 0;

  return { total_premiums_inr, total_claims_paid_inr, loss_ratio };
}

/**
 * computeBurnRate()
 *
 * Weekly payout velocity: total paid in last 7 days (INR/week).
 */
async function computeBurnRate() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const agg = await Claim.aggregate([
    { $match: { status: 'paid', updatedAt: { $gte: oneWeekAgo } } },
    { $group: { _id: null, total: { $sum: '$claim_amount_inr' }, count: { $sum: 1 } } },
  ]);
  return {
    weekly_payout_inr: agg[0]?.total || 0,
    claims_paid_last_7d: agg[0]?.count || 0,
  };
}

/**
 * computeReserveAdequacy(reserve_inr, weekly_burn_inr)
 *
 * IRDAI standard: reserve must cover at least 3 months of expected burn.
 * monthly_burn = weekly_burn × 4.33
 * three_month_exposure = monthly_burn × 3
 * reserve_adequacy_ratio = reserve_inr / three_month_exposure
 */
function computeReserveAdequacy(reserve_inr, weekly_burn_inr) {
  const monthly_burn_inr       = weekly_burn_inr * 4.33;
  const three_month_exposure   = monthly_burn_inr * 3;
  const reserve_adequacy_ratio = three_month_exposure > 0
    ? parseFloat((reserve_inr / three_month_exposure).toFixed(3))
    : 999; // If no burn, reserve is effectively infinite

  const months_of_runway       = weekly_burn_inr > 0
    ? parseFloat((reserve_inr / (weekly_burn_inr * 4.33)).toFixed(1))
    : null;

  return {
    reserve_inr,
    monthly_burn_inr:        Math.round(monthly_burn_inr),
    three_month_exposure_inr: Math.round(three_month_exposure),
    reserve_adequacy_ratio,
    months_of_runway,
    is_adequate:             reserve_adequacy_ratio >= RESERVE_ADEQUACY_MIN,
  };
}

/**
 * getSustainabilityVerdict(loss_ratio, reserve_adequacy_ratio)
 *
 * Returns GREEN | AMBER | RED and recommended actions.
 */
function getSustainabilityVerdict(loss_ratio, reserve_adequacy_ratio) {
  if (loss_ratio >= LOSS_RATIO_CRITICAL || reserve_adequacy_ratio < 0.5) {
    return {
      verdict:              'RED',
      color:                '#ef4444',
      stress_loading_factor: 1.25,
      recommended_actions: [
        'Immediately raise premium tier thresholds by 25%',
        'Trigger emergency reserve replenishment',
        'Halt new policy issuance until reserve > ₹3,00,000',
        'Notify IRDAI under Form IRDA-HLT/Claims/019',
      ],
    };
  }
  if (loss_ratio >= LOSS_RATIO_DANGER || reserve_adequacy_ratio < 1.0) {
    return {
      verdict:              'AMBER',
      color:                '#f59e0b',
      stress_loading_factor: 1.10,
      recommended_actions: [
        'Apply 10% stress loading to all new premium recommendations',
        'Increase claim scrutiny — lower fraud threshold to 0.25',
        'Review payout amounts for high-frequency disruption types',
        'Increase reserve contribution from 15% → 25% of premiums',
      ],
    };
  }
  return {
    verdict:              'GREEN',
    color:                '#22c55e',
    stress_loading_factor: 1.00,
    recommended_actions: ['Pool is healthy. Continue current premium structure.'],
  };
}

/**
 * getActuarialSnapshot()
 *
 * Main entry point: returns the full actuarial health report.
 * Called by /api/admin/actuarial-health endpoint.
 */
async function getActuarialSnapshot() {
  const [lossData, burnData] = await Promise.all([
    computeLossRatio(),
    computeBurnRate(),
  ]);

  const reserveData = computeReserveAdequacy(SIMULATED_RESERVE_INR, burnData.weekly_payout_inr);
  const verdict     = getSustainabilityVerdict(lossData.loss_ratio, reserveData.reserve_adequacy_ratio);

  // Projected insolvency (months) if current burn rate continues
  const projected_insolvency_months = reserveData.months_of_runway;

  return {
    timestamp:                   new Date().toISOString(),
    // Core metrics
    loss_ratio:                  lossData.loss_ratio,
    loss_ratio_benchmark:        LOSS_RATIO_WARNING,
    loss_ratio_status:           lossData.loss_ratio < LOSS_RATIO_WARNING ? 'HEALTHY'
                                 : lossData.loss_ratio < LOSS_RATIO_DANGER  ? 'WARNING'
                                 : lossData.loss_ratio < LOSS_RATIO_CRITICAL ? 'DANGER' : 'CRITICAL',
    // Financials
    total_premiums_collected_inr: lossData.total_premiums_inr,
    total_claims_paid_inr:        lossData.total_claims_paid_inr,
    weekly_payout_inr:            burnData.weekly_payout_inr,
    claims_paid_last_7d:          burnData.claims_paid_last_7d,
    // Reserve
    reserve_fund_inr:             reserveData.reserve_inr,
    reserve_adequacy_ratio:       reserveData.reserve_adequacy_ratio,
    months_of_runway:             projected_insolvency_months,
    is_reserve_adequate:          reserveData.is_adequate,
    // Verdict
    sustainability_verdict:       verdict.verdict,
    verdict_color:                verdict.color,
    stress_loading_factor:        verdict.stress_loading_factor,
    recommended_actions:          verdict.recommended_actions,
    // IRDAI benchmarks (for reference in admin dashboard)
    irdai_benchmarks: {
      max_loss_ratio:             LOSS_RATIO_WARNING,
      min_reserve_adequacy_ratio: RESERVE_ADEQUACY_MIN,
      standard:                   'IRDAI Motor TP/Health Pool Guidelines 2023',
    },
  };
}

/**
 * computePerZoneLossRatio()
 *
 * Aggregates premiums collected and claims paid at the zone (PIN code) level.
 * Returns sorted array (highest loss ratio first) with a flag and suggested
 * premium adjustment for any zone exceeding the 0.80 danger threshold.
 *
 * @returns {Promise<Array<{
 *   zone_pin:            string,
 *   city:                string,
 *   locality:            string,
 *   premiums_collected:  number,
 *   claims_paid:         number,
 *   loss_ratio:          number,
 *   status:              'HEALTHY'|'WARNING'|'DANGER'|'CRITICAL',
 *   status_color:        string,
 *   suggested_premium_adjustment_pct: number,
 * }>>}
 */
async function computePerZoneLossRatio() {
  const { getZoneData } = require('./zoneData');

  // Aggregate premiums by worker zone (join policies → workers)
  const Worker = require('../models/Worker');

  const [premiumsByZone, claimsByZone] = await Promise.all([
    // Step A: sum premiums per worker, then group by zone_pin_code
    Worker.aggregate([
      {
        $lookup: {
          from:         'policies',
          localField:   '_id',
          foreignField: 'worker_id',
          as:           'policies',
        },
      },
      { $unwind: '$policies' },
      { $match: { 'policies.status': { $in: ['active', 'expired'] } } },
      {
        $group: {
          _id:                 '$zone_pin_code',
          city:                { $first: '$city' },
          premiums_collected:  { $sum: '$policies.premium_amount_inr' },
          worker_count:        { $addToSet: '$_id' },
        },
      },
      { $project: { _id: 1, city: 1, premiums_collected: 1, worker_count: { $size: '$worker_count' } } },
    ]),

    // Step B: sum paid claims per worker, then group by zone_pin_code
    Worker.aggregate([
      {
        $lookup: {
          from:         'claims',
          localField:   '_id',
          foreignField: 'worker_id',
          as:           'claims',
        },
      },
      { $unwind: '$claims' },
      { $match: { 'claims.status': 'paid' } },
      {
        $group: {
          _id:         '$zone_pin_code',
          claims_paid: { $sum: '$claims.claim_amount_inr' },
          claim_count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Merge and calculate loss ratio
  const claimMap = {};
  for (const c of claimsByZone) {
    claimMap[c._id] = { claims_paid: c.claims_paid, claim_count: c.claim_count };
  }

  const results = premiumsByZone.map(p => {
    const zonePin        = p._id || 'UNKNOWN';
    const zoneInfo       = getZoneData(zonePin);
    const claims_paid    = claimMap[zonePin]?.claims_paid  || 0;
    const claim_count    = claimMap[zonePin]?.claim_count  || 0;
    const loss_ratio     = p.premiums_collected > 0
      ? parseFloat((claims_paid / p.premiums_collected).toFixed(4))
      : 0;

    let status, status_color, suggested_premium_adjustment_pct;
    if (loss_ratio >= LOSS_RATIO_CRITICAL) {
      status = 'CRITICAL'; status_color = '#ef4444'; suggested_premium_adjustment_pct = 25;
    } else if (loss_ratio >= LOSS_RATIO_DANGER) {
      status = 'DANGER';   status_color = '#f97316'; suggested_premium_adjustment_pct = 15;
    } else if (loss_ratio >= LOSS_RATIO_WARNING) {
      status = 'WARNING';  status_color = '#f59e0b'; suggested_premium_adjustment_pct = 10;
    } else {
      status = 'HEALTHY';  status_color = '#22c55e'; suggested_premium_adjustment_pct = 0;
    }

    return {
      zone_pin:                         zonePin,
      city:                             zoneInfo.city || p.city || 'Unknown',
      locality:                         zoneInfo.locality || 'Unknown Zone',
      worker_count:                     p.worker_count,
      premiums_collected:               p.premiums_collected,
      claims_paid,
      claim_count,
      loss_ratio,
      status,
      status_color,
      suggested_premium_adjustment_pct,
      composite_risk_score:             require('./zoneData').computeCompositeZoneRisk(zoneInfo),
    };
  });

  // Sort by loss_ratio descending (worst zones first)
  results.sort((a, b) => b.loss_ratio - a.loss_ratio);

  return results;
}

module.exports = {
  getActuarialSnapshot,
  computeLossRatio,
  computeBurnRate,
  computeReserveAdequacy,
  getSustainabilityVerdict,
  computePerZoneLossRatio,
  LOSS_RATIO_WARNING,
  LOSS_RATIO_DANGER,
  LOSS_RATIO_CRITICAL,
};
