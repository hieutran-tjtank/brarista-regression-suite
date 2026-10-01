/**
 * ConversionRules.js
 * 
 * Constants and lookup tables for bra size conversion across international systems.
 * Based on publicly available sizing standards + Brarista take-home analysis findings.
 * 
 * KEY FINDING from take-home Task 3:
 *   Inch formula is canonical. Cup = overbust_inch − band_inch (round to nearest).
 *   cm-based calculation can produce different results due to range ambiguity.
 */

// Band conversion: cm underbust → band number (inches)
// Standard: round underbust to nearest even number
const CM_TO_BAND = {
  63: 28, 65: 28, 68: 30, 70: 30,
  73: 32, 75: 32, 78: 34, 80: 34,
  83: 36, 85: 36, 88: 38, 90: 38,
  93: 40, 95: 40, 98: 42, 100: 42,
  103: 44, 105: 44, 108: 46, 110: 46,
  113: 48, 115: 48, 118: 50, 120: 50,
};

// Band ranges: for each band, the cm range it covers [low, high]
const BAND_RANGES = {
  28: [63, 67],
  30: [68, 72],
  32: [73, 77],
  34: [78, 82],
  36: [83, 87],
  38: [88, 92],
  40: [93, 97],
  42: [98, 102],
  44: [103, 107],
  46: [108, 112],
  48: [113, 117],
  50: [118, 122],
};

// Cup progression by system
const CUP_SYSTEMS = {
  UK: ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'FF', 'G', 'GG', 'H', 'HH', 'J', 'JJ', 'K'],
  US: ['AA', 'A', 'B', 'C', 'D', 'DD/E', 'DDD/F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
  EU: ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
  FR: ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
  AU: ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'FF', 'G', 'GG', 'H', 'HH', 'J', 'JJ', 'K'],
  JP: ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
};

// EU/FR band offset: EU band = inch band + 15 (approx)
const BAND_OFFSETS = {
  UK: 0,   // Same as inch
  US: 0,   // Same as inch
  EU: 0,   // EU uses cm bands directly (65, 70, 75, ...)
  FR: 0,   // FR = EU
  AU: 0,   // AU = UK
  JP: 0,   // JP = similar to EU
};

// Dress size to approximate band mapping (UK)
const DRESS_TO_BAND_UK = {
  6: 28, 8: 30, 10: 32, 12: 34,
  14: 36, 16: 38, 18: 40, 20: 42,
  22: 44, 24: 46, 26: 48,
};

// Sister sizing: one band up = one cup down, one band down = one cup up
// Used when exact size unavailable in product range
const SISTER_SIZE_OFFSET = {
  bandUp: { band: +2, cupIndex: -1 },
  bandDown: { band: -2, cupIndex: +1 },
};

module.exports = {
  CM_TO_BAND,
  BAND_RANGES,
  CUP_SYSTEMS,
  BAND_OFFSETS,
  DRESS_TO_BAND_UK,
  SISTER_SIZE_OFFSET,
};
