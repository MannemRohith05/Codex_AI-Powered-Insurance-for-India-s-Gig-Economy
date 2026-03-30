const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, unique: true, required: true, trim: true },
  password_hash: { type: String, required: true },
  aadhaar_hash: { type: String, unique: true, sparse: true },
  platform: { type: String, enum: ['Swiggy', 'Zomato', 'Zepto', 'Dunzo', 'Other'], required: true },
  city: { type: String, trim: true },
  work_zone_geojson: { type: mongoose.Schema.Types.Mixed },
  avg_income: { type: Number, default: 0 },
  upi_id: { type: String, trim: true },
  device_id: { type: String },
  platform_worker_id: { type: String },
  phone_verified: { type: Boolean, default: false },
  aadhaar_verified: { type: Boolean, default: false },
  platform_verified: { type: Boolean, default: false },
  risk_score: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Worker', workerSchema);
