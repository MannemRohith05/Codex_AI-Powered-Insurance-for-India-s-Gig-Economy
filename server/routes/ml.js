'use strict';

const express = require('express');
const router  = express.Router();
const { mlPredict, mlMetadata } = require('../controllers/adminController');

/**
 * POST /api/ml/predict
 * Accepts the exact feature vector a trained scikit-learn model would use.
 * Currently backed by the aiEngine.js simulation.
 * Replace with a Python microservice call when a real .pkl model is available.
 *
 * Body: { rainfall_mm, distance_km, claimed_loss_amount, historical_fraud_score, day_of_week }
 *
 * No auth — accessible to judges/evaluators.
 */
router.post('/predict', mlPredict);

/**
 * GET /api/ml/metadata
 * Returns MODEL_METADATA from aiEngine.js — training dataset info,
 * feature importance, performance metrics (precision/recall/AUC).
 */
router.get('/metadata', mlMetadata);

module.exports = router;
