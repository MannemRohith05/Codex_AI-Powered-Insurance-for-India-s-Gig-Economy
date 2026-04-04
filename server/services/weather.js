const axios = require('axios');
const DisruptionEvent = require('../models/DisruptionEvent');
const WeatherEvent = require('../models/WeatherEvent');

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

// ── Raw API fetchers ──────────────────────────────────────────────────────────

const fetchOpenWeatherMap = async (lat, lng) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    // Return mock data in dev — reflects real monsoon conditions
    return {
      weather:  [{ main: 'Rain', description: 'heavy intensity rain' }],
      main:     { temp: 35, humidity: 90 },
      rain:     { '1h': 18, '3h': 55 },   // 55mm in 3h = well above 50mm/day trigger
      wind:     { speed: 12 },
      coord:    { lat, lon: lng },
      name:     'MockCity',
    };
  }
  const url = `${OWM_BASE}/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const res = await axios.get(url);
  return res.data;
};

const fetchAQI = async (lat, lng) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    // AQI 2 = Fair in OWM scale (maps to ~100 CPCB AQI — not trigger level)
    return { list: [{ main: { aqi: 2 }, components: { pm2_5: 50 } }] };
  }
  const url = `${OWM_BASE}/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`;
  const res = await axios.get(url);
  return res.data;
};

// ── OWM AQI scale → approximate CPCB AQI (for trigger comparison) ─────────────
// OWM: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
// CPCB threshold for trigger: AQI > 300 (Hazardous category)
function owmAqiToCpcb(owmAqi) {
  const map = { 1: 50, 2: 100, 3: 200, 4: 300, 5: 400 };
  return map[owmAqi] ?? 50;
}

// ── Parametric Trigger Evaluation (README spec thresholds) ───────────────────
/**
 * evaluateParametricTriggers(weatherData, aqiData)
 *
 * Evaluates raw API weather data against README-spec thresholds:
 *   - Rainfall > 50mm/day
 *   - Temperature > 40°C
 *   - AQI > 300 (CPCB Hazardous scale)
 *   - Flood / Cyclone alert active (from alert flags)
 *
 * @param {Object} weatherData  - OWM /weather response
 * @param {Object|null} aqiData - OWM /air_pollution response
 * @returns {{ triggered: boolean, reasons: string[], metrics: Object }}
 */
function evaluateParametricTriggers(weatherData, aqiData = null) {
  const reasons = [];
  const { main, rain, weather: conditions } = weatherData || {};

  const temp         = main?.temp ?? 0;
  // OWM gives rainfall in mm/1h and mm/3h. Extrapolate to 24h using 3h value × 8, or 1h × 24
  const rainfall1h   = rain?.['1h'] || 0;
  const rainfall3h   = rain?.['3h'] || 0;
  const rainfall24h  = Math.max(rainfall3h * 8, rainfall1h * 24); // conservative 24h estimate
  const conditionMain = conditions?.[0]?.main || '';

  const owmAqi  = aqiData?.list?.[0]?.main?.aqi ?? 1;
  const cpcbAqi = owmAqiToCpcb(owmAqi);

  // Trigger 1: Heavy rainfall > 50mm/day (README threshold)
  if (rainfall24h > 50 || conditionMain === 'Thunderstorm') {
    reasons.push('HEAVY_RAIN');
  }

  // Trigger 2: Extreme heat > 40°C (README threshold — changed from old 42°C)
  if (temp > 40) {
    reasons.push('EXTREME_HEAT');
  }

  // Trigger 3: Hazardous AQI > 300 (CPCB scale, README threshold)
  if (cpcbAqi > 300) {
    reasons.push('HAZARDOUS_AQI');
  }

  // Trigger 4: Flood conditions (rainfall > 100mm/day)
  if (rainfall24h > 100) {
    reasons.push('FLOOD_RISK');
  }

  // Trigger 5: Cyclone (wind speed > 90 km/h = ~25 m/s)
  const windSpeedKmh = (weatherData?.wind?.speed ?? 0) * 3.6;
  if (windSpeedKmh > 90) {
    reasons.push('CYCLONE_ALERT');
  }

  return {
    triggered:       reasons.length > 0,
    reasons,
    metrics: {
      rainfall_mm_24h:  parseFloat(rainfall24h.toFixed(2)),
      temperature_c:    temp,
      aqi_cpcb:         cpcbAqi,
      wind_speed_kmh:   parseFloat(windSpeedKmh.toFixed(1)),
    },
  };
}

// ── Zone weather cache lookup ─────────────────────────────────────────────────
/**
 * getCachedWeatherForZone(zone_pin_code, city)
 *
 * Returns the most recent WeatherEvent for the given zone within the last 6 hours.
 * Used by claimController to validate parametric trigger without re-fetching.
 *
 * @returns {Object|null} WeatherEvent document or null if no recent record
 */
async function getCachedWeatherForZone(zone_pin_code, city) {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const query = { recorded_at: { $gte: sixHoursAgo } };

  if (zone_pin_code) query.zone_pin_code = zone_pin_code;
  else if (city)     query.city = city;
  else               return null;

  return WeatherEvent.findOne(query).sort({ recorded_at: -1 });
}

// ── DisruptionEvent + WeatherEvent combined trigger (used by cron / admin) ───
/**
 * checkDisruptionTriggers(weatherData, aqiData, zone, adminId)
 *
 * Evaluates triggers and writes:
 *   - WeatherEvent (new explicit numeric schema)
 *   - DisruptionEvent (legacy — kept for admin dashboard compat)
 */
const checkDisruptionTriggers = async (weatherData, aqiData, zone, adminId = null) => {
  const { triggered, reasons, metrics } = evaluateParametricTriggers(weatherData, aqiData);

  // ── Save to WeatherEvent (new model) ──────────────────────────────────────
  try {
    await WeatherEvent.create({
      zone_pin_code:           zone.pin_code || zone.zone,
      city:                    zone.city,
      rainfall_mm_24h:         metrics.rainfall_mm_24h,
      temperature_c:           metrics.temperature_c,
      aqi:                     metrics.aqi_cpcb,
      wind_speed_kmh:          metrics.wind_speed_kmh,
      flood_alert_active:      reasons.includes('FLOOD_RISK'),
      cyclone_alert_active:    reasons.includes('CYCLONE_ALERT'),
      parametric_trigger_met:  triggered,
      triggered_conditions:    reasons,
      raw_api_data:            weatherData,
      data_source:             'OpenWeatherMap',
      recorded_at:             new Date(),
    });
  } catch (e) {
    console.error('[Weather] WeatherEvent save failed:', e.message);
  }

  // ── Save to DisruptionEvent (legacy — keeps admin dashboard working) ──────
  const legacyTypeMap = {
    'HEAVY_RAIN':    'rain',
    'EXTREME_HEAT':  'heatwave',
    'FLOOD_RISK':    'flood',
    'HAZARDOUS_AQI': 'poor_aqi',
    'CYCLONE_ALERT': 'rain', // best fit in legacy enum
  };

  for (const reason of reasons) {
    const legacyType = legacyTypeMap[reason] || 'rain';
    const existing = await DisruptionEvent.findOne({
      city:       zone.city,
      type:       legacyType,
      is_active:  true,
      start_time: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (!existing) {
      await DisruptionEvent.create({
        city:         zone.city,
        zone:         zone.zone || zone.pin_code,
        type:         legacyType,
        severity:     metrics.rainfall_mm_24h > 100 || metrics.aqi_cpcb > 350 ? 'high' : 'medium',
        weather_data: weatherData,
        declared_by:  adminId,
        is_active:    true,
      });
      console.log(`[Weather] DisruptionEvent created: ${legacyType} in ${zone.city}`);
    }
  }

  return reasons.map(r => ({ type: legacyTypeMap[r] || 'rain', reason: r }));
};

module.exports = {
  fetchOpenWeatherMap,
  fetchAQI,
  evaluateParametricTriggers,
  getCachedWeatherForZone,
  checkDisruptionTriggers,
};
