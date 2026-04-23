/**
 * Optional Twilio SMS. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (E.164).
 * User must have `phone` set on their account (E.164, e.g. +14155552671).
 */
async function sendExpirySms(to, body) {
  if (!to) return;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    console.warn('📱 SMS skipped: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
    return;
  }
  try {
    const twilio = require('twilio');
    const client = twilio(sid, token);
    const text = body.length > 1500 ? `${body.slice(0, 1490)}…` : body;
    await client.messages.create({ to, from, body: text });
    console.log(`📱 SMS sent to ${to}`);
  } catch (err) {
    console.error('❌ SMS error:', err.message);
  }
}

module.exports = { sendExpirySms };
