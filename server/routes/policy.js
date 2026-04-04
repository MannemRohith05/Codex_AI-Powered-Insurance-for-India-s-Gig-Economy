const express = require('express');
const router = express.Router();
const { requireWorker } = require('../middleware/auth');
const { createOrder, buyPolicy, getMyPolicy, getPolicyStatus } = require('../controllers/policyController');

router.post('/order',  requireWorker, createOrder);
router.post('/buy',    requireWorker, buyPolicy);
router.get('/my',      requireWorker, getMyPolicy);
router.get('/status',  requireWorker, getPolicyStatus); // README: GET /api/policy/status

module.exports = router;
