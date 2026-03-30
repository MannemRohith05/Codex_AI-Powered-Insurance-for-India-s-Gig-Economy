const axios = require('axios');
const crypto = require('crypto');

const SANDBOX_BASE = 'https://api.sandbox.co.in';

const getHeaders = () => ({
  'x-api-key': process.env.SANDBOX_API_KEY || 'your_sandbox_api_key',
  'x-api-secret': process.env.SANDBOX_API_SECRET || '',
  'x-api-version': '1.0',
  'Content-Type': 'application/json',
});

/**
 * Step 1: Initiate Aadhaar OTP
 */
const initiateAadhaarOTP = async (aadhaarNumber) => {
  if (!process.env.SANDBOX_API_KEY || process.env.SANDBOX_API_KEY.startsWith('your_')) {
    // Dev mock
    console.log(`[Sandbox DEV] Mock OTP sent for Aadhaar: ${aadhaarNumber.slice(0, 4)}****`);
    return { success: true, ref_id: 'mock_ref_' + Date.now(), message: 'OTP sent (mocked)' };
  }
  const res = await axios.post(
    `${SANDBOX_BASE}/kyc/aadhaar/okyc/otp`,
    { '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request', aadhaar_number: aadhaarNumber },
    { headers: getHeaders() }
  );
  return res.data;
};

/**
 * Step 2: Verify Aadhaar OTP
 */
const verifyAadhaarOTP = async (refId, otp, shareCode = '1234') => {
  if (!process.env.SANDBOX_API_KEY || process.env.SANDBOX_API_KEY.startsWith('your_')) {
    // Dev mock — accept any OTP
    return {
      success: true,
      data: {
        name: 'Demo User',
        date_of_birth: '1990-01-01',
        gender: 'M',
        address: { country: 'India', state: 'Telangana', district: 'Hyderabad' },
      },
    };
  }
  const res = await axios.post(
    `${SANDBOX_BASE}/kyc/aadhaar/okyc/otp/verify`,
    {
      '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
      reference_id: refId,
      otp,
      share_code: shareCode,
    },
    { headers: getHeaders() }
  );
  return res.data;
};

/**
 * Hash Aadhaar for secure storage (SHA-256)
 */
const hashAadhaar = (aadhaarNumber) => {
  return crypto.createHash('sha256').update(aadhaarNumber.trim()).digest('hex');
};

module.exports = { initiateAadhaarOTP, verifyAadhaarOTP, hashAadhaar };
