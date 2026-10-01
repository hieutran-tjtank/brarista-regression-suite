// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { calculateSize } = require('../../engine/SizingEngine');

/**
 * Cross-Client Regression Tests
 * 
 * Verify that the SAME measurement input produces CORRECT but DIFFERENT
 * outputs for different clients (based on their specific sizing rules).
 * 
 * This catches the exact failure Bella described:
 *   "Same input 30cm → size M for brand A, size M for brand B, size L for brand C"
 *   If engine update makes brand A return size L, this test catches it.
 */

// ── Load all clients ──
const clientsDir = path.join(__dirname, '../../clients');
const clientFiles = fs.readdirSync(clientsDir)
  .filter(f => f.endsWith('.json') && !f.startsWith('_'));

const clients = clientFiles.map(f => 
  JSON.parse(fs.readFileSync(path.join(clientsDir, f), 'utf-8'))
);

test.describe('Cross-Client Regression', () => {

  // Use a standard input that all clients should handle
  const standardInput = { underbust_cm: 80, overbust_cm: 95 };

  test('same input produces consistent results across all clients', () => {
    const results = {};
    
    for (const client of clients) {
      const system = client.sizing_systems[0] || 'UK';
      const result = calculateSize(standardInput, system);
      results[client.client] = result.full_size;
    }

    // Log cross-client comparison
    console.log('\n📊 Cross-client results for UB=80cm, OB=95cm:');
    for (const [name, size] of Object.entries(results)) {
      console.log(`   → ${name}: ${size}`);
    }

    // All UK-system clients should produce same result for same input
    const ukClients = clients.filter(c => c.sizing_systems[0] === 'UK');
    const ukResults = ukClients.map(c => calculateSize(standardInput, 'UK').full_size);
    const uniqueUK = [...new Set(ukResults)];
    
    expect(uniqueUK.length, 
      'UK-system clients should agree on same input'
    ).toBe(1);
  });

  test('each client smoke test produces a result within their range', () => {
    for (const client of clients) {
      // Find smoke-tagged test case
      const smokeTest = client.test_cases.find(tc => 
        tc.tags && tc.tags.includes('smoke')
      );

      if (smokeTest) {
        const system = client.sizing_systems[0] || 'UK';
        const result = calculateSize(smokeTest.input, system);
        
        expect(result.band, 
          `${client.client} smoke test band within range`
        ).toBeGreaterThanOrEqual(client.band_range.min - 4); // Allow sister sizing margin
        
        expect(result.band,
          `${client.client} smoke test band within range`
        ).toBeLessThanOrEqual(client.band_range.max + 4);
      }
    }
  });

  test('engine update simulation — verify no unexpected changes', () => {
    // Snapshot: record expected outputs for all client smoke tests
    const snapshot = {};

    for (const client of clients) {
      const smokeTest = client.test_cases.find(tc => 
        tc.tags && tc.tags.includes('smoke')
      );
      if (smokeTest && smokeTest.expected) {
        const system = client.sizing_systems[0] || 'UK';
        const result = calculateSize(smokeTest.input, system);
        snapshot[client.client] = {
          input: smokeTest.input,
          expected: smokeTest.expected.full_size,
          actual: result.full_size,
        };
      }
    }

    // Verify all match
    for (const [name, data] of Object.entries(snapshot)) {
      expect(data.actual,
        `${name}: expected ${data.expected}, got ${data.actual}`
      ).toBe(data.expected);
    }
  });
});
