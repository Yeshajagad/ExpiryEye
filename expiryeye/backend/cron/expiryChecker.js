const cron = require('node-cron');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { sendAlertEmail } = require('../utils/mailService');
const { sendExpirySms } = require('../utils/smsService');
const { getNoticeWindowDays, isSameLocalDay } = require('../utils/alertConfig');

function daysUntilExpiry(expiry, from = new Date()) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(expiry);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / 86400000);
}

async function notifyNearExpiry(product, expiry, noticeDays) {
  const user = product.user;
  if (!user?._id || product.isSeedDemo) return;

  const now = new Date();
  if (product.lastExpiryNotifiedAt && isSameLocalDay(product.lastExpiryNotifiedAt, now)) return;

  const dLeft = daysUntilExpiry(expiry, now);
  const when =
    dLeft <= 0 ? 'today' : dLeft === 1 ? 'tomorrow' : `in ${dLeft} days`;
  const title = `Expiring soon: ${product.name}`;
  const body = `Expiry ${when} (${expiry.toDateString()}). Pack ID: ${product.medicineId || '—'}. Qty: ${product.quantity}.`;

  if (user.email) {
    await sendAlertEmail(
      user.email,
      title,
      `<h2>ExpiryEye — expiry reminder</h2>
    <p><strong>${product.name}</strong> expires on <strong>${expiry.toDateString()}</strong> (${when}).</p>
    <p>Pack / ID: <strong>${product.medicineId || 'N/A'}</strong> · Batch: <strong>${product.batchNumber || 'N/A'}</strong></p>
    <p>Quantity: <strong>${product.quantity}</strong></p>
    <p>Reminders run up to <strong>${noticeDays}</strong> calendar days before expiry (never less than <strong>2</strong>). At most <strong>one email + in-app alert per day</strong> per item while it stays in this window.</p>`
    );
  }

  const smsText = `ExpiryEye: ${product.name} expires ${when} (${expiry.toDateString()}). ID ${product.medicineId || 'n/a'}. Qty ${product.quantity}.`;
  if (user.phone && String(user.phone).trim()) {
    await sendExpirySms(String(user.phone).trim(), smsText);
  }

  await Notification.create({
    user: user._id,
    product: product._id,
    type: 'expiry_soon',
    title,
    body,
  });

  product.lastExpiryNotifiedAt = now;
}

const checkExpiry = async ({ sendEmails = false } = {}) => {
  const noticeDays = getNoticeWindowDays();
  const today = new Date();
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + noticeDays);
  windowEnd.setHours(23, 59, 59, 999);

  if (sendEmails) {
    console.log(`⏰ Expiry check (notify window: ${noticeDays} days, min 2)…`);
  }

  const products = await Product.find().populate('user');

  for (const product of products) {
    const expiry = new Date(product.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);

    if (expiry < dayStart) {
      product.status = 'expired';
    } else if (expiry <= windowEnd) {
      product.status = 'near-expiry';
      if (sendEmails) {
        await notifyNearExpiry(product, expiry, noticeDays);
      }
    } else {
      product.status = 'safe';
      product.lastExpiryNotifiedAt = null;
    }

    await product.save();
  }

  if (sendEmails) console.log('✅ Expiry check complete');
};

const startCronJob = () => {
  cron.schedule('0 8,20 * * *', () => checkExpiry({ sendEmails: true }));
  console.log('🕐 Expiry alerts scheduled: 08:00 and 20:00 (server local time)');
};

module.exports = { startCronJob, checkExpiry };
