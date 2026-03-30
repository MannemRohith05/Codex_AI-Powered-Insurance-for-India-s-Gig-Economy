const express = require('express');
const router = express.Router();
const { requireWorker } = require('../middleware/auth');
const { createOrder, buyPolicy, getMyPolicy } = require('../controllers/policyController');

router.post('/order', requireWorker, createOrder);
router.post('/buy', requireWorker, buyPolicy);
router.get('/my', requireWorker, getMyPolicy);

module.exports = router;
