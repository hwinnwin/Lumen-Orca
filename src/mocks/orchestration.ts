/**
 * Mock orchestration data for development and demo
 * Keeps the dashboard alive with stable data when no backend is configured
 */

export const mockAgents = [
  { id: "A1", name: "Spec", status: "running", progress: 0.62 },
  { id: "A3", name: "Contracts", status: "queued", progress: 0.00 },
  { id: "A4", name: "Generator", status: "running", progress: 0.41 },
  { id: "A5", name: "Test", status: "blocked", progress: 0.12 }
] as const;

export const mockEdges = [
  { from: "A1", to: "A3" },
  { from: "A3", to: "A4" },
  { from: "A4", to: "A5" }
] as const;

export const mockMetrics = {
  determinism: 0.99992,
  mutationCritical: 0.81,
  coverageCritical: 0.96,
  flakeRate: 0.0007,
  fTotal: 8.2e-7 // make the badge flip when you improve tests
};
