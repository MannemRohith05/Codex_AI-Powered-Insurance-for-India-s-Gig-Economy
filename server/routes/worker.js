const express = require('express');
const router = express.Router();
const { requireWorker } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  register, login, verifyOtp, resendOtp, getDashboard,
  initiateKYC, verifyKYC, updateProfile, getActivity, getRiskScore
} = require('../controllers/workerController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.get('/dashboard', requireWorker, getDashboard);
router.post('/kyc/initiate', requireWorker, initiateKYC);
router.post('/kyc/verify', requireWorker, verifyKYC);
router.put('/profile', requireWorker, updateProfile);
router.get('/activity', requireWorker, getActivity);
router.get('/risk-score', requireWorker, getRiskScore);

module.exports = router;
