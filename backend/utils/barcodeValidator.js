/**
 * GS1 Barcode Validator and Checksum Calculator
 * 
 * Verifies standard commercial barcode formats (EAN-13, UPC-A, EAN-8)
 * using the official GS1 Modulo 10 algorithm. Also decodes GS1 Country
 * prefixes to detect geographical mismatches.
 */

// Official GS1 Country Prefix Database
const GS1_PREFIX_MAP = [
  { min: "000", max: "139", country: "United States & Canada (UPC-A)" },
  { min: "300", max: "379", country: "France" },
  { min: "380", max: "380", country: "Bulgaria" },
  { min: "383", max: "383", country: "Slovenia" },
  { min: "385", max: "385", country: "Croatia" },
  { min: "400", max: "440", country: "Germany" },
  { min: "450", max: "459", country: "Japan" },
  { min: "460", max: "469", country: "Russia" },
  { min: "471", max: "471", country: "Taiwan" },
  { min: "480", max: "480", country: "Philippines" },
  { min: "489", max: "489", country: "Hong Kong" },
  { min: "490", max: "499", country: "Japan" },
  { min: "500", max: "509", country: "United Kingdom" },
  { min: "520", max: "521", country: "Greece" },
  { min: "535", max: "535", country: "Malta" },
  { min: "539", max: "539", country: "Ireland" },
  { min: "540", max: "549", country: "Belgium & Luxembourg" },
  { min: "560", max: "560", country: "Portugal" },
  { min: "570", max: "579", country: "Denmark, Faroe Islands, Greenland" },
  { min: "590", max: "590", country: "Poland" },
  { min: "600", max: "601", country: "South Africa" },
  { min: "603", max: "603", country: "Ghana" },
  { min: "615", max: "615", country: "Nigeria" },
  { min: "619", max: "619", country: "Tunisia" },
  { min: "621", max: "621", country: "Syria" },
  { min: "622", max: "622", country: "Egypt" },
  { min: "640", max: "649", country: "Finland" },
  { min: "690", max: "699", country: "China" },
  { min: "700", max: "709", country: "Norway" },
  { min: "729", max: "729", country: "Israel" },
  { min: "730", max: "739", country: "Sweden" },
  { min: "750", max: "750", country: "Mexico" },
  { min: "760", max: "769", country: "Switzerland" },
  { min: "770", max: "771", country: "Colombia" },
  { min: "779", max: "779", country: "Argentina" },
  { min: "780", max: "780", country: "Chile" },
  { min: "789", max: "790", country: "Brazil" },
  { min: "800", max: "839", country: "Italy" },
  { min: "840", max: "849", country: "Spain" },
  { min: "850", max: "850", country: "Cuba" },
  { min: "870", max: "879", country: "Netherlands" },
  { min: "880", max: "880", country: "South Korea" },
  { min: "884", max: "884", country: "Cambodia" },
  { min: "885", max: "885", country: "Thailand" },
  { min: "888", max: "888", country: "Singapore" },
  { min: "890", max: "890", country: "India" },
  { min: "893", max: "893", country: "Vietnam" },
  { min: "899", max: "899", country: "Indonesia" },
  { min: "900", max: "919", country: "Austria" },
  { min: "930", max: "939", country: "Australia" },
  { min: "940", max: "949", country: "New Zealand" },
  { min: "955", max: "955", country: "Malaysia" }
];

/**
 * Calculates GS1 Modulo 10 check digit for any numeric barcode string (excluding the last digit).
 * In GS1 standards:
 * Counting from right to left (excluding the check digit):
 * - Alternate weights of 3 and 1
 */
function calculateGS1CheckDigit(digitsWithoutCheck) {
  let sum = 0;
  const len = digitsWithoutCheck.length;

  for (let i = len - 1; i >= 0; i--) {
    const digit = parseInt(digitsWithoutCheck[i], 10);
    if (isNaN(digit)) return null;

    // From rightmost preceding digit, odd positions from right get weight 3, even get 1
    const positionFromRight = len - i;
    const weight = positionFromRight % 2 === 1 ? 3 : 1;
    sum += digit * weight;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Looks up GS1 prefix country
 */
function lookupGS1Country(barcode) {
  if (!barcode || barcode.length < 3) return "Unknown / Unassigned Prefix";
  const prefix3 = barcode.substring(0, 3);
  const prefixNum = parseInt(prefix3, 10);

  if (isNaN(prefixNum)) return "Non-numeric prefix";

  for (const item of GS1_PREFIX_MAP) {
    const minNum = parseInt(item.min, 10);
    const maxNum = parseInt(item.max, 10);
    if (prefixNum >= minNum && prefixNum <= maxNum) {
      return item.country;
    }
  }

  return "Global / Regional GS1 Member Organization";
}

/**
 * Validates any barcode and returns structured integrity report
 */
function validateBarcode(barcode) {
  if (!barcode) {
    return {
      isValidFormat: false,
      isValidChecksum: false,
      detectedFormat: 'EMPTY',
      reason: 'No barcode provided'
    };
  }

  const cleanBarcode = String(barcode).trim().replace(/\s+/g, '');
  const isNumeric = /^\d+$/.test(cleanBarcode);

  // If not all numeric (e.g. Code 39 or Code 128 alpha)
  if (!isNumeric) {
    return {
      cleanBarcode,
      isValidFormat: cleanBarcode.length >= 4,
      isValidChecksum: true, // Non-EAN/UPC alphanumeric codes have differing checksums
      detectedFormat: 'CODE_128_OR_CUSTOM',
      originCountry: 'Custom / Proprietary Format',
      notes: 'Non-standard GS1 barcode. Internal manufacturer or inventory code.'
    };
  }

  const len = cleanBarcode.length;
  let detectedFormat = 'UNKNOWN_NUMERIC';
  let isCheckDigitValid = false;
  let calculatedCheck = null;
  let providedCheck = null;

  if (len === 13) {
    detectedFormat = 'EAN-13';
    const body = cleanBarcode.substring(0, 12);
    providedCheck = parseInt(cleanBarcode[12], 10);
    calculatedCheck = calculateGS1CheckDigit(body);
    isCheckDigitValid = calculatedCheck === providedCheck;
  } else if (len === 12) {
    detectedFormat = 'UPC-A';
    const body = cleanBarcode.substring(0, 11);
    providedCheck = parseInt(cleanBarcode[11], 10);
    calculatedCheck = calculateGS1CheckDigit(body);
    isCheckDigitValid = calculatedCheck === providedCheck;
  } else if (len === 8) {
    detectedFormat = 'EAN-8';
    const body = cleanBarcode.substring(0, 7);
    providedCheck = parseInt(cleanBarcode[7], 10);
    calculatedCheck = calculateGS1CheckDigit(body);
    isCheckDigitValid = calculatedCheck === providedCheck;
  } else if (len === 14) {
    detectedFormat = 'ITF-14 / GTIN-14';
    const body = cleanBarcode.substring(0, 13);
    providedCheck = parseInt(cleanBarcode[13], 10);
    calculatedCheck = calculateGS1CheckDigit(body);
    isCheckDigitValid = calculatedCheck === providedCheck;
  } else {
    detectedFormat = `NUMERIC_${len}_DIGIT`;
    // Non-standard length might still be valid proprietary barcode
    isCheckDigitValid = true;
  }

  const originCountry = lookupGS1Country(cleanBarcode);

  return {
    cleanBarcode,
    detectedFormat,
    isValidFormat: true,
    isValidChecksum: isCheckDigitValid,
    calculatedCheckDigit: calculatedCheck,
    providedCheckDigit: providedCheck,
    originCountry,
    hasChecksumAnomaly: !isCheckDigitValid
  };
}

module.exports = {
  validateBarcode,
  calculateGS1CheckDigit,
  lookupGS1Country
};
