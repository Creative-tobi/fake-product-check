/**
 * Fake Product & Authenticity Routes
 */

const express = require('express');
const router = express.Router();

const {
  scanProduct,
  inspectLabel,
  reportFakeProduct,
  getFlaggedProducts,
  deleteFlaggedProduct,
  getDemoProducts
} = require('../controller/fakeProduct.controller');

// Scan barcode and perform full authenticity, expiry, allergen and safety check
router.post('/scan', scanProduct);

// Deep label inspection & tamper timeline verification
router.post('/inspect-label', inspectLabel);

// File community counterfeit / tampered product report
router.post('/report', reportFakeProduct);

// Fetch all flagged and suspected fake products
router.get('/flagged', getFlaggedProducts);

// Delete / dismiss a flagged report
router.delete('/flagged/:id', deleteFlaggedProduct);

// Fetch sample realistic barcodes for instant testing
router.get('/demos', getDemoProducts);

module.exports = router;