const Product = require('../models/Product');

exports.getLiveFeed = async (_req, res) => {
  try {
    const samples = await Product.find({ isSeedDemo: true })
      .sort({ updatedAt: -1 })
      .limit(24)
      .select('name category expiryDate status reviewStatus medicineId imageUrl updatedAt')
      .lean();

    const pending = samples.filter((p) => p.reviewStatus === 'pending').length;
    const verified = samples.filter((p) => p.reviewStatus === 'verified').length;

    res.json({
      headline: 'Live medicine safety checks',
      subline: 'Sample inventory being evaluated across connected pharmacies (demo data).',
      stats: {
        samplesInView: samples.length,
        pendingReview: pending,
        verifiedPipeline: verified,
        lastUpdated: samples[0]?.updatedAt || null,
      },
      items: samples,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
