const nodemailer = require('nodemailer');

let cachedTransporter = null;
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return cachedTransporter;
}

const sendAlertEmail = async (to, subject, html) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('📧 Skipping email: set EMAIL_USER and EMAIL_PASS to enable alerts');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"ExpiryEye 💊" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
  }
};

module.exports = { sendAlertEmail };