// @ts-check
const { test, expect } = require('@playwright/test');
const { calculateSize } = require('../../engine/SizingEngine');

/**
 * Recalibration Tests
 * 
 * When user provides dress size AND measurements, and they conflict:
 *   - Default: trust measurement (no recalibration)
 *   - Alternative: trust dress size / fitting data (recalibrate band)
 * 
 * Key finding from Task 3 prototype:
 *   Recalibration changes the band → cup reference changes → different result
 *   e.g., UB 90cm, OB 100cm, dress UK 12:
 *     Trust measurement → 36D
 *     Trust dress → 34DD (different band = different cup calc base)
 */
test.describe('Recalibration — dress size conflict handling', () => {

  test('no conflict — dress matches measurement → same result', () => {
    // UB 80cm → band 32, dress UK 10 → band 32 → no conflict
    const result = calculateSize({
      underbust_cm: 80, overbust_cm: 95, dress_size: 'UK 10',
    });
    expect(result.band).toBe(32);
    expect(result.recalibrated).toBe(false);
  });

  test('conflict detected — default trust measurement', () => {
    // UB 80cm → band 32, dress UK 16 → band 38 → conflict (diff = 6 > 2)
    const result = calculateSize({
      underbust_cm: 80, overbust_cm: 95, dress_size: 'UK 16',
    });
    expect(result.band).toBe(32);
    expect(result.recalibrated).toBe(false);
  });

  test('conflict — recalibrate to dress size', () => {
    const result = calculateSize(
      { underbust_cm: 80, overbust_cm: 95, dress_size: 'UK 16' },
      'UK',
      { recalibrate: true },
    );
    expect(result.band).toBe(38);
    expect(result.recalibrated).toBe(true);
  });

  test('Task 3 User 1: UB 90, OB 100, UK 12 → trust measure → 36C', () => {
    // Dress UK 12 → band 34, measure → band 36. Diff=2 not > 2 → no conflict
    const result = calculateSize({
      underbust_cm: 90, overbust_cm: 100, dress_size: 'UK 12',
    });
    expect(result.full_size).toBe('36C');
  });

  test('Task 3 User 1: with conflict dress UK 16 → recalibrated → 38AA', () => {
    // UB 80cm → band 32, dress UK 16 → band 38, diff=6 > 2 → conflict → recalibrate
    const result = calculateSize(
      { underbust_cm: 80, overbust_cm: 95, dress_size: 'UK 16' },
      'UK',
      { recalibrate: true },
    );
    expect(result.band).toBe(38);
  });

  test('Task 3 User 3: UB 80, OB 95, UK 16 → trust measure → 32DD', () => {
    // UB 80 → band 32, dress 16 → band 38 → big conflict
    const result = calculateSize({
      underbust_cm: 80, overbust_cm: 95, dress_size: 'UK 16',
    });
    expect(result.band).toBe(32);
    expect(result.recalibrated).toBe(false);
  });

  test('Task 3 User 3: recalibrated → 38A (prototype confirmed)', () => {
    // Recal band = 38, cup = overbust_inch - 38
    // 95cm = 37.4" → 37.4 - 38 = -0.6 → round to -1 → clamp to 0 → AA
    const result = calculateSize(
      { underbust_cm: 80, overbust_cm: 95, dress_size: 'UK 16' },
      'UK',
      { recalibrate: true },
    );
    expect(result.band).toBe(38);
    expect(result.recalibrated).toBe(true);
  });

  test('no dress size provided — no recalibration possible', () => {
    const result = calculateSize({ underbust_cm: 80, overbust_cm: 95 });
    expect(result.recalibrated).toBe(false);
  });

  test('skip recalibration option overrides conflict', () => {
    const result = calculateSize(
      { underbust_cm: 80, overbust_cm: 95, dress_size: 'UK 16' },
      'UK',
      { skipRecalibration: true },
    );
    expect(result.recalibrated).toBe(false);
  });
});
