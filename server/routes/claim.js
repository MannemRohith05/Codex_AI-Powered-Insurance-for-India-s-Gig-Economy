const express = require('express');
const router = express.Router();
const { requireWorker } = require('../middleware/auth');
const fraudEngine = require('../middleware/fraud');
const { submitClaim, getClaimHistory, myClaims } = require('../controllers/claimController');

router.post('/submit', requireWorker, fraudEngine, submitClaim);
router.get('/my', requireWorker, myClaims);
router.get('/history/:id', getClaimHistory); // can be called by admin too

module.exports = router;
