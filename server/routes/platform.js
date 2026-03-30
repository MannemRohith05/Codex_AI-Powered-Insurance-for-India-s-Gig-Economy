const express = require('express');
const router = express.Router();
const { requirePlatform } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, getWorkers, getClaimsFeed, getStats } = require('../controllers/platformController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/workers', requirePlatform, getWorkers);
router.get('/claims-feed', requirePlatform, getClaimsFeed);
router.get('/stats', requirePlatform, getStats);

module.exports = router;
