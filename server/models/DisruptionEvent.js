const mongoose = require('mongoose');

const disruptionEventSchema = new mongoose.Schema({
  zone: { type: String },
  city: { type: String },
  type: { type: String, enum: ['rain', 'heatwave', 'flood', 'poor_aqi'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  start_time: { type: Date, default: Date.now },
  end_time: { type: Date },
  declared_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  weather_data: { type: mongoose.Schema.Types.Mixed },
  is_active: { type: Boolean, default: true },
  affected_workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
}, { timestamps: true });

module.exports = mongoose.model('DisruptionEvent', disruptionEventSchema);
