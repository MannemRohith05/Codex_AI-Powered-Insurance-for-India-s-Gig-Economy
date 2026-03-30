const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  policy_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  disruption_type: { type: String, enum: ['rain', 'heatwave', 'flood', 'poor_aqi'], required: true },
  amount_claimed: { type: Number },
  amount_paid: { type: Number },
  gps_at_claim: { type: mongoose.Schema.Types.Mixed }, // { lat, lng }
  weather_snapshot: { type: mongoose.Schema.Types.Mixed },
  fraud_score: { type: Number, default: 0 },
  fraud_flags: { type: mongoose.Schema.Types.Mixed, default: [] },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'paid'],
    default: 'submitted'
  },
  rejection_reason: { type: String },
  razorpay_payout_id: { type: String },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);
