const express = require('express');
const router = express.Router();
const { requireWorker } = require('../middleware/auth');
const fraudEngine = require('../middleware/fraud');
const { submitClaim, getClaimHistory, myClaims } = require('../controllers/claimController');

// POST /api/claim/submit  (original path — kept for frontend compat)
router.post('/submit', requireWorker, fraudEngine, submitClaim);

// POST /api/claim/        (README spec: POST /claims)
router.post('/', requireWorker, fraudEngine, submitClaim);

// GET /api/claim/my
router.get('/my', requireWorker, myClaims);

// GET /api/claim/history/:id (admin + worker history)
router.get('/history/:id', getClaimHistory);

module.exports = router;
