'use strict';

const express = require('express');
const router  = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { triggerDemo, getDemoStatus } = require('../controllers/demoController');

/**
 * POST /api/demo/trigger
 * Runs the full 6-step demo pipeline via Server-Sent Events (SSE).
 * Requires admin auth so judges must log in once.
 */
router.post('/trigger', requireAdmin, triggerDemo);

/**
 * GET /api/demo/status
 * Returns the most recent demo run result.
 * No auth — judges can poll this without a token.
 */
router.get('/status', getDemoStatus);

module.exports = router;
