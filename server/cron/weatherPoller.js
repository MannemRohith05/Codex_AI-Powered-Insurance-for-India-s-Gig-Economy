const cron = require('node-cron');
const Worker = require('../models/Worker');
const { fetchOpenWeatherMap, fetchAQI, checkDisruptionTriggers } = require('../services/weather');

const startWeatherPoller = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[WeatherCron] ⛅ Checking active work zones...');
    try {
      // Get all unique cities of active workers
      const workers = await Worker.find({ is_active: true, city: { $exists: true, $ne: '' } })
        .select('city work_zone_geojson');

      // Aggregate unique cities
      const cityMap = {};
      for (const worker of workers) {
        if (!cityMap[worker.city]) {
          cityMap[worker.city] = {
            city: worker.city,
            zone: worker.city,
            workers: [],
          };
        }
        cityMap[worker.city].workers.push(worker._id);
      }

      // Get representative coords per city
      const CITY_COORDS = {
        'Hyderabad':  { lat: 17.385, lng: 78.4867 },
        'Bengaluru':  { lat: 12.9716, lng: 77.5946 },
        'Mumbai':     { lat: 19.0760, lng: 72.8777 },
        'Delhi':      { lat: 28.6139, lng: 77.2090 },
        'Chennai':    { lat: 13.0827, lng: 80.2707 },
        'Pune':       { lat: 18.5204, lng: 73.8567 },
        'Kolkata':    { lat: 22.5726, lng: 88.3639 },
        'Ahmedabad':  { lat: 23.0225, lng: 72.5714 },
        'Jaipur':     { lat: 26.9124, lng: 75.7873 },
        'Surat':      { lat: 21.1702, lng: 72.8311 },
      };

      for (const cityName of Object.keys(cityMap)) {
        const coords = CITY_COORDS[cityName] || { lat: 17.385, lng: 78.4867 };
        try {
          const [weatherData, aqiData] = await Promise.all([
            fetchOpenWeatherMap(coords.lat, coords.lng),
            fetchAQI(coords.lat, coords.lng),
          ]);
          await checkDisruptionTriggers(weatherData, aqiData, cityMap[cityName]);
        } catch (err) {
          console.error(`[WeatherCron] Failed for ${cityName}:`, err.message);
        }
      }
      console.log(`[WeatherCron] ✅ Checked ${Object.keys(cityMap).length} cities`);
    } catch (err) {
      console.error('[WeatherCron] Fatal error:', err.message);
    }
  });

  console.log('⏰ Weather poller scheduled (every 15 minutes)');
};

module.exports = { startWeatherPoller };
