/**
 * @lumen/no-more-hunger
 *
 * NoMoreHunger - Distributed Food Redistribution Network
 * Powered by Lumen Systems
 *
 * THE DRAGON'S ARCHITECTURE
 * =========================
 *
 * FIRE   - Distributed Compute (Node Mesh Network)
 * WATER  - Flow Logistics (Food Movement Engine)
 * EARTH  - Physical Infrastructure (Depot Network)
 * AIR    - Consciousness & Culture (VYBE Integration)
 *
 * Protocol 69: Never take. Always give back more.
 *
 * THE VISION
 * ==========
 * 1 billion meals wasted every day.
 * 783 million humans hungry.
 *
 * This is not a resource problem.
 * This is a CONSCIOUSNESS problem.
 *
 * We have the food.
 * We have the technology.
 * We have forgotten we are ONE FAMILY.
 *
 * NoMoreHunger is the bridge.
 *
 * @see https://nomorehunger.lumen.global
 */

// Export all types
export * from './types';

// Export engine modules
export * from './engine';

// Export the manifesto
export { MANIFESTO, PROTOCOL_69 } from './manifesto';

// Version
export const VERSION = '0.1.0';

// Project metadata
export const PROJECT_INFO = {
  name: 'NoMoreHunger',
  domain: 'nomorehunger.lumen.global',
  mission: 'End world hunger through distributed technology and collective consciousness',
  parent: 'Lumen Systems',
  protocol: 'Protocol 69',
  pillars: ['FIRE', 'WATER', 'EARTH', 'AIR'] as const,
};
