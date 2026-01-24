/**
 * @lumen/create-destroy
 *
 * CREATE → DESTROY (L2P) - A physics sandbox where creation meets destruction.
 *
 * "A minimalist sandbox where players build structures specifically to watch
 * them collapse, because destruction is a natural continuation of creation."
 *
 * Core Loop:
 * 1. Create quickly
 * 2. Trigger destruction (Explode, Stress Test, Entropy)
 * 3. Replay the collapse with slow-mo and free camera
 * 4. Reset and do it again
 *
 * No winning. No punishment. No grind.
 * Just the poetry of physics.
 */

// Main component
export { CreateDestroy, default } from './components/CreateDestroy';
export type { CreateDestroyProps } from './components/CreateDestroy';

// Core types and state management
export * from './core';

// Systems
export * from './systems';

// Components
export * from './components';

// Hooks
export * from './hooks';
