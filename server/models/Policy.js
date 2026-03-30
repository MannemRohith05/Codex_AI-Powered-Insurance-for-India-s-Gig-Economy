const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  status: { type: String, enum: ['active', 'expired', 'suspended'], default: 'active' },
  premium_tier: { type: String, enum: ['low', 'medium', 'high'], required: true },
  premium_amount: { type: Number },
  coverage_amount: { type: Number },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date },
  payment_id: { type: String },
  razorpay_subscription_id: { type: String },
}, { timestamps: true });

// Auto-set end_date to 30 days after start
policySchema.pre('save', function (next) {
  if (!this.end_date && this.start_date) {
    const d = new Date(this.start_date);
    d.setDate(d.getDate() + 30);
    this.end_date = d;
  }
  next();
});

module.exports = mongoose.model('Policy', policySchema);
