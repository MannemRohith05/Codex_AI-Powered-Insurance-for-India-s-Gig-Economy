const mongoose = require('mongoose');

const fraudLogSchema = new mongoose.Schema({
  claim_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim' },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  flags: { type: mongoose.Schema.Types.Mixed, default: {} },
  fraud_score: { type: Number, default: 0 },
  recommendation: { type: String, enum: ['APPROVE', 'REVIEW', 'REJECT'] },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewed_at: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('FraudLog', fraudLogSchema);
