/**
 * Allergens & Harmful Food Additives Knowledge Base
 * 
 * Provides verified data for the 14 international major allergens
 * and high-to-moderate risk food preservatives and synthetic colorants.
 */

const MAJOR_ALLERGENS = [
  { id: 'gluten', name: 'Gluten / Wheat', keywords: ['gluten', 'wheat', 'barley', 'rye', 'spelt', 'oats', 'ble', 'blé', 'farine'] },
  { id: 'milk', name: 'Milk & Dairy (Lactose)', keywords: ['milk', 'lait', 'dairy', 'lactose', 'whey', 'casein', 'butter', 'cream', 'fromage', 'cheese'] },
  { id: 'peanuts', name: 'Peanuts', keywords: ['peanut', 'peanuts', 'arachide', 'cacahuete', 'cacahuète', 'groundnut'] },
  { id: 'treenuts', name: 'Tree Nuts', keywords: ['tree nut', 'almond', 'walnut', 'hazelnut', 'cashew', 'pistachio', 'pecan', 'noisette', 'noix', 'amande'] },
  { id: 'eggs', name: 'Eggs', keywords: ['egg', 'eggs', 'oeuf', 'oeufs', 'albumen', 'yolk', 'lysozyme'] },
  { id: 'soybeans', name: 'Soybeans / Soy', keywords: ['soy', 'soya', 'soybean', 'soja', 'edamame', 'tofu', 'lecithin (soy)'] },
  { id: 'fish', name: 'Fish', keywords: ['fish', 'poisson', 'salmon', 'tuna', 'cod', 'anchovy', 'anchois'] },
  { id: 'crustaceans', name: 'Crustaceans', keywords: ['crustacean', 'shrimp', 'crab', 'lobster', 'prawn', 'crevette', 'homard', 'langoustine'] },
  { id: 'molluscs', name: 'Molluscs', keywords: ['mollusc', 'mollusk', 'clam', 'mussel', 'squid', 'octopus', 'oyster', 'moule', 'huitre'] },
  { id: 'celery', name: 'Celery', keywords: ['celery', 'celeri', 'céleri', 'celeriac'] },
  { id: 'mustard', name: 'Mustard', keywords: ['mustard', 'moutarde'] },
  { id: 'sesame', name: 'Sesame Seeds', keywords: ['sesame', 'sésame', 'tahini'] },
  { id: 'sulphites', name: 'Sulphur Dioxide / Sulphites', keywords: ['sulphite', 'sulfite', 'sulphur dioxide', 'e220', 'e221', 'e222', 'e223', 'e224', 'e228'] },
  { id: 'lupin', name: 'Lupin', keywords: ['lupin', 'lupine'] }
];

const HARMFUL_ADDITIVES = {
  'en:e102': { name: 'Tartrazine (Yellow 5 / E102)', risk: 'HIGH', reason: 'Azo dye linked to hyperactivity (ADHD) in children, asthma triggers, and skin hives.' },
  'en:e110': { name: 'Sunset Yellow FCF (Yellow 6 / E110)', risk: 'HIGH', reason: 'Associated with severe allergic hives, gastric upset, and banned in certain European foods.' },
  'en:e129': { name: 'Allura Red AC (Red 40 / E129)', risk: 'HIGH', reason: 'Artificial petroleum-based dye linked to hypersensitivity, hyperactivity, and inflammatory gut markers.' },
  'en:e133': { name: 'Brilliant Blue FCF (Blue 1 / E133)', risk: 'MODERATE', reason: 'Synthetic colorant with potential neurotoxic flags and prohibited in specific infant nutrition.' },
  'en:e150d': { name: 'Ammonia Caramel (Caramel IV / E150d)', risk: 'MODERATE', reason: 'Contains 4-methylimidazole (4-MEI), a chemical flagged as a potential carcinogen in high exposure.' },
  'en:e171': { name: 'Titanium Dioxide (E171)', risk: 'HIGH', reason: 'Banned in the European Union (2022) due to DNA damage/genotoxicity concerns.' },
  'en:e211': { name: 'Sodium Benzoate (E211)', risk: 'HIGH', reason: 'Can react with Vitamin C (ascorbic acid) to produce benzene, a known human carcinogen.' },
  'en:e220': { name: 'Sulfur Dioxide (E220)', risk: 'MODERATE', reason: 'Strong respiratory irritant that can trigger acute bronchospasms in asthmatics.' },
  'en:e223': { name: 'Sodium Metabisulphite (E223)', risk: 'MODERATE', reason: 'May provoke severe allergic bronchial spasms and destroys Vitamin B1 in food.' },
  'en:e250': { name: 'Sodium Nitrite (E250)', risk: 'HIGH', reason: 'Preservative in cured meats; converts to carcinogenic nitrosamines when heated in digestion.' },
  'en:e251': { name: 'Sodium Nitrate (E251)', risk: 'HIGH', reason: 'Precursor to carcinogenic nitrosamines and correlated with colorectal cancer risk.' },
  'en:e320': { name: 'Butylated Hydroxyanisole (BHA / E320)', risk: 'HIGH', reason: 'Synthetic antioxidant classified as possibly carcinogenic and an endocrine disruptor.' },
  'en:e321': { name: 'Butylated Hydroxytoluene (BHT / E321)', risk: 'MODERATE', reason: 'Synthetic preservative linked to endocrine disruption and allergic dermatitis.' },
  'en:e621': { name: 'Monosodium Glutamate (MSG / E621)', risk: 'LOW-MODERATE', reason: 'Flavor enhancer that triggers headaches, flushing, and sweating in sensitive individuals.' },
  'en:e951': { name: 'Aspartame (E951)', risk: 'HIGH', reason: 'Artificial sweetener classified by WHO/IARC as possibly carcinogenic (Group 2B) and unsafe for phenylketonuria sufferers.' },
  'en:e952': { name: 'Cyclamate (E952)', risk: 'HIGH', reason: 'Banned by US FDA due to suspected bladder carcinogenicity.' },
  'en:e954': { name: 'Saccharin (E954)', risk: 'MODERATE', reason: 'Artificial sweetener linked to gut microbiome imbalances and historical cancer concerns.' },
  'en:e924a': { name: 'Potassium Bromate (E924)', risk: 'CRITICAL', reason: 'Dough conditioner banned in EU, Canada, Brazil, and China; classified as a Group 2B carcinogen.' }
};

/**
 * Extracts and categorizes allergens from tags and ingredients text
 */
function extractAllergens(allergensTags = [], ingredientsText = '', userSensitivities = []) {
  const detectedAllergens = new Set();
  const personalAlerts = [];

  // 1. Process OpenFoodFacts allergen tags (e.g. "en:peanuts", "en:gluten")
  for (const tag of allergensTags) {
    const cleanTag = tag.replace(/^([a-z]{2}):/, '').toLowerCase().replace(/[-_]/g, ' ');
    for (const allergen of MAJOR_ALLERGENS) {
      if (allergen.keywords.some(kw => cleanTag.includes(kw))) {
        detectedAllergens.add(allergen.name);
      }
    }
  }

  // 2. Scan ingredients text for hidden allergen keywords
  if (ingredientsText) {
    const lowerText = ingredientsText.toLowerCase();
    for (const allergen of MAJOR_ALLERGENS) {
      if (allergen.keywords.some(kw => {
        // Match word boundaries
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(lowerText);
      })) {
        detectedAllergens.add(allergen.name);
      }
    }
  }

  const detectedList = Array.from(detectedAllergens);

  // 3. Match against user's specific allergy profile
  if (Array.isArray(userSensitivities) && userSensitivities.length > 0) {
    const userSensLower = userSensitivities.map(s => String(s).toLowerCase().trim());
    for (const detected of detectedList) {
      for (const userSens of userSensLower) {
        if (detected.toLowerCase().includes(userSens) || userSens.includes(detected.toLowerCase())) {
          personalAlerts.push(detected);
        }
      }
    }
  }

  return {
    detectedAllergens: detectedList,
    personalAlerts,
    hasPersonalAllergyConflict: personalAlerts.length > 0
  };
}

/**
 * Flags harmful additives from additives tags and ingredient text
 */
function analyzeHarmfulAdditives(additivesTags = [], ingredientsText = '') {
  const flagged = [];
  const seenCodes = new Set();

  for (const rawTag of additivesTags) {
    const norm = rawTag.toLowerCase().trim();
    if (HARMFUL_ADDITIVES[norm] && !seenCodes.has(norm)) {
      seenCodes.add(norm);
      flagged.push({
        code: norm.replace(/^en:/, '').toUpperCase(),
        ...HARMFUL_ADDITIVES[norm]
      });
    }
  }

  // Also check ingredients text for common E-numbers (e.g. E102, E211, E250)
  if (ingredientsText) {
    for (const [key, details] of Object.entries(HARMFUL_ADDITIVES)) {
      if (!seenCodes.has(key)) {
        const eCode = key.replace(/^en:/, '').toLowerCase(); // e.g. e102
        const regex = new RegExp(`\\b${eCode}\\b`, 'i');
        if (regex.test(ingredientsText)) {
          seenCodes.add(key);
          flagged.push({
            code: eCode.toUpperCase(),
            ...details
          });
        }
      }
    }
  }

  return {
    flaggedAdditives: flagged,
    totalFlagged: flagged.length,
    highRiskCount: flagged.filter(a => a.risk === 'HIGH' || a.risk === 'CRITICAL').length
  };
}

module.exports = {
  MAJOR_ALLERGENS,
  HARMFUL_ADDITIVES,
  extractAllergens,
  analyzeHarmfulAdditives
};
