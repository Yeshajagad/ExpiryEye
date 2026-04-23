const Product = require('../models/Product');
const { checkExpiry } = require('../cron/expiryChecker');

const PREFIX = 'RAW-DEMO-';

function atDaysFromToday(days, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function buildRows(userId) {
  const mk = (i, name, days, qty, cat = 'Medicine') => ({
    user: userId,
    name,
    medicineId: `${PREFIX}${String(i).padStart(2, '0')}`,
    category: cat,
    quantity: qty,
    batchNumber: `B-RAW-${i}`,
    expiryDate: atDaysFromToday(days),
    entryMethod: 'medicine_id',
    reviewStatus: 'verified',
    isSeedDemo: false,
  });

  return [
    mk(1, 'Raw sample — Cough syrup 100ml', 14, 18),
    mk(2, 'Raw sample — Antihistamine 10mg', 2, 40),
    mk(3, 'Raw sample — Electrolyte sachets', 1, 100),
    mk(4, 'Raw sample — Eye drops 10ml', 0, 12),
    mk(5, 'Raw sample — Expired cough drops', -8, 6),
    mk(6, 'Raw sample — Calcium tablets', 35, 60),
    mk(7, 'Raw sample — Hand rub 200ml', 5, 24),
    mk(8, 'Raw sample — Zinc + C', 3, 30),
  ];
}

async function deleteRawSamplesForUser(userId) {
  await Product.deleteMany({ user: userId, medicineId: new RegExp(`^${PREFIX}`) });
}

async function insertRawSamplesForUser(userId) {
  const docs = buildRows(userId);
  await Product.insertMany(docs);
  await checkExpiry({ sendEmails: false });
  return docs.length;
}

module.exports = {
  deleteRawSamplesForUser,
  insertRawSamplesForUser,
  RAW_PREFIX: PREFIX,
  RAW_BATCH_SIZE: 8,
};
