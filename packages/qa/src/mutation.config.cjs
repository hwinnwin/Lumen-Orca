/**
 * Stryker Mutation Testing Configuration
 * Target: ≥ 80% mutation score
 */

module.exports = {
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts'
  ],
  testRunner: 'vitest',
  reporters: ['html', 'json', 'clear-text', 'progress'],
  coverageAnalysis: 'perTest',
  thresholds: {
    high: 80,
    low: 60,
    break: 80
  },
  mutator: {
    plugins: ['@stryker-mutator/typescript-checker'],
    excludedMutations: []
  }
};
