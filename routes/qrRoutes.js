const express = require('express');
const router = express.Router();

const { generateQrCode, getQrMetadata } = require('../controllers/qrController');
const { verifyApiKey } = require('../middleware/authMiddleware');

router.get('/', verifyApiKey, generateQrCode);
router.get('/metadata', getQrMetadata);

module.exports = router;
