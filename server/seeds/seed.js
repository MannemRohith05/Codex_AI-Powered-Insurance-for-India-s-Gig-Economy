require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

const Admin = require('../models/Admin');
const Worker = require('../models/Worker');
const PlatformPartner = require('../models/PlatformPartner');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const ActivityLog = require('../models/ActivityLog');
const DisruptionEvent = require('../models/DisruptionEvent');
const FraudLog = require('../models/FraudLog');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Admin.deleteMany({}), Worker.deleteMany({}), PlatformPartner.deleteMany({}),
    Policy.deleteMany({}), Claim.deleteMany({}), ActivityLog.deleteMany({}),
    DisruptionEvent.deleteMany({}), FraudLog.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Seed Admins ──────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const [superAdmin, fraudAnalyst] = await Admin.insertMany([
    { name: 'Arjun Mehta', email: 'admin@gigshield.in', password_hash: adminHash, role: 'super_admin', company_name: 'GigShield Insurance' },
    { name: 'Priya Sharma', email: 'fraud@gigshield.in', password_hash: adminHash, role: 'fraud_analyst', company_name: 'GigShield Insurance' },
  ]);
  console.log('✅ Admins seeded');

  // ── Seed Platform Partners ───────────────────────────────────────────
  const partnerHash = await bcrypt.hash('Partner@123', 12);
  await PlatformPartner.insertMany([
    { company_name: 'Swiggy Food Delivery', platform: 'Swiggy', email: 'partner@swiggy.com', phone: '+919876543210', password_hash: partnerHash, otp_verified: true },
    { company_name: 'Zomato India', platform: 'Zomato', email: 'partner@zomato.com', phone: '+919876543211', password_hash: partnerHash, otp_verified: true },
    { company_name: 'Zepto Quick Commerce', platform: 'Zepto', email: 'partner@zepto.com', phone: '+919876543212', password_hash: partnerHash, otp_verified: true },
  ]);
  console.log('✅ Platform partners seeded');

  // ── Seed Workers ─────────────────────────────────────────────────────
  const workerHash = await bcrypt.hash('Worker@123', 12);
  const zone_hyd = {
    type: 'Polygon',
    coordinates: [[[78.4, 17.3], [78.5, 17.3], [78.5, 17.4], [78.4, 17.4], [78.4, 17.3]]]
  };
  const workers = await Worker.insertMany([
    { name: 'Ravi Kumar', phone: '+919000000001', password_hash: workerHash, platform: 'Swiggy', city: 'Hyderabad', upi_id: 'ravi@okicici', avg_income: 800, phone_verified: true, aadhaar_verified: true, work_zone_geojson: zone_hyd, risk_score: 12 },
    { name: 'Sita Lakshmi', phone: '+919000000002', password_hash: workerHash, platform: 'Zomato', city: 'Hyderabad', upi_id: 'sita@okaxis', avg_income: 700, phone_verified: true, aadhaar_verified: true, work_zone_geojson: zone_hyd, risk_score: 5 },
    { name: 'Mohan Das', phone: '+919000000003', password_hash: workerHash, platform: 'Zepto', city: 'Bengaluru', upi_id: 'mohan@ybl', avg_income: 900, phone_verified: true, aadhaar_verified: false, risk_score: 65 },
    { name: 'Anjali Singh', phone: '+919000000004', password_hash: workerHash, platform: 'Swiggy', city: 'Mumbai', upi_id: 'anjali@paytm', avg_income: 1100, phone_verified: true, aadhaar_verified: true, work_zone_geojson: zone_hyd, risk_score: 8 },
    { name: 'Suresh Reddy', phone: '+919000000005', password_hash: workerHash, platform: 'Dunzo', city: 'Chennai', upi_id: 'suresh@okhdfc', avg_income: 650, phone_verified: false, aadhaar_verified: false, risk_score: 30 },
  ]);
  console.log('✅ Workers seeded');

  // ── Seed Policies ────────────────────────────────────────────────────
  const policies = await Policy.insertMany([
    { worker_id: workers[0]._id, premium_tier: 'medium', premium_amount: 39900, coverage_amount: 750000, status: 'active', payment_id: 'pay_mock_001' },
    { worker_id: workers[1]._id, premium_tier: 'low', premium_amount: 19900, coverage_amount: 300000, status: 'active', payment_id: 'pay_mock_002' },
    { worker_id: workers[2]._id, premium_tier: 'high', premium_amount: 79900, coverage_amount: 1500000, status: 'active', payment_id: 'pay_mock_003' },
    { worker_id: workers[3]._id, premium_tier: 'medium', premium_amount: 39900, coverage_amount: 750000, status: 'expired', payment_id: 'pay_mock_004' },
  ]);
  console.log('✅ Policies seeded');

  // ── Seed Claims ──────────────────────────────────────────────────────
  const claims = await Claim.insertMany([
    {
      worker_id: workers[0]._id, policy_id: policies[0]._id, disruption_type: 'rain',
      amount_claimed: 150000, amount_paid: 150000, status: 'paid',
      gps_at_claim: { lat: 17.385, lng: 78.4867 },
      weather_snapshot: { main: { temp: 28 }, rain: { '1h': 45 } },
      fraud_score: 10, razorpay_payout_id: 'pout_mock_001',
    },
    {
      worker_id: workers[1]._id, policy_id: policies[1]._id, disruption_type: 'poor_aqi',
      amount_claimed: 50000, status: 'under_review',
      gps_at_claim: { lat: 17.39, lng: 78.49 },
      weather_snapshot: { main: { temp: 38, humidity: 60 } },
      fraud_score: 25,
    },
    {
      worker_id: workers[2]._id, policy_id: policies[2]._id, disruption_type: 'heatwave',
      amount_claimed: 400000, status: 'under_review',
      gps_at_claim: { lat: 12.9716, lng: 77.5946 },
      fraud_score: 65, fraud_flags: { low_acceptance_rate: '55%', multiple_claims_today: 2 },
    },
    {
      worker_id: workers[0]._id, policy_id: policies[0]._id, disruption_type: 'flood',
      amount_claimed: 300000, status: 'submitted',
      gps_at_claim: { lat: 17.38, lng: 78.48 },
      fraud_score: 5,
    },
    {
      worker_id: workers[1]._id, policy_id: policies[1]._id, disruption_type: 'rain',
      amount_claimed: 50000, status: 'rejected', rejection_reason: 'Weather data does not confirm rainfall in area',
      fraud_score: 40, fraud_flags: { geo_fence_violation: true },
    },
  ]);
  console.log('✅ Claims seeded');

  // ── Seed FraudLogs ───────────────────────────────────────────────────
  await FraudLog.insertMany([
    { claim_id: claims[0]._id, worker_id: workers[0]._id, flags: {}, fraud_score: 10, recommendation: 'APPROVE', reviewed_by: superAdmin._id },
    { claim_id: claims[1]._id, worker_id: workers[1]._id, flags: { low_acceptance_rate: '58%' }, fraud_score: 25, recommendation: 'REVIEW' },
    { claim_id: claims[2]._id, worker_id: workers[2]._id, flags: { low_acceptance_rate: '55%', multiple_claims_today: 2 }, fraud_score: 65, recommendation: 'REJECT' },
    { claim_id: claims[4]._id, worker_id: workers[1]._id, flags: { geo_fence_violation: true }, fraud_score: 40, recommendation: 'REJECT', reviewed_by: fraudAnalyst._id },
  ]);
  console.log('✅ FraudLogs seeded');

  // ── Seed Activity Logs ───────────────────────────────────────────────
  const today = new Date();
  const activityLogs = [];
  for (let d = 0; d < 30; d++) {
    const date = new Date(today); date.setDate(date.getDate() - d);
    for (const w of workers.slice(0, 3)) {
      activityLogs.push({
        worker_id: w._id, log_date: date,
        hours_active: 6 + Math.floor(Math.random() * 4),
        deliveries: 10 + Math.floor(Math.random() * 15),
        distance_km: 40 + Math.floor(Math.random() * 30),
        accepted_orders: 18 + Math.floor(Math.random() * 7),
        available_orders: 25,
        earnings: 600 + Math.floor(Math.random() * 400),
      });
    }
  }
  await ActivityLog.insertMany(activityLogs);
  console.log('✅ ActivityLogs seeded (30 days × 3 workers)');

  // ── Seed Disruption Events ───────────────────────────────────────────
  await DisruptionEvent.insertMany([
    { city: 'Hyderabad', zone: 'Banjara Hills', type: 'rain', severity: 'high', is_active: true, declared_by: superAdmin._id, weather_data: { rain: { '1h': 55 } } },
    { city: 'Mumbai', zone: 'Andheri', type: 'flood', severity: 'medium', is_active: true, declared_by: superAdmin._id },
    { city: 'Delhi', zone: 'Connaught Place', type: 'poor_aqi', severity: 'high', is_active: false, declared_by: superAdmin._id },
    { city: 'Bengaluru', zone: 'Koramangala', type: 'heatwave', severity: 'medium', is_active: true, declared_by: superAdmin._id },
  ]);
  console.log('✅ DisruptionEvents seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Admin:    admin@gigshield.in    / Admin@123');
  console.log('   Fraud:    fraud@gigshield.in    / Admin@123');
  console.log('   Worker:   +919000000001         / Worker@123');
  console.log('   Swiggy:   partner@swiggy.com    / Partner@123');
  console.log('   Zomato:   partner@zomato.com    / Partner@123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
