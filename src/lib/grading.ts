export type LetterGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D' | 'F';

export interface RawMetrics {
  coverage: number;
  mutation: number;
  determinism: number;
  flake: number;
  reliability: number; // F_total
}

export interface GradedMetrics {
  coverage: LetterGrade;
  mutation: LetterGrade;
  determinism: LetterGrade;
  flake: LetterGrade;
  reliability: LetterGrade;
  overall: LetterGrade;
}

function getGradeForMetric(value: number, metricName: keyof RawMetrics): LetterGrade {
  // Coverage
  if (metricName === 'coverage') {
    if (value >= 95) return 'AAA';
    if (value >= 90) return 'AA';
    if (value >= 85) return 'A';
    if (value >= 80) return 'BBB';
    if (value >= 75) return 'BB';
    if (value >= 70) return 'B';
    if (value >= 60) return 'C';
    if (value >= 40) return 'D';
    return 'F';
  }
  
  // Mutation
  if (metricName === 'mutation') {
    if (value >= 0.90) return 'AAA';
    if (value >= 0.87) return 'AA';
    if (value >= 0.80) return 'A';
    if (value >= 0.75) return 'BBB';
    if (value >= 0.70) return 'BB';
    if (value >= 0.65) return 'B';
    if (value >= 0.50) return 'C';
    if (value >= 0.30) return 'D';
    return 'F';
  }
  
  // Determinism
  if (metricName === 'determinism') {
    if (value >= 99.99) return 'AAA';
    if (value >= 99.9) return 'AA';
    if (value >= 99.5) return 'A';
    if (value >= 99.0) return 'BBB';
    if (value >= 98.0) return 'BB';
    if (value >= 97.0) return 'B';
    if (value >= 95.0) return 'C';
    if (value >= 90.0) return 'D';
    return 'F';
  }
  
  // Flake (lower is better)
  if (metricName === 'flake') {
    if (value <= 0.10) return 'AAA';
    if (value <= 0.50) return 'AA';
    if (value <= 1.0) return 'A';
    if (value <= 2.0) return 'BBB';
    if (value <= 5.0) return 'BB';
    if (value <= 10.0) return 'B';
    if (value <= 20.0) return 'C';
    if (value <= 40.0) return 'D';
    return 'F';
  }
  
  // Reliability (lower is better)
  if (metricName === 'reliability') {
    if (value <= 1e-6) return 'AAA';
    if (value <= 1e-5) return 'AA';
    if (value <= 1e-4) return 'A';
    if (value <= 1e-3) return 'BBB';
    if (value <= 1e-2) return 'BB';
    if (value <= 1e-1) return 'B';
    if (value <= 1) return 'C';
    if (value <= 10) return 'D';
    return 'F';
  }
  
  return 'F';
}

function getOverallGrade(grades: Omit<GradedMetrics, 'overall'>): LetterGrade {
  const gradeValues: Record<LetterGrade, number> = {
    'AAA': 9, 'AA': 8, 'A': 7, 'BBB': 6, 'BB': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1
  };
  
  const reverseMap: Record<number, LetterGrade> = {
    9: 'AAA', 8: 'AA', 7: 'A', 6: 'BBB', 5: 'BB', 4: 'B', 3: 'C', 2: 'D', 1: 'F'
  };
  
  const values = Object.values(grades).map(g => gradeValues[g as LetterGrade]);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  
  return reverseMap[avg] || 'F';
}

export function applyGrades(raw: RawMetrics): GradedMetrics {
  const componentGrades = {
    coverage: getGradeForMetric(raw.coverage, 'coverage'),
    mutation: getGradeForMetric(raw.mutation, 'mutation'),
    determinism: getGradeForMetric(raw.determinism, 'determinism'),
    flake: getGradeForMetric(raw.flake, 'flake'),
    reliability: getGradeForMetric(raw.reliability, 'reliability'),
  };
  
  return {
    ...componentGrades,
    overall: getOverallGrade(componentGrades),
  };
}

export const GRADE_COLORS: Record<LetterGrade, { color: string; description: string }> = {
  'AAA': { color: 'hsl(var(--primary))', description: 'Exceptional' },
  'AA': { color: 'hsl(var(--primary))', description: 'Excellent' },
  'A': { color: 'hsl(var(--primary))', description: 'Strong' },
  'BBB': { color: 'hsl(var(--warning))', description: 'Good' },
  'BB': { color: 'hsl(var(--warning))', description: 'Adequate' },
  'B': { color: 'hsl(var(--warning))', description: 'Acceptable' },
  'C': { color: 'hsl(var(--destructive))', description: 'Marginal' },
  'D': { color: 'hsl(var(--destructive))', description: 'Poor' },
  'F': { color: 'hsl(var(--destructive))', description: 'Failing' },
};
