const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  worker_id:                   { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  policy_id:                   { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  weather_event_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'WeatherEvent' }, // linked parametric trigger

  // Disruption info
  disruption_type:             { type: String, enum: ['rain', 'heatwave', 'flood', 'poor_aqi', 'cyclone'], required: true },
  declared_income_loss_inr:    { type: Number },  // what the worker claims they lost (INR)

  // Amounts
  amount_claimed:              { type: Number },  // kept for backward compat
  claim_amount_inr:            { type: Number },  // approved payout amount (INR) — README field name
  amount_paid:                 { type: Number },

  // Location
  gps_at_claim:                { type: mongoose.Schema.Types.Mixed }, // { lat, lng, accuracy }

  // Evidence
  photo_evidence_url:          { type: String },  // URL to uploaded evidence image

  // Weather snapshot at claim time
  weather_snapshot:            { type: mongoose.Schema.Types.Mixed },

  // AI scores
  fraud_score:                 { type: Number, default: 0, min: 0, max: 1 },   // 0.0–1.0 (LightGBM)
  anomaly_score:               { type: Number, default: 0 },                   // Isolation Forest score
  fraud_flags:                 { type: mongoose.Schema.Types.Mixed, default: {} },

  // Reason codes for flagged/rejected claims
  reason_codes:                [{ type: String }],  // e.g. ['GPS_ZONE_MISMATCH', 'HIGH_CLAIM_FREQUENCY']

  // Status
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'paid'],
    default: 'submitted',
  },
  ai_status: {
    type: String,
    enum: ['AUTO_APPROVED', 'FLAGGED', 'REJECTED', 'MANUAL_REVIEW', 'PENDING',
           // Legacy values kept for backward compat
           'Auto-Approved', 'Flagged', 'Pending'],
    default: 'PENDING',
  },

  rejection_reason:            { type: String },
  settlement_date:             { type: Date },     // when the payout was/will be made

  // Payment refs
  razorpay_payout_id:          { type: String },
  notes:                       { type: String },

}, { timestamps: true });

// Index for monthly cap queries
claimSchema.index({ worker_id: 1, createdAt: -1 });

module.exports = mongoose.model('Claim', claimSchema);
