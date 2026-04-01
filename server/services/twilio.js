const twilio = require('twilio');

// In-memory OTP store (replace with Redis in production)
const otpStore = new Map();

const getClient = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
      !process.env.TWILIO_ACCOUNT_SID.startsWith('your_')) {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return null;
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (phone) => {
  const otp = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(phone, { otp, expires });

  const client = getClient();
  if (client) {
    let toPhone = phone;
    if (toPhone.length === 10 && /^\d+$/.test(toPhone)) toPhone = '+91' + toPhone;
    
    try {
      await client.messages.create({
        body: `Your GigShield OTP is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: toPhone,
      });
      console.log(`[Twilio] OTP sent to ${phone}`);
    } catch (err) {
      console.error('[Twilio] SMS failed:', err.message);
      // Do not throw — still save OTP for dev testing
    }
  } else {
    console.log(`[Twilio DEV] OTP for ${phone}: ${otp}`);
  }

  return { success: true };
};

const verifyOTP = (phone, code) => {
  const record = otpStore.get(phone);
  if (!record) return { valid: false, reason: 'No OTP found for this number' };
  if (Date.now() > record.expires) {
    otpStore.delete(phone);
    return { valid: false, reason: 'OTP expired' };
  }
  if (record.otp !== code) return { valid: false, reason: 'Invalid OTP' };
  otpStore.delete(phone);
  return { valid: true };
};

module.exports = { sendOTP, verifyOTP };
