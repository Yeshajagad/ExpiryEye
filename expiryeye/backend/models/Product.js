const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  batchNumber: { type: String },
  medicineId: { type: String },
  category: { type: String, default: 'Medicine' },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['safe', 'near-expiry', 'expired'], default: 'safe' },
  imageUrl: { type: String },
  entryMethod: {
    type: String,
    enum: ['manual', 'photo', 'medicine_id'],
    default: 'manual',
  },
  reviewStatus: {
    type: String,
    enum: ['pending', 'verified'],
    default: 'verified',
  },
  isSeedDemo: { type: Boolean, default: false },
  lastExpiryNotifiedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
