/**
 * Tamper & Counterfeit Analysis Engine
 * 
 * Performs multi-factor analysis on product barcodes, manufacturing/expiry dates,
 * packaging batch numbers, and global registries to detect forged or tampered items.
 */

const { validateBarcode } = require('./barcodeValidator');

/**
 * Calculates shelf life metrics and detects temporal tampering anomalies.
 * @param {string|Date} expiryDateInput - Stated expiration date
 * @param {string|Date} productionDateInput - Stated manufacturing / production date
 */
function analyzeShelfLife(expiryDateInput, productionDateInput = null) {
  const result = {
    isCalculated: false,
    expiryDate: null,
    productionDate: null,
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining: null,
    daysElapsed: null,
    totalShelfLifeDays: null,
    freshnessPercentage: null,
    status: 'NOT_PROVIDED',
    tamperAlerts: []
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse production date if available
  let prodDate = null;
  if (productionDateInput) {
    prodDate = new Date(productionDateInput);
    if (!isNaN(prodDate.getTime())) {
      result.productionDate = prodDate.toISOString().split('T')[0];

      // Tamper Check 1: Production date in the future
      if (prodDate.getTime() > today.getTime() + 86400000) {
        result.tamperAlerts.push({
          type: 'FUTURE_PRODUCTION_DATE',
          severity: 'CRITICAL',
          message: 'Manufacturing date is set in the future. Strong indicator of counterfeit or forged label.'
        });
      }
    }
  }

  // Parse expiry date
  if (expiryDateInput) {
    const expDate = new Date(expiryDateInput);
    if (!isNaN(expDate.getTime())) {
      result.isCalculated = true;
      result.expiryDate = expDate.toISOString().split('T')[0];

      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      result.daysRemaining = diffDays;
      result.isExpired = diffDays < 0;
      result.isExpiringSoon = diffDays >= 0 && diffDays <= 30;

      // Status determination
      if (diffDays < 0) {
        result.status = 'EXPIRED';
      } else if (diffDays <= 7) {
        result.status = 'EXPIRING_URGENT';
      } else if (diffDays <= 30) {
        result.status = 'EXPIRING_SOON';
      } else {
        result.status = 'FRESH_AND_VALID';
      }

      // Tamper Check 2: Expiry date BEFORE Production date
      if (prodDate && expDate.getTime() < prodDate.getTime()) {
        result.tamperAlerts.push({
          type: 'EXPIRY_BEFORE_PRODUCTION',
          severity: 'CRITICAL',
          message: 'Expiration date is earlier than the production date! Label is definitively altered or forged.'
        });
        result.status = 'TAMPERED_ANOMALY';
      }

      // Tamper Check 3: Absurdly long shelf life (> 15 years into future)
      const maxSensibleFutureDays = 365 * 15;
      if (diffDays > maxSensibleFutureDays) {
        result.tamperAlerts.push({
          type: 'EXCESSIVE_SHELF_LIFE',
          severity: 'HIGH',
          message: `Stated expiration date is over 15 years into the future (${result.expiryDate}). Highly suspicious.`
        });
      }

      // Shelf life progression percentage
      if (prodDate && expDate.getTime() > prodDate.getTime()) {
        const totalSpan = expDate.getTime() - prodDate.getTime();
        const totalDays = Math.max(1, Math.round(totalSpan / (1000 * 60 * 60 * 24)));
        const elapsedSpan = today.getTime() - prodDate.getTime();
        const elapsedDays = Math.max(0, Math.round(elapsedSpan / (1000 * 60 * 60 * 24)));

        result.totalShelfLifeDays = totalDays;
        result.daysElapsed = elapsedDays;

        if (diffDays < 0) {
          result.freshnessPercentage = 0;
        } else {
          const fresh = Math.max(0, Math.min(100, Math.round(((totalDays - elapsedDays) / totalDays) * 100)));
          result.freshnessPercentage = fresh;
        }
      }
    }
  }

  return result;
}

/**
 * Inspects batch number strings for standard industrial compliance
 */
function analyzeBatchCode(batchCode) {
  if (!batchCode) {
    return {
      provided: false,
      isSuspicious: false,
      notes: 'No batch code provided for verification'
    };
  }

  const clean = String(batchCode).trim();
  const suspiciousTokens = ['TEST', 'FAKE', 'SAMPLE', '000000', '123456', 'XXXX', 'NULL', 'NONE'];
  const isSuspicious = suspiciousTokens.some(tok => clean.toUpperCase().includes(tok)) || clean.length < 3;

  return {
    provided: true,
    batchCode: clean,
    isSuspicious,
    notes: isSuspicious
      ? 'Batch number appears generic, repetitive, or resembles test/placeholder code.'
      : 'Batch code follows standard commercial alphanumeric format.'
  };
}

/**
 * Calculates an end-to-end Product Authenticity & Verification Score (0 - 100)
 */
function computeAuthenticityScore({
  barcodeValidation,
  isRegisteredInGlobalDB,
  shelfLifeAnalysis,
  batchAnalysis,
  flaggedRecord,
  harmfulAdditivesCount
}) {
  let score = 50; // Neutral baseline
  const breakdown = [];
  const riskFlags = [];

  // 1. GS1 Barcode Checksum Verification (+25 or -35)
  if (barcodeValidation.isValidChecksum) {
    score += 20;
    breakdown.push({ label: 'GS1 Modulo 10 Checksum Verified', delta: '+20', status: 'PASS' });
  } else {
    score -= 35;
    riskFlags.push('Barcode failed mathematical GS1 checksum (Counterfeit indicator)');
    breakdown.push({ label: 'GS1 Checksum Failed / Fabricated Barcode', delta: '-35', status: 'FAIL' });
  }

  // 2. Global Registry (Open Food / Open Beauty Facts) Presence (+25 or -20)
  if (isRegisteredInGlobalDB) {
    score += 25;
    breakdown.push({ label: 'Verified in Global Product Registry', delta: '+25', status: 'PASS' });
  } else {
    score -= 15;
    riskFlags.push('Barcode not cataloged in official global consumer registry');
    breakdown.push({ label: 'Unlisted in Global Database', delta: '-15', status: 'WARN' });
  }

  // 3. Known Flagged Counterfeit in System Database
  if (flaggedRecord) {
    score -= 40;
    riskFlags.push(`Product flagged in counterfeit registry: "${flaggedRecord.reason}"`);
    breakdown.push({ label: 'Matches Known Counterfeit Report', delta: '-40', status: 'FAIL' });
  } else {
    score += 5;
    breakdown.push({ label: 'Clean Counterfeit Blacklist Check', delta: '+5', status: 'PASS' });
  }

  // 4. Shelf-life & Temporal Tampering
  if (shelfLifeAnalysis.tamperAlerts && shelfLifeAnalysis.tamperAlerts.length > 0) {
    const criticalTampering = shelfLifeAnalysis.tamperAlerts.some(a => a.severity === 'CRITICAL');
    const penalty = criticalTampering ? 35 : 20;
    score -= penalty;
    for (const alert of shelfLifeAnalysis.tamperAlerts) {
      riskFlags.push(`Label Tampering Detected: ${alert.message}`);
    }
    breakdown.push({ label: 'Label Date Tampering / Inconsistency', delta: `-${penalty}`, status: 'FAIL' });
  } else if (shelfLifeAnalysis.isCalculated && !shelfLifeAnalysis.isExpired) {
    score += 5;
    breakdown.push({ label: 'Consistent Date & Valid Shelf-Life', delta: '+5', status: 'PASS' });
  }

  // 5. Expired Status Warning
  if (shelfLifeAnalysis.isExpired) {
    score -= 10;
    riskFlags.push(`Product is expired by ${Math.abs(shelfLifeAnalysis.daysRemaining)} days`);
    breakdown.push({ label: 'Expired Product On Shelf', delta: '-10', status: 'WARN' });
  }

  // 6. Batch Code Check
  if (batchAnalysis && batchAnalysis.provided) {
    if (batchAnalysis.isSuspicious) {
      score -= 15;
      riskFlags.push('Suspicious or placeholder batch identifier');
      breakdown.push({ label: 'Irregular Batch Identifier', delta: '-15', status: 'FAIL' });
    } else {
      score += 5;
      breakdown.push({ label: 'Valid Industrial Batch Code Format', delta: '+5', status: 'PASS' });
    }
  }

  // Clamp final score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  // Determine Overall Status Classification
  let classification = 'SUSPECTED_COUNTERFEIT';
  let badgeColor = 'red';
  let recommendation = 'Do not purchase or consume. Product displays significant counterfeit or tampering flags.';

  if (finalScore >= 80 && !flaggedRecord && riskFlags.length === 0) {
    classification = 'VERIFIED_AUTHENTIC';
    badgeColor = 'green';
    recommendation = 'Product is verified authentic, listed in global registry, and passes all checksum & label tests.';
  } else if (finalScore >= 60) {
    classification = 'PROBABLY_GENUINE_CAUTION';
    badgeColor = 'amber';
    recommendation = 'Product appears genuine but verify physical packaging seal and expiration date stamp before use.';
  } else if (finalScore >= 40) {
    classification = 'SUSPICIOUS_UNVERIFIED';
    badgeColor = 'orange';
    recommendation = 'Unverified or missing standard registrations. Exercise caution and verify manufacturer hologram.';
  } else {
    classification = 'HIGH_RISK_COUNTERFEIT';
    badgeColor = 'red';
    recommendation = 'High probability of counterfeit, fake barcode, or tampered label. File a report.';
  }

  return {
    score: finalScore,
    classification,
    badgeColor,
    recommendation,
    riskFlags,
    breakdown
  };
}

module.exports = {
  analyzeShelfLife,
  analyzeBatchCode,
  computeAuthenticityScore
};
