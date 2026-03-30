const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const FraudLog = require('../models/FraudLog');
const Policy = require('../models/Policy');
const DisruptionEvent = require('../models/DisruptionEvent');
const { generateToken } = require('../utils/jwt');
const { processPayout } = require('../services/razorpay');

// POST /api/admin/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid password' });
    const token = generateToken({ id: admin._id, role: 'admin', email: admin.email });
    res.json({ token, admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totalWorkers, activePolicies, pendingClaims, fraudLogs, totalPaid] = await Promise.all([
      Worker.countDocuments(),
      Policy.countDocuments({ status: 'active' }),
      Claim.countDocuments({ status: 'under_review' }),
      FraudLog.countDocuments({ recommendation: 'REJECT' }),
      Claim.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount_paid' } } }]),
    ]);
    res.json({
      totalWorkers, activePolicies, pendingClaims, flaggedFraud: fraudLogs,
      totalPaidOut: totalPaid[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/claims
const getClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .populate('worker_id', 'name phone platform city upi_id')
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

// PUT /api/admin/claim/:id/approve
const approveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await Claim.findById(id).populate('worker_id', 'upi_id');
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    let payoutId = null;
    let paidAmount = null;
    if (claim.worker_id?.upi_id) {
      try {
        const payout = await processPayout(claim.worker_id.upi_id, claim.amount_claimed, { claim_id: id });
        payoutId = payout.id;
        paidAmount = claim.amount_claimed;
      } catch (e) {
        console.error('[Admin Approve] Payout failed:', e.message);
      }
    }

    const updated = await Claim.findByIdAndUpdate(id, {
      status: payoutId ? 'paid' : 'approved',
      razorpay_payout_id: payoutId,
      amount_paid: paidAmount,
    }, { new: true });

    await FraudLog.findOneAndUpdate({ claim_id: id }, { reviewed_by: req.user.id, reviewed_at: new Date() });

    res.json({ message: 'Claim approved', claim: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/claim/:id/reject
const rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await Claim.findByIdAndUpdate(id, { status: 'rejected', rejection_reason: reason }, { new: true });
    await FraudLog.findOneAndUpdate({ claim_id: id }, { reviewed_by: req.user.id, reviewed_at: new Date() });
    res.json({ message: 'Claim rejected', claim: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/fraud-panel
const getFraudPanel = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [logs, total] = await Promise.all([
      FraudLog.find()
        .populate('claim_id', 'disruption_type amount_claimed status createdAt')
        .populate('worker_id', 'name phone platform city fraud_score')
        .populate('reviewed_by', 'name email')
        .sort({ fraud_score: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      FraudLog.countDocuments(),
    ]);
    res.json({ logs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/workers
const getWorkers = async (req, res) => {
  try {
    const { platform, city, verified, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (platform) filter.platform = platform;
    if (city) filter.city = city;
    if (verified !== undefined) filter.aadhaar_verified = verified === 'true';
    const [workers, total] = await Promise.all([
      Worker.find(filter).select('-password_hash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Worker.countDocuments(filter),
    ]);
    res.json({ workers, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/disruption
const createDisruption = async (req, res) => {
  try {
    const { city, zone, type, severity, weather_data } = req.body;
    const event = await DisruptionEvent.create({
      city, zone, type, severity, weather_data,
      declared_by: req.user.id,
      is_active: true,
    });
    res.status(201).json({ message: 'Disruption event created', event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/disruptions
const getDisruptions = async (req, res) => {
  try {
    const events = await DisruptionEvent.find().sort({ createdAt: -1 }).limit(50).populate('declared_by', 'name');
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/claims/heatmap - returns GPS coords for active claims
const getClaimsHeatmap = async (req, res) => {
  try {
    const claims = await Claim.find({ gps_at_claim: { $exists: true } })
      .select('gps_at_claim disruption_type status amount_claimed')
      .limit(500);
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, getDashboard, getClaims, approveClaim, rejectClaim, getFraudPanel, getWorkers, createDisruption, getDisruptions, getClaimsHeatmap };
