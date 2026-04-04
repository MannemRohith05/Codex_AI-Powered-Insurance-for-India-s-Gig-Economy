const mongoose = require('mongoose');

/**
 * WeatherEvent — stores zone-level weather readings from the poller.
 * Numeric fields are first-class (not buried in Mixed), matching the README data schema.
 * Replaces the vague DisruptionEvent.weather_data blob for new data.
 */
const weatherEventSchema = new mongoose.Schema({
  // Zone identification
  zone_pin_code:           { type: String },                         // e.g. "500001"
  city:                    { type: String },

  // Explicit numeric weather metrics (README spec)
  rainfall_mm_24h:         { type: Number, default: 0 },            // mm in last 24h
  temperature_c:           { type: Number },                         // max daily temp in °C
  aqi:                     { type: Number },                         // CPCB AQI scale (0–500+)
  humidity_pct:            { type: Number },                         // %
  wind_speed_kmh:          { type: Number },

  // Alert flags
  flood_alert_active:      { type: Boolean, default: false },
  cyclone_alert_active:    { type: Boolean, default: false },

  // Computed summary — true if ANY parametric trigger threshold is met
  parametric_trigger_met:  { type: Boolean, default: false },

  // Which triggers fired
  triggered_conditions:    [{ type: String }],  // e.g. ['HEAVY_RAIN', 'HIGH_TEMP']

  // Raw API response (kept for debugging)
  raw_api_data:            { type: mongoose.Schema.Types.Mixed },
  data_source:             { type: String, default: 'OpenWeatherMap' }, // e.g. 'OpenWeatherMap', 'OpenMeteo'

  recorded_at:             { type: Date, default: Date.now },
}, { timestamps: true });

// Index for zone + time lookups (used in parametric trigger pipeline)
weatherEventSchema.index({ zone_pin_code: 1, recorded_at: -1 });
weatherEventSchema.index({ city: 1, recorded_at: -1 });

module.exports = mongoose.model('WeatherEvent', weatherEventSchema);
