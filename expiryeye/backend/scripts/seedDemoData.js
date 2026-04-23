/**
 * Inserts demo “live pipeline” medicines (isSeedDemo) for the public feed.
 * Run: npm run seed  (from backend folder, with .env + MongoDB available)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');

const SEED_EMAIL = 'demo-pipeline@expiryeye.internal';

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}

const demoRows = [
  { name: 'Amoxicillin 500mg', medicineId: 'RX-AMX-500-8821', category: 'Medicine', quantity: 120, days: -12, status: 'expired', review: 'verified' },
  { name: 'Paracetamol 650mg', medicineId: 'SKU-PARA-650', category: 'Medicine', quantity: 340, days: 3, status: 'near-expiry', review: 'pending' },
  { name: 'Vitamin D3 60k', medicineId: 'VD3-60K-IN', category: 'Medicine', quantity: 45, days: 5, status: 'near-expiry', review: 'pending' },
  { name: 'ORS Sachets', medicineId: 'ORS-LMN-44', category: 'Medicine', quantity: 600, days: 18, status: 'safe', review: 'verified' },
  { name: 'Insulin Glargine', medicineId: 'INS-GLAR-100', category: 'Medicine', quantity: 22, days: 1, status: 'near-expiry', review: 'pending' },
  { name: 'Azithromycin 250', medicineId: 'AZI-250-B9', category: 'Medicine', quantity: 88, days: -2, status: 'expired', review: 'verified' },
  { name: 'Cetirizine 10mg', medicineId: 'CET-10-PL', category: 'Medicine', quantity: 200, days: 45, status: 'safe', review: 'verified' },
  { name: 'Calcium + D3 chewable', medicineId: 'CAL-D3-CH-01', category: 'Medicine', quantity: 95, days: 8, status: 'near-expiry', review: 'pending' },
  { name: 'Hand sanitizer 500ml', medicineId: 'HS-500-CLR', category: 'Cosmetic', quantity: 140, days: 120, status: 'safe', review: 'verified' },
  { name: 'Hydrogen peroxide 100ml', medicineId: 'HP-100-OTC', category: 'Chemical', quantity: 30, days: -30, status: 'expired', review: 'verified' },
  { name: 'Zinc tablets 20mg', medicineId: 'ZN-20-TB', category: 'Medicine', quantity: 75, days: 6, status: 'near-expiry', review: 'pending' },
  { name: 'ORS Apple (pediatric)', medicineId: 'ORS-AP-PED', category: 'Medicine', quantity: 210, days: 90, status: 'safe', review: 'verified' },
  { name: 'Salbutamol inhaler', medicineId: 'SAL-INH-90', category: 'Medicine', quantity: 18, days: 2, status: 'near-expiry', review: 'pending' },
  { name: 'Metformin 500 SR', medicineId: 'MET-500-SR', category: 'Medicine', quantity: 400, days: 14, status: 'safe', review: 'verified' },
  { name: 'Antiseptic liquid 200ml', medicineId: 'ANT-200-BRN', category: 'Chemical', quantity: 55, days: 4, status: 'near-expiry', review: 'pending' },
  { name: 'Electrolyte powder', medicineId: 'ELP-OR-01', category: 'Medicine', quantity: 150, days: 60, status: 'safe', review: 'verified' },
  { name: 'Diclofenac gel 1%', medicineId: 'DCF-GEL-30', category: 'Medicine', quantity: 42, days: -5, status: 'expired', review: 'verified' },
  { name: 'Multivitamin syrup', medicineId: 'MV-SYP-200', category: 'Medicine', quantity: 36, days: 7, status: 'near-expiry', review: 'pending' },
  { name: 'Face moisturizer SPF15', medicineId: 'FM-SPF15-50', category: 'Cosmetic', quantity: 62, days: 200, status: 'safe', review: 'verified' },
  { name: 'Glucose-D 200g', medicineId: 'GLU-D-200', category: 'Food', quantity: 88, days: 25, status: 'safe', review: 'verified' },
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding demo pipeline…');

  let user = await User.findOne({ email: SEED_EMAIL });
  if (!user) {
    const hash = await bcrypt.hash('not-used-seed-login', 10);
    user = await User.create({
      name: 'ExpiryEye Demo Uplink',
      email: SEED_EMAIL,
      password: hash,
      role: 'store_owner',
    });
    console.log('Created demo system user');
  }

  await Product.deleteMany({ isSeedDemo: true });

  const docs = demoRows.map((r) => ({
    user: user._id,
    name: r.name,
    medicineId: r.medicineId,
    category: r.category,
    quantity: r.quantity,
    expiryDate: daysFromNow(r.days),
    status: r.status,
    reviewStatus: r.review,
    entryMethod: 'medicine_id',
    isSeedDemo: true,
    batchNumber: `BATCH-${r.medicineId.slice(-4)}`,
  }));

  await Product.insertMany(docs);
  console.log(`Inserted ${docs.length} demo medicines (public live feed).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
