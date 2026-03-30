const bcrypt = require('bcryptjs');
const PlatformPartner = require('../models/PlatformPartner');
const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const Policy = require('../models/Policy');
const { generateToken } = require('../utils/jwt');
const { sendOTP, verifyOTP } = require('../services/twilio');

// POST /api/platform/register
const register = async (req, res) => {
  try {
    const { company_name, platform, email, phone, password } = req.body;
    const existing = await PlatformPartner.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 12);
    const partner = await PlatformPartner.create({ company_name, platform, email, phone, password_hash });
    await sendOTP(phone);
    res.status(201).json({ message: 'Registered. OTP sent to your phone.', partner_id: partner._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/platform/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const partner = await PlatformPartner.findOne({ email });
    if (!partner) return res.status(404).json({ error: 'No platform account found' });
    const match = await bcrypt.compare(password, partner.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid password' });
    const token = generateToken({ id: partner._id, role: 'platform', platform: partner.platform });
    res.json({ token, partner: { _id: partner._id, company_name: partner.company_name, platform: partner.platform, email: partner.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/platform/workers
const getWorkers = async (req, res) => {
  try {
    const platform = req.user.platform;
    const { page = 1, limit = 20, city } = req.query;
    const filter = { platform };
    if (city) filter.city = city;
    const [workers, total] = await Promise.all([
      Worker.find(filter).select('-password_hash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Worker.countDocuments(filter),
    ]);

    // Enrich with insurance status
    const workersWithPolicy = await Promise.all(workers.map(async (w) => {
      const policy = await Policy.findOne({ worker_id: w._id, status: 'active' });
      return { ...w.toObject(), insurance_status: policy ? 'insured' : 'uninsured', policy };
    }));

    res.json({ workers: workersWithPolicy, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/platform/claims-feed
const getClaimsFeed = async (req, res) => {
  try {
    const platform = req.user.platform;
    const platformWorkers = await Worker.find({ platform }).select('_id');
    const workerIds = platformWorkers.map(w => w._id);
    const { page = 1, limit = 20, status } = req.query;
    const filter = { worker_id: { $in: workerIds } };
    if (status) filter.status = status;
    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate('worker_id', 'name phone city')
        .populate('policy_id', 'premium_tier coverage_amount')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Claim.countDocuments(filter),
    ]);
    res.json({ claims, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/platform/stats
const getStats = async (req, res) => {
  try {
    const platform = req.user.platform;
    const platformWorkers = await Worker.find({ platform }).select('_id');
    const workerIds = platformWorkers.map(w => w._id);
    const [insuredCount, totalClaims, paidClaims] = await Promise.all([
      Policy.countDocuments({ worker_id: { $in: workerIds }, status: 'active' }),
      Claim.countDocuments({ worker_id: { $in: workerIds } }),
      Claim.countDocuments({ worker_id: { $in: workerIds }, status: 'paid' }),
    ]);
    res.json({
      totalWorkers: workerIds.length, insuredWorkers: insuredCount,
      totalClaims, paidClaims, uninsuredWorkers: workerIds.length - insuredCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getWorkers, getClaimsFeed, getStats };
