// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // Run tests in parallel for speed
  fullyParallel: true,
  
  // Fail the build on CI if test.only is left in code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests once on CI (flaky protection)
  retries: process.env.CI ? 1 : 0,
  
  // Use all available CPU cores on CI
  workers: process.env.CI ? '50%' : undefined,
  
  // Reporter: HTML for local review, line for CI
  reporter: process.env.CI 
    ? [['line'], ['html', { outputFolder: 'reports', open: 'never' }]]
    : [['html', { outputFolder: 'reports', open: 'on-failure' }]],
  
  // No browser needed — these are logic tests, not E2E
  // Using default (no browser project) = runs as Node.js tests
  use: {
    // No browser config needed for unit/logic tests
  },

  // Test categorization via projects
  projects: [
    {
      name: 'engine',
      testDir: './tests/engine',
      testMatch: '*.spec.js',
    },
    {
      name: 'clients',
      testDir: './tests/clients',
      testMatch: '*.spec.js',
    },
    {
      name: 'onboarding',
      testDir: './tests/onboarding',
      testMatch: '*.spec.js',
    },
  ],
});
