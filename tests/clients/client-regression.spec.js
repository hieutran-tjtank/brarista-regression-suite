// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { calculateSize } = require('../../engine/SizingEngine');

/**
 * Client Regression Tests
 * 
 * THE CORE OF THIS SUITE.
 * 
 * Automatically loads ALL client JSON configs from /clients/ and runs
 * every test case against the sizing engine.
 * 
 * When engine code changes → this suite catches regressions for ALL clients.
 * When onboarding new client → add JSON file → tests auto-include it.
 * 
 * This directly answers Bella's question:
 *   "How to ensure existing clients don't break when onboarding a new one?"
 */

// ── Load all client configs ──
const clientsDir = path.join(__dirname, '../../clients');
const clientFiles = fs.readdirSync(clientsDir)
  .filter(f => f.endsWith('.json') && !f.startsWith('_'));

// ── Run tests for each client ──
for (const file of clientFiles) {
  const clientData = JSON.parse(fs.readFileSync(path.join(clientsDir, file), 'utf-8'));
  const clientName = clientData.client;
  const market = clientData.market;

  test.describe(`Client: ${clientName} (${market})`, () => {

    // Smoke test: at least 1 test case exists
    test(`${clientName} has test cases defined`, () => {
      expect(clientData.test_cases.length).toBeGreaterThan(0);
    });

    // Run each test case
    for (const tc of clientData.test_cases) {
      const system = (clientData.sizing_systems && clientData.sizing_systems[0]) || 'UK';
      const options = tc.options || {};

      test(`${tc.id}: ${tc.description}`, async ({}, testInfo) => {
        const result = calculateSize(tc.input, system, options);

        // Attach details to report (visible even when pass)
        testInfo.annotations.push({
          type: 'Input',
          description: JSON.stringify(tc.input),
        });
        testInfo.annotations.push({
          type: 'Expected',
          description: tc.expected ? tc.expected.full_size : 'N/A',
        });
        testInfo.annotations.push({
          type: 'Actual',
          description: result.full_size,
        });

        // Verify expected output
        if (tc.expected) {
          if (tc.expected.band !== undefined) {
            expect(result.band, `Band mismatch for ${tc.id}`).toBe(tc.expected.band);
          }
          if (tc.expected.cup !== undefined) {
            expect(result.cup, `Cup mismatch for ${tc.id}`).toBe(tc.expected.cup);
          }
          if (tc.expected.full_size !== undefined) {
            expect(result.full_size, `Full size mismatch for ${tc.id}`).toBe(tc.expected.full_size);
          }
        }
      });
    }

    // Verify client config has required fields
    test(`${clientName} config has required metadata`, () => {
      expect(clientData.client).toBeTruthy();
      expect(clientData.market).toBeTruthy();
      expect(clientData.sizing_systems).toBeTruthy();
      expect(Array.isArray(clientData.sizing_systems)).toBe(true);
      expect(clientData.band_range).toBeTruthy();
      expect(clientData.band_range.min).toBeLessThan(clientData.band_range.max);
    });
  });
}

// ── Summary ──
test.describe('Client Suite Summary', () => {
  test(`Total clients loaded: ${clientFiles.length}`, () => {
    expect(clientFiles.length).toBeGreaterThanOrEqual(1);
    console.log(`\n📊 Loaded ${clientFiles.length} client configs:`);
    for (const file of clientFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(clientsDir, file), 'utf-8'));
      console.log(`   → ${data.client} (${data.market}): ${data.test_cases.length} test cases`);
    }
  });
});
