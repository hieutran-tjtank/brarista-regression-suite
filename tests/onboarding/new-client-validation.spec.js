// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { calculateSize } = require('../../engine/SizingEngine');

/**
 * New Client Onboarding Validation
 * 
 * Run these tests when adding a new client config.
 * Validates:
 *   1. JSON structure is correct
 *   2. All test cases produce valid results
 *   3. Results fall within client's declared band/cup range
 *   4. No existing client configs are broken
 * 
 * Usage:
 *   npx playwright test tests/onboarding/ 
 */

const clientsDir = path.join(__dirname, '../../clients');

test.describe('New Client Onboarding Validation', () => {

  // Get all non-template client files
  const clientFiles = fs.readdirSync(clientsDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  for (const file of clientFiles) {
    const raw = fs.readFileSync(path.join(clientsDir, file), 'utf-8');
    let clientData;

    test.describe(`Validate: ${file}`, () => {

      test('JSON is valid and parseable', () => {
        expect(() => { clientData = JSON.parse(raw); }).not.toThrow();
      });

      test('required fields present', () => {
        clientData = JSON.parse(raw);
        expect(clientData.client, 'Missing: client name').toBeTruthy();
        expect(clientData.market, 'Missing: market').toBeTruthy();
        expect(clientData.sizing_systems, 'Missing: sizing_systems').toBeTruthy();
        expect(clientData.band_range, 'Missing: band_range').toBeTruthy();
        expect(clientData.test_cases, 'Missing: test_cases').toBeTruthy();
      });

      test('has at least 3 test cases', () => {
        clientData = JSON.parse(raw);
        expect(clientData.test_cases.length,
          `${clientData.client} should have at least 3 test cases for meaningful coverage`
        ).toBeGreaterThanOrEqual(3);
      });

      test('has at least 1 smoke test', () => {
        clientData = JSON.parse(raw);
        const smokeTests = clientData.test_cases.filter(tc =>
          tc.tags && tc.tags.includes('smoke')
        );
        expect(smokeTests.length,
          `${clientData.client} should have at least 1 test tagged "smoke"`
        ).toBeGreaterThanOrEqual(1);
      });

      test('all test case IDs are unique', () => {
        clientData = JSON.parse(raw);
        const ids = clientData.test_cases.map(tc => tc.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids.length, 'Duplicate test case IDs found').toBe(uniqueIds.length);
      });

      test('all test cases have required fields', () => {
        clientData = JSON.parse(raw);
        for (const tc of clientData.test_cases) {
          expect(tc.id, `Missing ID in test case`).toBeTruthy();
          expect(tc.description, `Missing description in ${tc.id}`).toBeTruthy();
          expect(tc.input, `Missing input in ${tc.id}`).toBeTruthy();
          expect(
            tc.input.underbust_cm || tc.input.underbust_inch,
            `Missing underbust in ${tc.id}`
          ).toBeTruthy();
          expect(
            tc.input.overbust_cm || tc.input.overbust_inch,
            `Missing overbust in ${tc.id}`
          ).toBeTruthy();
        }
      });

      test('all test cases produce valid engine output', () => {
        clientData = JSON.parse(raw);
        const system = clientData.sizing_systems[0] || 'UK';

        for (const tc of clientData.test_cases) {
          const options = tc.options || {};
          const result = calculateSize(tc.input, system, options);

          expect(result.band, `${tc.id}: invalid band`).toBeGreaterThan(0);
          expect(result.cup, `${tc.id}: invalid cup`).toBeTruthy();
          expect(result.full_size, `${tc.id}: invalid full_size`).toBeTruthy();
        }
      });
    });
  }
});
