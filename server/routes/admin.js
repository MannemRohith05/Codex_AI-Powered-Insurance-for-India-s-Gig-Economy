const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  login, getDashboard, getClaims, approveClaim, rejectClaim,
  getFraudPanel, getWorkers, createDisruption, getDisruptions, getClaimsHeatmap
} = require('../controllers/adminController');

router.post('/login', authLimiter, login);
router.get('/dashboard', requireAdmin, getDashboard);
router.get('/claims', requireAdmin, getClaims);
router.put('/claim/:id/approve', requireAdmin, approveClaim);
router.put('/claim/:id/reject', requireAdmin, rejectClaim);
router.get('/fraud-panel', requireAdmin, getFraudPanel);
router.get('/workers', requireAdmin, getWorkers);
router.post('/disruption', requireAdmin, createDisruption);
router.get('/disruptions', requireAdmin, getDisruptions);
router.get('/claims/heatmap', requireAdmin, getClaimsHeatmap);

module.exports = router;
