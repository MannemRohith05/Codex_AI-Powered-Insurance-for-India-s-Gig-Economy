const bcrypt = require('bcryptjs');
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const ActivityLog = require('../models/ActivityLog');
const DisruptionEvent = require('../models/DisruptionEvent');
const { generateToken } = require('../utils/jwt');
const { sendOTP, verifyOTP } = require('../services/twilio');
const { initiateAadhaarOTP, verifyAadhaarOTP, hashAadhaar } = require('../services/sandbox');

// POST /api/worker/register
const register = async (req, res) => {
  try {
    const { name, phone, password, platform, city, upi_id, device_id } = req.body;
    if (!name || !phone || !password || !platform) {
      return res.status(400).json({ error: 'Name, phone, password, and platform are required' });
    }
    const existing = await Worker.findOne({ phone });
    if (existing) return res.status(409).json({ error: 'Phone number already registered' });

    // Duplicate device check
    if (device_id) {
      const dup = await Worker.findOne({ device_id });
      if (dup) return res.status(409).json({ error: 'Device already registered to another account' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const worker = await Worker.create({ name, phone, password_hash, platform, city, upi_id, device_id });
    await sendOTP(phone);
    res.status(201).json({ message: 'Registered. OTP sent to your phone.', worker_id: worker._id });
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
    res.json({ token, worker: { _id: worker._id, name: worker.name, phone: worker.phone, platform: worker.platform, city: worker.city, phone_verified: worker.phone_verified, aadhaar_verified: worker.aadhaar_verified } });
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

    // Compute last 7 days earnings
    const weekEarnings = recentLogs.reduce((s, l) => s + (l.earnings || 0), 0);

    res.json({
      worker,
      activePolicy,
      recentClaims,
      recentLogs,
      activeDisruptions,
      weekEarnings,
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
    const { city, upi_id, avg_income, work_zone_geojson } = req.body;
    const updated = await Worker.findByIdAndUpdate(workerId, { city, upi_id, avg_income, work_zone_geojson }, { new: true, select: '-password_hash' });
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

module.exports = { register, login, verifyOtp, resendOtp, getDashboard, initiateKYC, verifyKYC, updateProfile, getActivity };
