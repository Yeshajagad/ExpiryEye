const express = require('express');
const router = express.Router();
const upload = require('../middleware/multerUpload');
const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getStats,
  uploadMedicinePhoto,
  seedRawSamples,
  triggerExpiryAlerts,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/stats', getStats);
router.post('/seed-raw-samples', seedRawSamples);
router.post('/trigger-expiry-alerts', triggerExpiryAlerts);
router.post('/upload', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Invalid file upload' });
    next();
  });
}, uploadMedicinePhoto);
router.get('/', getProducts);
router.post('/', addProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
