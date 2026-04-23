const express = require('express');
const router = express.Router();
const { getLiveFeed } = require('../controllers/publicController');

router.get('/live-feed', getLiveFeed);

module.exports = router;
