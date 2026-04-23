const Product = require('../models/Product');
const { checkExpiry } = require('../cron/expiryChecker');
const {
  deleteRawSamplesForUser,
  insertRawSamplesForUser,
  RAW_BATCH_SIZE,
} = require('../utils/rawDemoProducts');

const lastExpiryTriggerByUser = new Map();
const TRIGGER_COOLDOWN_MS = 120_000;

function normalizeRole(user) {
  if (!user) return 'customer';
  if (user.role === 'user') return 'customer';
  return user.role;
}

async function assertInventoryRoom(user) {
  const role = normalizeRole(user);
  if (role === 'admin') return;
  const count = await Product.countDocuments({ user: user._id });
  const cap = role === 'store_owner' ? 10000 : 200;
  if (count >= cap) {
    const err = new Error(
      role === 'store_owner'
        ? 'Inventory limit reached for this account tier.'
        : 'Personal medicine limit reached. Store accounts support much larger inventories.'
    );
    err.status = 400;
    throw err;
  }
}

exports.uploadMedicinePhoto = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file received' });
    const publicPath = `/uploads/${req.file.filename}`;
    res.json({ url: publicPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    await assertInventoryRoom(req.user);
    const {
      name,
      batchNumber,
      category,
      expiryDate,
      quantity,
      medicineId,
      imageUrl,
      entryMethod,
    } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedId = typeof medicineId === 'string' ? medicineId.trim() : '';
    const displayName = trimmedName || trimmedId;
    if (!displayName) {
      return res.status(400).json({ message: 'Enter a medicine name or a medicine / barcode ID.' });
    }

    const role = normalizeRole(req.user);
    const reviewStatus = role === 'customer' ? 'pending' : 'verified';
    let method = 'manual';
    if (entryMethod === 'photo' || entryMethod === 'medicine_id') method = entryMethod;
    else if (imageUrl) method = 'photo';
    else if (trimmedId) method = 'medicine_id';

    const product = await Product.create({
      user: req.user._id,
      name: displayName,
      batchNumber,
      category: category || 'Medicine',
      expiryDate,
      quantity: Number(quantity),
      medicineId: trimmedId || undefined,
      imageUrl: imageUrl || undefined,
      entryMethod: method,
      reviewStatus,
      isSeedDemo: false,
    });
    await checkExpiry({ sendEmails: false });
    const fresh = await Product.findById(product._id);
    res.status(201).json(fresh);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const products = await Product.find(filter).sort({ expiryDate: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const body = { ...req.body };
    delete body.isSeedDemo;
    delete body.user;
    delete body.lastExpiryNotifiedAt;
    if (body.quantity !== undefined) body.quantity = Number(body.quantity);
    if (typeof body.name === 'string') body.name = body.name.trim();
    if (typeof body.medicineId === 'string') body.medicineId = body.medicineId.trim() || undefined;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await checkExpiry({ sendEmails: false });
    const updated = await Product.findById(product._id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const all = await Product.find(filter);
    res.json({
      total: all.length,
      safe: all.filter((p) => p.status === 'safe').length,
      nearExpiry: all.filter((p) => p.status === 'near-expiry').length,
      expired: all.filter((p) => p.status === 'expired').length,
      pendingReview: all.filter((p) => p.reviewStatus === 'pending').length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Replace RAW-DEMO-* sample medicines for the logged-in account. */
exports.seedRawSamples = async (req, res) => {
  try {
    await deleteRawSamplesForUser(req.user._id);
    const role = normalizeRole(req.user);
    if (role !== 'admin') {
      const count = await Product.countDocuments({ user: req.user._id });
      const cap = role === 'store_owner' ? 10000 : 200;
      if (count + RAW_BATCH_SIZE > cap) {
        return res.status(400).json({
          message: `Not enough free slots (${count}/${cap}). Remove some items first.`,
        });
      }
    }
    const n = await insertRawSamplesForUser(req.user._id);
    res.json({
      ok: true,
      inserted: n,
      message: `Loaded ${n} sample medicines for your account (pack IDs start with RAW-DEMO-).`,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
};

/** Re-run expiry scan with notifications. Clears today’s send throttle for YOUR items only, then scans all inventory (updates statuses). */
exports.triggerExpiryAlerts = async (req, res) => {
  try {
    const uid = String(req.user._id);
    const now = Date.now();
    const prev = lastExpiryTriggerByUser.get(uid) || 0;
    if (now - prev < TRIGGER_COOLDOWN_MS) {
      return res.status(429).json({
        message: `Please wait ${Math.ceil((TRIGGER_COOLDOWN_MS - (now - prev)) / 1000)}s before running again.`,
      });
    }
    lastExpiryTriggerByUser.set(uid, now);

    await Product.updateMany({ user: req.user._id }, { $unset: { lastExpiryNotifiedAt: 1 } });
    await checkExpiry({ sendEmails: true });

    res.json({
      ok: true,
      message:
        'Scan complete. Check the bell for in-app alerts. Email sends if EMAIL_USER/EMAIL_PASS are set. SMS sends if TWILIO_* env vars and your profile phone (E.164) are set.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
