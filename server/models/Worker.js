const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name:                       { type: String, required: true, trim: true },
  phone:                      { type: String, unique: true, required: true, trim: true },
  password_hash:              { type: String, required: true },
  aadhaar_hash:               { type: String, unique: true, sparse: true },

  // Platform & location
  platform:                   { type: String, enum: ['Swiggy', 'Zomato', 'Zepto', 'Dunzo', 'Porter', 'Amazon', 'Other'], required: true },
  occupation_type:            { type: String, enum: ['delivery_rider', 'construction_worker', 'street_vendor', 'domestic_worker', 'factory_worker', 'auto_driver', 'other'], default: 'delivery_rider' },
  city:                       { type: String, trim: true },
  zone_pin_code:              { type: String, trim: true },          // e.g. "500001"
  work_zone_geojson:          { type: mongoose.Schema.Types.Mixed }, // { lat, lng } for simple or GeoJSON polygon

  // Income (declared at enrollment)
  declared_weekly_income_inr: { type: Number, default: 0 },
  avg_income:                 { type: Number, default: 0 },          // kept for backward compat

  // Payment
  upi_id:                     { type: String, trim: true },

  // Device & identity
  device_id:                  { type: String },
  platform_worker_id:         { type: String },

  // Verification flags
  phone_verified:             { type: Boolean, default: false },
  aadhaar_verified:           { type: Boolean, default: false },
  platform_verified:          { type: Boolean, default: false },

  // AI risk profile — uppercase to match README spec
  risk_score:                 { type: Number, default: 0, min: 0, max: 100 },
  risk_tier:                  { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  risk_last_computed_at:      { type: Date },

  is_active:                  { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: enrollment_date alias for createdAt (README spec)
workerSchema.virtual('enrollment_date').get(function () {
  return this.createdAt;
});

module.exports = mongoose.model('Worker', workerSchema);
