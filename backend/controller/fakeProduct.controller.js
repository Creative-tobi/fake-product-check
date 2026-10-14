/**
 * Product Authenticity & Expiry Controller
 * 
 * Handles barcode scanning, external Open Food/Beauty Facts queries,
 * GS1 barcode verification, allergen & additive detection, tamper analysis,
 * and counterfeit reporting.
 */

const axios = require('axios');
const fakeProductModel = require('../models/fakeProduct.model');
const { validateBarcode } = require('../utils/barcodeValidator');
const { extractAllergens, analyzeHarmfulAdditives } = require('../utils/allergenHarmfulData');
const { analyzeShelfLife, analyzeBatchCode, computeAuthenticityScore } = require('../utils/tamperEngine');

// Curated list of demo products for 1-click testing in frontend
const DEMO_PRODUCTS = [
  {
    name: "Nutella Hazelnut Spread 400g (Authentic)",
    barcode: "3017620422003",
    brand: "Ferrero",
    type: "AUTHENTIC_VERIFIED",
    description: "Authentic worldwide product with verified GS1 checksum, complete ingredients & allergen profile."
  },
  {
    name: "Coca-Cola Original 330ml (Authentic)",
    barcode: "5449000000996",
    brand: "Coca-Cola",
    type: "AUTHENTIC_VERIFIED",
    description: "Standard global beverage barcode for testing nutritional data and additives."
  },
  {
    name: "Oreo Original Sandwich Cookies (Authentic)",
    barcode: "7622210449283",
    brand: "Mondelez",
    type: "AUTHENTIC_VERIFIED",
    description: "High allergen detection demo (wheat, soy) and additive scanning."
  },
  {
    name: "Colgate Triple Action Toothpaste (Cosmetics DB)",
    barcode: "8718951167440",
    brand: "Colgate-Palmolive",
    type: "AUTHENTIC_COSMETICS",
    description: "Tests cosmetics / beauty registry fallback (Open Beauty Facts)."
  },
  {
    name: "Nutri-Gain Infant Formula (Counterfeit Alert)",
    barcode: "9998887776665",
    brand: "Fake Labs Int.",
    type: "COUNTERFEIT_CHECKSUM_FAIL",
    description: "Simulated counterfeit product with failed GS1 checksum and blacklisted registry match."
  },
  {
    name: "Expired Dairy Yogurt (Tampered Date Demo)",
    barcode: "3017620422003",
    brand: "Ferrero",
    manualExpiryDate: "2023-01-15",
    manualProductionDate: "2022-12-01",
    type: "EXPIRED_DEMO",
    description: "Demonstrates past-expiry shelf life calculation and expired product hazard warning."
  },
  {
    name: "Forged Label Demo (Expiry Before Production)",
    barcode: "5449000000996",
    brand: "Coca-Cola",
    manualExpiryDate: "2023-05-10",
    manualProductionDate: "2024-01-20",
    type: "TAMPERED_LABEL_DEMO",
    description: "Demonstrates impossible date forgery: Expiration date is earlier than production date."
  }
];

/**
 * Main Product Scanner Handler
 * POST /api/fake_products/scan
 */
async function scanProduct(req, res) {
  try {
    const {
      barcode,
      manualExpiryDate,
      manualProductionDate,
      batchNumber,
      userAllergies = []
    } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: "Barcode is required to scan and verify a product."
      });
    }

    const cleanBarcode = String(barcode).trim().replace(/\s+/g, '');

    // 1. Validate GS1 Barcode & Calculate Checksum
    const barcodeValidation = validateBarcode(cleanBarcode);

    // 2. Check if product exists in local Counterfeit & Flagged Registry
    const flaggedRecord = await fakeProductModel.findByBarcode(cleanBarcode);

    // 3. Query External Global Product Registry (Open Food Facts v2)
    let productData = null;
    let sourceRegistry = null;

    try {
      const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
      const offResponse = await axios.get(offUrl, {
        headers: {
          'User-Agent': 'ProductAuthenticityChecker/2.0.0 (contact@product-safety-verify.org)'
        },
        timeout: 7000
      });

      if (offResponse.data && offResponse.data.status === 1 && offResponse.data.product) {
        productData = offResponse.data.product;
        sourceRegistry = 'Open Food Facts (Global Registry)';
      }
    } catch (apiErr) {
      console.warn('Open Food Facts API call failed or timed out:', apiErr.message);
    }

    // 4. Fallback to Open Beauty Facts (Cosmetics, Lotions, Toiletries) if not found in food
    if (!productData) {
      try {
        const obfUrl = `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
        const obfResponse = await axios.get(obfUrl, {
          headers: {
            'User-Agent': 'ProductAuthenticityChecker/2.0.0 (contact@product-safety-verify.org)'
          },
          timeout: 6000
        });

        if (obfResponse.data && obfResponse.data.status === 1 && obfResponse.data.product) {
          productData = obfResponse.data.product;
          sourceRegistry = 'Open Beauty Facts (Cosmetics & Toiletries Registry)';
        }
      } catch (obfErr) {
        // Fallback also failed or not in beauty database
      }
    }

    // 5. Analyze Shelf-Life & Temporal Tampering
    const shelfLife = analyzeShelfLife(manualExpiryDate, manualProductionDate);

    // 6. Analyze Batch Number
    const batchAnalysis = analyzeBatchCode(batchNumber);

    // If product is NOT registered in any global database:
    if (!productData) {
      const authenticityAnalysis = computeAuthenticityScore({
        barcodeValidation,
        isRegisteredInGlobalDB: false,
        shelfLifeAnalysis: shelfLife,
        batchAnalysis,
        flaggedRecord,
        harmfulAdditivesCount: 0
      });

      // If also not already flagged, record automatic notice
      if (!flaggedRecord) {
        await fakeProductModel.create({
          barcode: cleanBarcode,
          productName: `Unregistered Item (${cleanBarcode})`,
          brand: 'Unlisted / Unknown',
          flagType: barcodeValidation.isValidChecksum ? 'UNREGISTERED_IN_GLOBAL_REGISTRY' : 'INVALID_CHECKSUM',
          reason: barcodeValidation.isValidChecksum
            ? 'Barcode is not found in global consumer registries (Open Food Facts / Open Beauty Facts).'
            : 'Barcode failed mathematical GS1 Modulo-10 checksum validation (fabricated barcode).',
          reportedExpiryDate: manualExpiryDate || null,
          reportedProductionDate: manualProductionDate || null,
          batchNumber: batchNumber || null,
          tamperSeverity: barcodeValidation.isValidChecksum ? 'MODERATE' : 'CRITICAL',
          status: 'UNVERIFIED_SUSPECT'
        });
      }

      return res.status(200).json({
        success: true,
        isRegisteredInGlobalDB: false,
        isVerified: false,
        message: barcodeValidation.isValidChecksum
          ? "Barcode not cataloged in official global consumer registries. Exercise caution - this could be an unlisted local brand or a fake product."
          : "Barcode failed GS1 checksum validation! This barcode appears mathematically fabricated (likely counterfeit).",
        barcodeInfo: barcodeValidation,
        authenticityAssessment: authenticityAnalysis,
        flaggedRecord: flaggedRecord || null,
        shelfLife,
        batchAnalysis,
        product: {
          barcode: cleanBarcode,
          name: "Unregistered / Unknown Product",
          brand: "Not Registered in Global Database",
          categories: "Unclassified",
          imageUrl: null,
          ingredients: "Ingredients list unavailable from global registry. Inspect physical package label directly.",
          manufacturingCountry: barcodeValidation.originCountry
        },
        safetyAssessment: {
          allergens: [],
          personalAlerts: [],
          nutriScore: 'N/A',
          novaGroup: null,
          flaggedHarmfulAdditives: [],
          totalAdditivesCount: 0
        }
      });
    }

    // Product WAS found in global registry!
    const rawAdditives = productData.additives_tags || [];
    const ingredientsText = productData.ingredients_text || productData.ingredients_text_en || 'No ingredients listed';

    // 7. Extract Allergens & Personal Allergies Alert
    const allergenAnalysis = extractAllergens(
      productData.allergens_tags || [],
      ingredientsText,
      userAllergies
    );

    // 8. Analyze Harmful Additives
    const additiveAnalysis = analyzeHarmfulAdditives(rawAdditives, ingredientsText);

    // 9. Compute Overall Authenticity Score
    const authenticityAssessment = computeAuthenticityScore({
      barcodeValidation,
      isRegisteredInGlobalDB: true,
      shelfLifeAnalysis: shelfLife,
      batchAnalysis,
      flaggedRecord,
      harmfulAdditivesCount: additiveAnalysis.totalFlagged
    });

    // 10. Extract Clean Product Details
    const verifiedProduct = {
      barcode: productData.code || cleanBarcode,
      name: productData.product_name || productData.product_name_en || 'Unknown Product',
      brand: productData.brands || 'Unbranded / Generic',
      categories: productData.categories || 'General Consumer Goods',
      quantity: productData.quantity || 'Standard packaging',
      packaging: productData.packaging || 'Commercial package',
      manufacturingPlaces: productData.manufacturing_places || productData.origins || 'Not specified',
      imageUrl: productData.image_url || productData.image_front_url || productData.image_small_url || null,
      ingredients: ingredientsText,
      sourceRegistry,
      originCountry: barcodeValidation.originCountry
    };

    return res.status(200).json({
      success: true,
      isRegisteredInGlobalDB: true,
      isVerified: authenticityAssessment.classification === 'VERIFIED_AUTHENTIC',
      message: authenticityAssessment.recommendation,
      barcodeInfo: barcodeValidation,
      authenticityAssessment,
      flaggedRecord: flaggedRecord || null,
      shelfLife,
      batchAnalysis,
      product: verifiedProduct,
      safetyAssessment: {
        allergens: allergenAnalysis.detectedAllergens,
        personalAlerts: allergenAnalysis.personalAlerts,
        hasPersonalAllergyConflict: allergenAnalysis.hasPersonalAllergyConflict,
        nutriScore: productData.nutriscore_grade ? productData.nutriscore_grade.toUpperCase() : 'N/A',
        novaGroup: productData.nova_group || null,
        flaggedHarmfulAdditives: additiveAnalysis.flaggedAdditives,
        totalAdditivesCount: rawAdditives.length
      }
    });

  } catch (error) {
    console.error('scanProduct general error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing barcode scan: ' + error.message
    });
  }
}

/**
 * Deep Label Inspection & Tamper Analysis Handler
 * POST /api/fake_products/inspect-label
 */
async function inspectLabel(req, res) {
  try {
    const {
      barcode,
      productionDate,
      expiryDate,
      batchNumber,
      claimedBrand,
      claimedCountry,
      userNotes,
      labelImage
    } = req.body;

    if (!barcode && !productionDate && !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least a barcode, production date, or expiration date for label inspection."
      });
    }

    const cleanBarcode = barcode ? String(barcode).trim() : null;
    const barcodeValidation = cleanBarcode ? validateBarcode(cleanBarcode) : null;
    const shelfLife = analyzeShelfLife(expiryDate, productionDate);
    const batchAnalysis = analyzeBatchCode(batchNumber);
    const flaggedRecord = cleanBarcode ? await fakeProductModel.findByBarcode(cleanBarcode) : null;

    // Tamper Diagnostics Checklist
    const diagnosticChecklist = [
      {
        check: "Barcode GS1 Checksum Integrity",
        passed: barcodeValidation ? barcodeValidation.isValidChecksum : false,
        status: barcodeValidation && barcodeValidation.isValidChecksum ? "VERIFIED" : "FAILED / SUSPICIOUS",
        detail: barcodeValidation
          ? `Format: ${barcodeValidation.detectedFormat}. Prefix indicates ${barcodeValidation.originCountry}`
          : "No barcode provided"
      },
      {
        check: "Date Timeline Logic (MFD vs EXP)",
        passed: shelfLife.tamperAlerts.every(a => a.type !== 'EXPIRY_BEFORE_PRODUCTION'),
        status: shelfLife.tamperAlerts.some(a => a.type === 'EXPIRY_BEFORE_PRODUCTION') ? "CRITICAL_ANOMALY" : "CONSISTENT",
        detail: shelfLife.tamperAlerts.some(a => a.type === 'EXPIRY_BEFORE_PRODUCTION')
          ? "Expiration date precedes manufacture date. Obvious label forgery!"
          : "Chronological timeline is valid."
      },
      {
        check: "Future Manufacture Date Verification",
        passed: shelfLife.tamperAlerts.every(a => a.type !== 'FUTURE_PRODUCTION_DATE'),
        status: shelfLife.tamperAlerts.some(a => a.type === 'FUTURE_PRODUCTION_DATE') ? "SUSPICIOUS_FUTURE_DATE" : "VALID",
        detail: shelfLife.tamperAlerts.some(a => a.type === 'FUTURE_PRODUCTION_DATE')
          ? "Stated production date is in the future."
          : "Production date is historical."
      },
      {
        check: "Industrial Batch Code Authenticity",
        passed: batchAnalysis.provided ? !batchAnalysis.isSuspicious : true,
        status: batchAnalysis.provided && batchAnalysis.isSuspicious ? "FLAGGED_BATCH" : "VALID_FORMAT",
        detail: batchAnalysis.notes
      },
      {
        check: "Counterfeit & Tampering Database Lookup",
        passed: !flaggedRecord,
        status: flaggedRecord ? "MATCHES_FLAGGED_RECORD" : "CLEAN",
        detail: flaggedRecord ? `Flagged previously: ${flaggedRecord.reason}` : "No historical complaints recorded for this barcode"
      }
    ];

    // Compute Tamper Risk Level
    const failedChecks = diagnosticChecklist.filter(c => !c.passed).length;
    let tamperRisk = 'LOW';
    if (failedChecks >= 2 || shelfLife.tamperAlerts.some(a => a.severity === 'CRITICAL')) {
      tamperRisk = 'CRITICAL';
    } else if (failedChecks === 1) {
      tamperRisk = 'MODERATE';
    }

    return res.status(200).json({
      success: true,
      tamperRisk,
      barcodeValidation,
      shelfLife,
      batchAnalysis,
      flaggedRecord,
      diagnosticChecklist,
      recommendation: tamperRisk === 'CRITICAL'
        ? "CRITICAL WARNING: Tampered or forged label identified. Do not consume or distribute."
        : tamperRisk === 'MODERATE'
        ? "CAUTION: Label shows minor irregularities. Cross-verify physical hologram and seal."
        : "PASSED: Label dates and barcode meet standard industrial integrity tests."
    });

  } catch (error) {
    console.error('inspectLabel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to inspect label: ' + error.message
    });
  }
}

/**
 * Report a Fake or Tampered Product
 * POST /api/fake_products/report
 */
async function reportFakeProduct(req, res) {
  try {
    const {
      barcode,
      productName,
      brand,
      flagType,
      reason,
      reportedExpiryDate,
      reportedProductionDate,
      batchNumber,
      storeLocation,
      notes,
      imageUrl
    } = req.body;

    if (!barcode || !reason) {
      return res.status(400).json({
        success: false,
        message: "Barcode and reason are required to file a counterfeit report."
      });
    }

    const report = await fakeProductModel.create({
      barcode,
      productName: productName || 'Reported Counterfeit Product',
      brand: brand || 'Unknown Brand',
      flagType: flagType || 'SUSPECTED_COUNTERFEIT',
      reason,
      reportedExpiryDate: reportedExpiryDate || null,
      reportedProductionDate: reportedProductionDate || null,
      batchNumber: batchNumber || null,
      storeLocation: storeLocation || 'Unspecified location',
      notes: notes || '',
      imageUrl: imageUrl || null,
      tamperSeverity: 'HIGH',
      status: 'UNDER_INVESTIGATION'
    });

    return res.status(201).json({
      success: true,
      message: "Counterfeit product report filed successfully. Thank you for protecting consumer safety!",
      report
    });
  } catch (error) {
    console.error('reportFakeProduct error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report: ' + error.message
    });
  }
}

/**
 * Get All Flagged / Counterfeit Products
 * GET /api/fake_products/flagged
 */
async function getFlaggedProducts(req, res) {
  try {
    const products = await fakeProductModel.find();
    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('getFlaggedProducts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch flagged products: ' + error.message
    });
  }
}

/**
 * Delete a Flagged Product
 * DELETE /api/fake_products/flagged/:id
 */
async function deleteFlaggedProduct(req, res) {
  try {
    const { id } = req.params;
    const deleted = await fakeProductModel.delete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
      deleted
    });
  } catch (error) {
    console.error('deleteFlaggedProduct error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report: ' + error.message
    });
  }
}

/**
 * Get Demo Presets for 1-Click Testing
 * GET /api/fake_products/demos
 */
async function getDemoProducts(req, res) {
  return res.status(200).json({
    success: true,
    demos: DEMO_PRODUCTS
  });
}

module.exports = {
  scanProduct,
  inspectLabel,
  reportFakeProduct,
  getFlaggedProducts,
  deleteFlaggedProduct,
  getDemoProducts
};