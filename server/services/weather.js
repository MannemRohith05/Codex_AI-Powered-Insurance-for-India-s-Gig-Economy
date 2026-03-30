const axios = require('axios');
const DisruptionEvent = require('../models/DisruptionEvent');

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

const fetchOpenWeatherMap = async (lat, lng) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    // Return mock data in dev
    return {
      weather: [{ main: 'Rain', description: 'heavy intensity rain' }],
      main: { temp: 35, humidity: 90 },
      rain: { '1h': 35 },
      wind: { speed: 12 },
      coord: { lat, lon: lng },
      name: 'MockCity',
    };
  }
  const url = `${OWM_BASE}/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const res = await axios.get(url);
  return res.data;
};

const fetchAQI = async (lat, lng) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    return { list: [{ main: { aqi: 2 }, components: { pm2_5: 50 } }] };
  }
  const url = `${OWM_BASE}/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`;
  const res = await axios.get(url);
  return res.data;
};

/**
 * Evaluate weather data and trigger disruption events
 */
const checkDisruptionTriggers = async (weatherData, aqiData, zone, adminId = null) => {
  const triggers = [];
  const { main, rain, weather: conditions } = weatherData;
  const temp = main?.temp;
  const rainfall = rain?.['1h'] || 0;
  const aqi = aqiData?.list?.[0]?.main?.aqi || 1;
  const conditionMain = conditions?.[0]?.main || '';

  // Rain trigger: rainfall > 30mm/hr
  if (rainfall > 30 || conditionMain === 'Thunderstorm') {
    triggers.push({ type: 'rain', severity: rainfall > 60 ? 'high' : 'medium' });
  }

  // Heatwave trigger: temperature > 42°C
  if (temp > 42) {
    triggers.push({ type: 'heatwave', severity: temp > 46 ? 'high' : 'medium' });
  }

  // Flood trigger: extreme rain
  if (rainfall > 100) {
    triggers.push({ type: 'flood', severity: 'high' });
  }

  // Poor AQI trigger: AQI level >= 4 (Very Poor / Hazardous)
  // OWM AQI: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=VeryPoor
  if (aqi >= 4) {
    triggers.push({ type: 'poor_aqi', severity: aqi === 5 ? 'high' : 'medium' });
  }

  for (const trigger of triggers) {
    const existing = await DisruptionEvent.findOne({
      city: zone.city,
      type: trigger.type,
      is_active: true,
      start_time: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // within last hour
    });
    if (!existing) {
      await DisruptionEvent.create({
        city: zone.city,
        zone: zone.zone,
        type: trigger.type,
        severity: trigger.severity,
        weather_data: weatherData,
        declared_by: adminId,
        is_active: true,
      });
      console.log(`[Weather] Disruption event created: ${trigger.type} in ${zone.city}`);
    }
  }

  return triggers;
};

module.exports = { fetchOpenWeatherMap, fetchAQI, checkDisruptionTriggers };
