/**
 * Property-Based Testing Configuration
 * Uses fast-check for invariant validation (≥ 1000 iterations)
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.property.spec.ts'],
    globals: true,
    environment: 'node'
  }
});
