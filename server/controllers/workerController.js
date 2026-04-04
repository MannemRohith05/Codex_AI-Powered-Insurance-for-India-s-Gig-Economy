const bcrypt = require('bcryptjs');
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const ActivityLog = require('../models/ActivityLog');
const DisruptionEvent = require('../models/DisruptionEvent');
const { generateToken } = require('../utils/jwt');
const { sendOTP, verifyOTP } = require('../services/twilio');
const { initiateAadhaarOTP, verifyAadhaarOTP, hashAadhaar } = require('../services/sandbox');
const { computeRiskScore } = require('../services/aiEngine');

// POST /api/worker/register
const register = async (req, res) => {
  try {
    const { name, phone, password, platform, occupation_type, city, zone_pin_code, upi_id, device_id, declared_weekly_income_inr } = req.body;

    if (!name || !phone || !password || !platform) {
      return res.status(400).json({ error: 'Name, phone, password, and platform are required' });
    }
    const existing = await Worker.findOne({ phone });
    if (existing) return res.status(409).json({ error: 'Phone number already registered' });

    const password_hash = await bcrypt.hash(password, 12);

    // Run initial risk score on registration
    const workerData = { platform, occupation_type, city, zone_pin_code, declared_weekly_income_inr: declared_weekly_income_inr || 0 };
    const riskResult = computeRiskScore(workerData);

    const worker = await Worker.create({
      name,
      phone,
      password_hash,
      platform,
      occupation_type: occupation_type || 'delivery_rider',
      city,
      zone_pin_code,
      upi_id,
      device_id,
      declared_weekly_income_inr: declared_weekly_income_inr || 0,
      avg_income:                 declared_weekly_income_inr ? Math.round(declared_weekly_income_inr / 7) : 0,
      risk_score:                 riskResult.risk_score,
      risk_tier:                  riskResult.risk_tier,
      risk_last_computed_at:      new Date(),
    });

    await sendOTP(phone);
    res.status(201).json({
      message:    'Registered. OTP sent to your phone.',
      worker_id:  worker._id,
      risk_tier:  riskResult.risk_tier,
      premium_recommendation_inr: riskResult.premium_recommendation_inr,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/worker/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const worker = await Worker.findOne({ phone });
    if (!worker) return res.status(404).json({ error: 'No account found for this phone number' });
    const match = await bcrypt.compare(password, worker.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid password' });
    const token = generateToken({ id: worker._id, role: 'worker', phone: worker.phone });
    res.json({
      token,
      worker: {
        _id:              worker._id,
        name:             worker.name,
        phone:            worker.phone,
        platform:         worker.platform,
        city:             worker.city,
        zone_pin_code:    worker.zone_pin_code,
        phone_verified:   worker.phone_verified,
        aadhaar_verified: worker.aadhaar_verified,
        risk_tier:        worker.risk_tier,
        risk_score:       worker.risk_score,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/worker/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const result = verifyOTP(phone, otp);
    if (!result.valid) return res.status(400).json({ error: result.reason });
    await Worker.findOneAndUpdate({ phone }, { phone_verified: true });
    res.json({ message: 'Phone verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/worker/resend-otp
const resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    await sendOTP(phone);
    res.json({ message: 'OTP resent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/worker/dashboard
const getDashboard = async (req, res) => {
  try {
    const workerId = req.user.id;
    const worker = await Worker.findById(workerId).select('-password_hash');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const [activePolicy, recentClaims, recentLogs, activeDisruptions] = await Promise.all([
      Policy.findOne({ worker_id: workerId, status: 'active' }),
      Claim.find({ worker_id: workerId }).sort({ createdAt: -1 }).limit(5),
      ActivityLog.find({ worker_id: workerId }).sort({ log_date: -1 }).limit(7),
      DisruptionEvent.find({ city: worker.city, is_active: true }).limit(3),
    ]);

    // Approved claims this month (for cap display)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const claimsThisMonth = await Claim.countDocuments({
      worker_id: workerId,
      status:    { $in: ['approved', 'paid'] },
      createdAt: { $gte: startOfMonth },
    });

    const weekEarnings = recentLogs.reduce((s, l) => s + (l.earnings || 0), 0);

    res.json({
      worker,
      activePolicy,
      recentClaims,
      recentLogs,
      activeDisruptions,
      weekEarnings,
      claimsThisMonth,
      maxClaimsPerMonth: 2,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/worker/kyc/initiate
const initiateKYC = async (req, res) => {
  try {
    const { aadhaar_number } = req.body;
    if (!aadhaar_number || aadhaar_number.length !== 12) {
      return res.status(400).json({ error: 'Valid 12-digit Aadhaar number required' });
    }
    const aadhaarHash = hashAadhaar(aadhaar_number);
    const duplicate = await Worker.findOne({ aadhaar_hash: aadhaarHash });
    if (duplicate) return res.status(409).json({ error: 'Aadhaar already registered with another account' });
    const result = await initiateAadhaarOTP(aadhaar_number);
    res.json({ message: 'OTP sent to Aadhaar-linked mobile', ref_id: result.ref_id || result.data?.reference_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/worker/kyc/verify
const verifyKYC = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { ref_id, otp, aadhaar_number } = req.body;
    const result = await verifyAadhaarOTP(ref_id, otp);
    if (!result.success) return res.status(400).json({ error: 'Aadhaar verification failed' });
    const aadhaarHash = hashAadhaar(aadhaar_number);
    await Worker.findByIdAndUpdate(workerId, { aadhaar_hash: aadhaarHash, aadhaar_verified: true });
    res.json({ message: 'Aadhaar KYC verified successfully', kyc_data: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/worker/profile
const updateProfile = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { city, zone_pin_code, upi_id, avg_income, declared_weekly_income_inr, work_zone_geojson } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Re-compute risk score if income or location changed
    const changed = city !== worker.city || zone_pin_code !== worker.zone_pin_code || declared_weekly_income_inr;
    let riskUpdate = {};
    if (changed) {
      const updatedWorkerData = {
        ...worker.toObject(),
        city:                       city || worker.city,
        zone_pin_code:              zone_pin_code || worker.zone_pin_code,
        declared_weekly_income_inr: declared_weekly_income_inr || worker.declared_weekly_income_inr,
      };
      const riskResult = computeRiskScore(updatedWorkerData);
      riskUpdate = {
        risk_score:            riskResult.risk_score,
        risk_tier:             riskResult.risk_tier,
        risk_last_computed_at: new Date(),
      };
    }

    const updated = await Worker.findByIdAndUpdate(
      workerId,
      {
        city,
        zone_pin_code,
        upi_id,
        avg_income:                 avg_income || undefined,
        declared_weekly_income_inr: declared_weekly_income_inr || undefined,
        work_zone_geojson,
        ...riskUpdate,
      },
      { new: true, select: '-password_hash' }
    );
    res.json({ worker: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/worker/activity
const getActivity = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { page = 1, limit = 30 } = req.query;
    const logs = await ActivityLog.find({ worker_id: workerId })
      .sort({ log_date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/worker/risk-score  — README spec: GET /api/risk-score/:userId
const getRiskScore = async (req, res) => {
  try {
    const workerId = req.user.id;
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Run full mock XGBoost scorer
    const result = computeRiskScore(worker);

    // Persist updated score to DB
    await Worker.findByIdAndUpdate(workerId, {
      risk_score:            result.risk_score,
      risk_tier:             result.risk_tier,
      risk_last_computed_at: new Date(),
    });

    res.json({
      user_id:                    workerId,
      risk_score:                 result.risk_score,
      risk_tier:                  result.risk_tier,
      premium_recommendation_inr: result.premium_recommendation_inr,
      contributing_factors:       result.contributing_factors,
      ai_confidence:              result.ai_confidence,
      model:                      result.model,
      last_computed_at:           result.last_computed_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register, login, verifyOtp, resendOtp, getDashboard,
  initiateKYC, verifyKYC, updateProfile, getActivity, getRiskScore,
};
