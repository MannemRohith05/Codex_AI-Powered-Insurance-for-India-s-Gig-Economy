const mongoose = require('mongoose');

const platformPartnerSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  platform: { type: String, enum: ['Swiggy', 'Zomato', 'Zepto', 'Dunzo', 'Other'], required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  phone: { type: String },
  password_hash: { type: String, required: true },
  otp_verified: { type: Boolean, default: false },
  api_key: { type: String },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PlatformPartner', platformPartnerSchema);
