const express = require('express');
const router = express.Router();
const { getZoneWeather, getCities } = require('../controllers/weatherController');

router.get('/cities', getCities);
router.get('/zone/:city', getZoneWeather);

module.exports = router;
