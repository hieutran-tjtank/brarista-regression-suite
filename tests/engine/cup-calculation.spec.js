// @ts-check
const { test, expect } = require('@playwright/test');
const { calculateSize } = require('../../engine/SizingEngine');

/**
 * Cup Calculation Tests
 * 
 * CORE RULE (from take-home Task 3):
 *   cup_index = round(overbust_inch − band_inch)
 *   Map cup_index → cup letter using system-specific progression
 * 
 * Key insight: inch formula is canonical. cm calculation produces different
 * results in edge cases due to range ambiguity.
 */
test.describe('Cup Calculation — inch formula', () => {

  test('cup diff 0 → AA', () => {
    const result = calculateSize({ underbust_inch: 32, overbust_inch: 32 });
    expect(result.cup).toBe('AA');
  });

  test('cup diff 1 → A', () => {
    const result = calculateSize({ underbust_inch: 32, overbust_inch: 33 });
    expect(result.cup).toBe('A');
  });

  test('cup diff 2 → B', () => {
    const result = calculateSize({ underbust_inch: 34, overbust_inch: 36 });
    expect(result.cup).toBe('B');
  });

  test('cup diff 3 → C', () => {
    const result = calculateSize({ underbust_inch: 34, overbust_inch: 37 });
    expect(result.cup).toBe('C');
  });

  test('cup diff 4 → D', () => {
    const result = calculateSize({ underbust_inch: 34, overbust_inch: 38 });
    expect(result.cup).toBe('D');
  });

  test('cup diff 5 → DD (UK system)', () => {
    const result = calculateSize({ underbust_inch: 32, overbust_inch: 37 }, 'UK');
    expect(result.cup).toBe('DD');
  });

  test('cup diff 5 → DD/E (US system)', () => {
    const result = calculateSize({ underbust_inch: 32, overbust_inch: 37 }, 'US');
    expect(result.cup).toBe('DD/E');
  });

  test('cup diff 6 → E (UK)', () => {
    const result = calculateSize({ underbust_inch: 32, overbust_inch: 38 }, 'UK');
    expect(result.cup).toBe('E');
  });

  test('cup diff 7 → F (UK)', () => {
    const result = calculateSize({ underbust_inch: 34, overbust_inch: 41 }, 'UK');
    expect(result.cup).toBe('F');
  });

  test('cup diff 8 → FF (UK) — double letter', () => {
    const result = calculateSize({ underbust_inch: 34, overbust_inch: 42 }, 'UK');
    expect(result.cup).toBe('FF');
  });

  test('fractional diff 4.7 → round to 5 → DD', () => {
    // This is the key finding from Task 3: round-to-nearest, NOT floor
    // 33.5 → ceil 34, 38.7 - 34 = 4.7 → round 5 → DD
    const result = calculateSize({ underbust_inch: 33.5, overbust_inch: 38.7 }, 'UK');
    expect(result.cup).toBe('DD');
  });

  test('fractional diff 4.3 → round to 4 → D', () => {
    const result = calculateSize({ underbust_inch: 33.7, overbust_inch: 38 }, 'UK');
    expect(result.cup).toBe('D');
  });

  // cm-based input (converts to inch internally)
  test('cm input: 80/95 → 32DD (UK)', () => {
    // 80cm=31.5" → band 32, 95cm=37.4", diff=5.4 → round 5 → DD
    const result = calculateSize({ underbust_cm: 80, overbust_cm: 95 }, 'UK');
    expect(result.full_size).toBe('32DD');
  });

  test('cm input: 80/100 → 32F (UK)', () => {
    // 80cm=31.5" → band 32, 100cm=39.4", diff=7.4 → round 7 → F
    const result = calculateSize({ underbust_cm: 80, overbust_cm: 100 }, 'UK');
    expect(result.full_size).toBe('32F');
  });

  test('cm input: 85/97 → inch conversion matches', () => {
    const result = calculateSize({ underbust_cm: 85, overbust_cm: 97 }, 'UK');
    // 85cm = 33.46" → ceil 34 → band 34
    // 97cm = 38.19" → cup = 38.19 - 34 = 4.19 → round 4 → D
    expect(result.band).toBe(34);
    expect(result.cup).toBe('D');
  });  // This one is correct as-is
});
