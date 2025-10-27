import { LetterGrade, METRIC_THRESHOLDS } from './gradeBands';

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
  const grades: LetterGrade[] = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D', 'F'];
  
  // For flake and reliability, lower is better
  const isLowerBetter = metricName === 'flake' || metricName === 'reliability';
  
  for (const grade of grades) {
    const threshold = METRIC_THRESHOLDS[grade][metricName];
    
    if (isLowerBetter) {
      if (value <= threshold.max) {
        return grade;
      }
    } else {
      if (value >= threshold.min) {
        return grade;
      }
    }
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
