/**
 * Six-Nines Calculation
 * F_total = 1 - Π(1 - Fᵢ) where Fᵉ is individual failure probability
 * Target: F_total ≤ 10⁻⁶ (99.9999% reliability)
 */

export function fTotal(probabilities: number[]): number {
  // F_total = 1 - Π(1 - Fᵢ)
  return 1 - probabilities.reduce((product, failureProb) => {
    return product * (1 - failureProb);
  }, 1);
}

export function isSixNines(fTotalValue: number): boolean {
  return fTotalValue <= 1e-6;
}

export interface ReliabilityMetrics {
  fTotal: number;
  passRate: number;
  flakeRate: number;
  mutationScore: number;
  coverage: number;
}

export function calculateReliability(metrics: {
  unitTestFailures: number;
  propertyTestFailures: number;
  flakes: number;
  totalTests: number;
  mutantsSurvived: number;
  totalMutants: number;
  linesCovered: number;
  totalLines: number;
}): ReliabilityMetrics {
  const unitFailProb = metrics.unitTestFailures / metrics.totalTests;
  const propertyFailProb = metrics.propertyTestFailures / metrics.totalTests;
  const flakeRate = metrics.flakes / metrics.totalTests;
  const mutationScore = 1 - (metrics.mutantsSurvived / metrics.totalMutants);
  const coverage = metrics.linesCovered / metrics.totalLines;

  const fTotalValue = fTotal([unitFailProb, propertyFailProb, flakeRate]);

  return {
    fTotal: fTotalValue,
    passRate: 1 - fTotalValue,
    flakeRate,
    mutationScore,
    coverage
  };
}
