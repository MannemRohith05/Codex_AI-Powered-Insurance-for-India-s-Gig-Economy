const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  phone: { type: String },
  password_hash: { type: String, required: true },
  company_name: { type: String, default: 'GigShield Insurance' },
  role: { type: String, enum: ['super_admin', 'claims_officer', 'fraud_analyst'], default: 'claims_officer' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
