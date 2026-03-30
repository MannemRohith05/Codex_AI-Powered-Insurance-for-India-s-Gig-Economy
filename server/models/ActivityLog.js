const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  log_date: { type: Date, default: Date.now },
  hours_active: { type: Number, default: 0 },
  deliveries: { type: Number, default: 0 },
  distance_km: { type: Number, default: 0 },
  accepted_orders: { type: Number, default: 0 },
  available_orders: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
}, { timestamps: true });

// Virtual: acceptance rate
activityLogSchema.virtual('acceptance_rate').get(function () {
  if (!this.available_orders) return 0;
  return Math.round((this.accepted_orders / this.available_orders) * 100);
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
