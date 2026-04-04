const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  worker_id:               { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },

  // Status — supports both old (active/expired/suspended) and new (ACTIVE/LAPSED/CANCELLED) values
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'ACTIVE', 'LAPSED', 'CANCELLED'],
    default: 'active',
  },

  // Premium & coverage
  premium_tier:            { type: String, enum: ['low', 'medium', 'high'], required: true },
  premium_amount:          { type: Number },  // in paise (Razorpay) — raw
  premium_amount_inr:      { type: Number },  // in rupees (human-readable)
  coverage_amount:         { type: Number },

  // Dates
  start_date:              { type: Date, default: Date.now },
  end_date:                { type: Date },
  waiting_period_end_date: { type: Date },    // start_date + 7 calendar days
  last_premium_paid_at:    { type: Date },

  // Auto-renewal
  auto_renew:              { type: Boolean, default: true },

  // Payment refs
  payment_id:              { type: String },
  razorpay_subscription_id:{ type: String },
}, { timestamps: true });

// Pre-save: set end_date (30 days) and waiting_period_end_date (7 days)
policySchema.pre('save', function (next) {
  if (this.start_date) {
    if (!this.end_date) {
      const d = new Date(this.start_date);
      d.setDate(d.getDate() + 30);
      this.end_date = d;
    }
    if (!this.waiting_period_end_date) {
      const w = new Date(this.start_date);
      w.setDate(w.getDate() + 7);
      this.waiting_period_end_date = w;
    }
  }
  // Sync premium_amount_inr from premium_amount (paise → rupees)
  if (this.premium_amount && !this.premium_amount_inr) {
    this.premium_amount_inr = Math.round(this.premium_amount / 100);
  }
  next();
});

// Virtual: next_renewal_date (= end_date for weekly model, or 7 days from now)
policySchema.virtual('next_renewal_date').get(function () {
  return this.end_date;
});

module.exports = mongoose.model('Policy', policySchema);
