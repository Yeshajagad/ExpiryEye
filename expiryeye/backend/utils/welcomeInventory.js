const Product = require('../models/Product');
const { checkExpiry } = require('../cron/expiryChecker');

function atDaysFromToday(days, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * A few starter rows so new accounts immediately see data on dashboard / medicines.
 */
async function seedWelcomeInventory(userId) {
  const rows = [
    {
      name: 'Welcome sample — Paracetamol',
      medicineId: 'DEMO-PARA-500',
      category: 'Medicine',
      quantity: 24,
      batchNumber: 'B-WEL-01',
      expiryDate: atDaysFromToday(18),
      entryMethod: 'medicine_id',
      reviewStatus: 'verified',
    },
    {
      name: 'Welcome sample — Vitamin C',
      medicineId: 'DEMO-VC-1000',
      category: 'Medicine',
      quantity: 30,
      batchNumber: 'B-WEL-02',
      expiryDate: atDaysFromToday(3),
      entryMethod: 'medicine_id',
      reviewStatus: 'pending',
    },
    {
      name: 'Welcome sample — ORS',
      medicineId: 'DEMO-ORS-331',
      category: 'Medicine',
      quantity: 12,
      batchNumber: 'B-WEL-03',
      expiryDate: atDaysFromToday(1),
      entryMethod: 'medicine_id',
      reviewStatus: 'verified',
    },
    {
      name: 'Welcome sample — Antacid strips',
      medicineId: 'DEMO-ANT-10',
      category: 'Medicine',
      quantity: 20,
      batchNumber: 'B-WEL-04',
      expiryDate: atDaysFromToday(-5),
      entryMethod: 'medicine_id',
      reviewStatus: 'verified',
    },
    {
      name: 'Welcome sample — Saline spray',
      medicineId: 'DEMO-SAL-15',
      category: 'Medicine',
      quantity: 8,
      batchNumber: 'B-WEL-05',
      expiryDate: atDaysFromToday(45),
      entryMethod: 'medicine_id',
      reviewStatus: 'verified',
    },
  ];

  const docs = rows.map((r) => ({
    ...r,
    user: userId,
    isSeedDemo: false,
  }));

  await Product.insertMany(docs);
  await checkExpiry({ sendEmails: false });
}

module.exports = { seedWelcomeInventory };
