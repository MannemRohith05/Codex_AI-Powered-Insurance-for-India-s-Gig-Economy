const { fetchOpenWeatherMap, fetchAQI } = require('../services/weather');
const DisruptionEvent = require('../models/DisruptionEvent');

const CITY_COORDS = {
  'Hyderabad':  { lat: 17.385, lng: 78.4867 },
  'Bengaluru':  { lat: 12.9716, lng: 77.5946 },
  'Mumbai':     { lat: 19.0760, lng: 72.8777 },
  'Delhi':      { lat: 28.6139, lng: 77.2090 },
  'Chennai':    { lat: 13.0827, lng: 80.2707 },
  'Pune':       { lat: 18.5204, lng: 73.8567 },
};

// GET /api/weather/zone/:city
const getZoneWeather = async (req, res) => {
  try {
    const { city } = req.params;
    const coords = CITY_COORDS[city] || { lat: 17.385, lng: 78.4867 };
    const [weather, aqi] = await Promise.all([
      fetchOpenWeatherMap(coords.lat, coords.lng),
      fetchAQI(coords.lat, coords.lng),
    ]);
    const activeDisruptions = await DisruptionEvent.find({ city, is_active: true });
    res.json({ city, weather, aqi, activeDisruptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/weather/cities
const getCities = async (req, res) => {
  res.json({ cities: Object.keys(CITY_COORDS) });
};

module.exports = { getZoneWeather, getCities };
