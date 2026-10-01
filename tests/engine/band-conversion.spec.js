// @ts-check
const { test, expect } = require('@playwright/test');
const { calculateSize } = require('../../engine/SizingEngine');

/**
 * Band Conversion Tests
 * 
 * Verify the inch-based band calculation:
 *   1. Convert cm → inches
 *   2. Round up to next whole inch
 *   3. If odd, add 1 (always even)
 */
test.describe('Band Conversion — cm to band number', () => {

  test('standard underbust 80cm → band 32', () => {
    const result = calculateSize({ underbust_cm: 80, overbust_cm: 90 });
    expect(result.band).toBe(32);
  });

  test('standard underbust 85cm → band 34', () => {
    const result = calculateSize({ underbust_cm: 85, overbust_cm: 95 });
    expect(result.band).toBe(34);
  });

  test('standard underbust 90cm → band 36', () => {
    const result = calculateSize({ underbust_cm: 90, overbust_cm: 100 });
    expect(result.band).toBe(36);
  });

  test('boundary — underbust 63cm → smallest band', () => {
    const result = calculateSize({ underbust_cm: 63, overbust_cm: 75 });
    expect(result.band).toBe(26);
  });

  test('boundary — underbust 120cm → largest common band', () => {
    const result = calculateSize({ underbust_cm: 120, overbust_cm: 135 });
    expect(result.band).toBe(48);
  });

  test('odd inch result rounds to even — 75cm = 29.5" → ceil 30 → band 30', () => {
    const result = calculateSize({ underbust_cm: 75, overbust_cm: 85 });
    expect(result.band).toBe(30);
  });

  test('exact even inch — 81.28cm = 32" → band 32', () => {
    const result = calculateSize({ underbust_cm: 81.28, overbust_cm: 95 });
    expect(result.band).toBe(32);
  });

  test('direct inch input — 33" → ceil 33 = 33, odd → +1 = 34', () => {
    const result = calculateSize({ underbust_inch: 33, overbust_inch: 38 });
    expect(result.band).toBe(34);
  });

  test('direct inch input — 32" → even → band 32', () => {
    const result = calculateSize({ underbust_inch: 32, overbust_inch: 37 });
    expect(result.band).toBe(32);
  });

  test('fractional inch — 31.5" → ceil 32 → band 32', () => {
    const result = calculateSize({ underbust_inch: 31.5, overbust_inch: 36 });
    expect(result.band).toBe(32);
  });
});
