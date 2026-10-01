/**
 * SizingEngine.js
 * 
 * Simulates Brarista's Global Sizing Engine.
 * 
 * CORE PRINCIPLE (from take-home Task 3 prototype investigation):
 *   The engine uses INCH-based calculation internally.
 *   cm inputs are converted to inches first, then processed.
 *   cup = overbust_inch − band_inch (round to nearest whole number)
 * 
 * This is a simulation for TESTING PURPOSES.
 * Real engine behavior is confirmed through test data in client JSON files.
 */

const {
  CM_TO_BAND,
  BAND_RANGES,
  CUP_SYSTEMS,
  DRESS_TO_BAND_UK,
  SISTER_SIZE_OFFSET,
} = require('./ConversionRules');

const CM_PER_INCH = 2.54;

/**
 * Calculate bra size from body measurements.
 * 
 * @param {Object} input - Measurement input
 * @param {number} input.underbust_cm - Underbust measurement in cm
 * @param {number} input.overbust_cm - Overbust measurement in cm
 * @param {number} [input.underbust_inch] - Underbust in inches (optional, auto-convert from cm)
 * @param {number} [input.overbust_inch] - Overbust in inches (optional, auto-convert from cm)
 * @param {string} [input.dress_size] - Dress size for recalibration (e.g., "UK 12")
 * @param {string} system - Sizing system to use ('UK', 'US', 'EU', etc.)
 * @param {Object} [options] - Calculation options
 * @param {boolean} [options.recalibrate] - Force recalibration path
 * @returns {Object} Calculated size result
 */
function calculateSize(input, system = 'UK', options = {}) {
  // Step 1: Convert to inches (canonical unit)
  const underbustInch = input.underbust_inch || input.underbust_cm / CM_PER_INCH;
  const overbustInch = input.overbust_inch || input.overbust_cm / CM_PER_INCH;

  // Step 2: Calculate band
  // Inch rule: round underbust up to next whole inch, if odd add 1
  let bandInch = Math.ceil(underbustInch);
  if (bandInch % 2 !== 0) bandInch += 1;

  // Step 3: Check recalibration
  let needsRecalibration = false;
  let recalBand = bandInch;

  if (input.dress_size && !options.skipRecalibration) {
    const dressMatch = input.dress_size.match(/(\d+)/);
    if (dressMatch) {
      const dressNum = parseInt(dressMatch[1]);
      const dressBand = DRESS_TO_BAND_UK[dressNum];

      if (dressBand && Math.abs(dressBand - bandInch) > 2) {
        // Conflict: measurement band differs from dress size band by more than 1 band
        if (options.recalibrate || options.trustDressSize) {
          // Recalibration path: trust dress size / fitting data
          needsRecalibration = true;
          recalBand = dressBand;
        }
        // Default: trust measurement (no recalibration)
      }
    }
  }

  const finalBand = needsRecalibration ? recalBand : bandInch;

  // Step 4: Calculate cup
  // Inch formula: cup = overbust_inch − band (round to nearest)
  const cupDiff = overbustInch - finalBand;
  const cupIndex = Math.round(cupDiff);

  // Step 5: Map cup index to cup letter
  const cupList = CUP_SYSTEMS[system] || CUP_SYSTEMS['UK'];
  const clampedIndex = Math.max(0, Math.min(cupIndex, cupList.length - 1));
  const cupLetter = cupList[clampedIndex];

  return {
    band: finalBand,
    cup: cupLetter,
    full_size: `${finalBand}${cupLetter}`,
    system,
    recalibrated: needsRecalibration,
    debug: {
      underbust_inch: Math.round(underbustInch * 10) / 10,
      overbust_inch: Math.round(overbustInch * 10) / 10,
      band_before_recal: bandInch,
      cup_diff: Math.round(cupDiff * 10) / 10,
      cup_index: cupIndex,
    },
  };
}

/**
 * Calculate sister sizes (one band up + one band down).
 * 
 * @param {string} size - Original size (e.g., "36D")
 * @param {string} system - Sizing system
 * @returns {Object} Sister sizes
 */
function getSisterSizes(size, system = 'UK') {
  const match = size.match(/^(\d+)(.+)$/);
  if (!match) return null;

  const band = parseInt(match[1]);
  const cup = match[2];
  const cupList = CUP_SYSTEMS[system] || CUP_SYSTEMS['UK'];
  const cupIdx = cupList.indexOf(cup);

  if (cupIdx === -1) return null;

  const sisters = {};

  // Band up, cup down
  const upIdx = cupIdx + SISTER_SIZE_OFFSET.bandUp.cupIndex;
  if (upIdx >= 0) {
    sisters.bandUp = `${band + SISTER_SIZE_OFFSET.bandUp.band}${cupList[upIdx]}`;
  }

  // Band down, cup up
  const downIdx = cupIdx + SISTER_SIZE_OFFSET.bandDown.cupIndex;
  if (downIdx < cupList.length) {
    sisters.bandDown = `${band + SISTER_SIZE_OFFSET.bandDown.band}${cupList[downIdx]}`;
  }

  return sisters;
}

/**
 * Convert size between systems.
 * 
 * @param {string} size - Size string (e.g., "36D")
 * @param {string} fromSystem - Source system
 * @param {string} toSystem - Target system
 * @returns {string} Converted size
 */
function convertSize(size, fromSystem, toSystem) {
  const match = size.match(/^(\d+)(.+)$/);
  if (!match) return null;

  const band = parseInt(match[1]);
  const cup = match[2];

  // Get cup index in source system
  const fromCups = CUP_SYSTEMS[fromSystem];
  const toCups = CUP_SYSTEMS[toSystem];

  if (!fromCups || !toCups) return null;

  const cupIdx = fromCups.indexOf(cup);
  if (cupIdx === -1) return null;

  // Map to target system
  const targetCup = cupIdx < toCups.length ? toCups[cupIdx] : toCups[toCups.length - 1];

  // Band conversion (EU/FR use different numbering)
  let targetBand = band;
  if ((toSystem === 'EU' || toSystem === 'FR') && (fromSystem === 'UK' || fromSystem === 'US')) {
    targetBand = Math.round(band * CM_PER_INCH / 5) * 5; // Convert to nearest 5cm
  } else if ((fromSystem === 'EU' || fromSystem === 'FR') && (toSystem === 'UK' || toSystem === 'US')) {
    targetBand = Math.round(targetBand / CM_PER_INCH / 2) * 2; // Convert back to even inches
  }

  return `${targetBand}${targetCup}`;
}

module.exports = {
  calculateSize,
  getSisterSizes,
  convertSize,
};
