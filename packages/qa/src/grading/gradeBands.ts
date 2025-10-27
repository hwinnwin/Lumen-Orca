/**
 * Letter grade band definitions for Lumen metrics
 * Frontend-safe public display with backend precision maintained
 */

export type LetterGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D' | 'F';

export interface GradeBand {
  grade: LetterGrade;
  color: string;
  description: string;
}

export interface MetricThresholds {
  coverage: { min: number; max: number };
  mutation: { min: number; max: number };
  determinism: { min: number; max: number };
  flake: { min: number; max: number };
  reliability: { min: number; max: number };
}

export const GRADE_BANDS: Record<LetterGrade, GradeBand> = {
  'AAA': { grade: 'AAA', color: 'hsl(var(--primary))', description: 'Exceptional' },
  'AA': { grade: 'AA', color: 'hsl(var(--primary))', description: 'Excellent' },
  'A': { grade: 'A', color: 'hsl(var(--primary))', description: 'Strong' },
  'BBB': { grade: 'BBB', color: 'hsl(var(--warning))', description: 'Good' },
  'BB': { grade: 'BB', color: 'hsl(var(--warning))', description: 'Adequate' },
  'B': { grade: 'B', color: 'hsl(var(--warning))', description: 'Acceptable' },
  'C': { grade: 'C', color: 'hsl(var(--destructive))', description: 'Marginal' },
  'D': { grade: 'D', color: 'hsl(var(--destructive))', description: 'Poor' },
  'F': { grade: 'F', color: 'hsl(var(--destructive))', description: 'Failing' },
};

export const METRIC_THRESHOLDS: Record<LetterGrade, MetricThresholds> = {
  'AAA': {
    coverage: { min: 95, max: 100 },
    mutation: { min: 0.90, max: 1.0 },
    determinism: { min: 99.99, max: 100 },
    flake: { min: 0, max: 0.10 },
    reliability: { min: 0, max: 1e-6 },
  },
  'AA': {
    coverage: { min: 90, max: 95 },
    mutation: { min: 0.87, max: 0.90 },
    determinism: { min: 99.9, max: 99.99 },
    flake: { min: 0.10, max: 0.50 },
    reliability: { min: 1e-6, max: 1e-5 },
  },
  'A': {
    coverage: { min: 85, max: 90 },
    mutation: { min: 0.80, max: 0.87 },
    determinism: { min: 99.5, max: 99.9 },
    flake: { min: 0.50, max: 1.0 },
    reliability: { min: 1e-5, max: 1e-4 },
  },
  'BBB': {
    coverage: { min: 80, max: 85 },
    mutation: { min: 0.75, max: 0.80 },
    determinism: { min: 99.0, max: 99.5 },
    flake: { min: 1.0, max: 2.0 },
    reliability: { min: 1e-4, max: 1e-3 },
  },
  'BB': {
    coverage: { min: 75, max: 80 },
    mutation: { min: 0.70, max: 0.75 },
    determinism: { min: 98.0, max: 99.0 },
    flake: { min: 2.0, max: 5.0 },
    reliability: { min: 1e-3, max: 1e-2 },
  },
  'B': {
    coverage: { min: 70, max: 75 },
    mutation: { min: 0.65, max: 0.70 },
    determinism: { min: 97.0, max: 98.0 },
    flake: { min: 5.0, max: 10.0 },
    reliability: { min: 1e-2, max: 1e-1 },
  },
  'C': {
    coverage: { min: 60, max: 70 },
    mutation: { min: 0.50, max: 0.65 },
    determinism: { min: 95.0, max: 97.0 },
    flake: { min: 10.0, max: 20.0 },
    reliability: { min: 1e-1, max: 1 },
  },
  'D': {
    coverage: { min: 40, max: 60 },
    mutation: { min: 0.30, max: 0.50 },
    determinism: { min: 90.0, max: 95.0 },
    flake: { min: 20.0, max: 40.0 },
    reliability: { min: 1, max: 10 },
  },
  'F': {
    coverage: { min: 0, max: 40 },
    mutation: { min: 0, max: 0.30 },
    determinism: { min: 0, max: 90.0 },
    flake: { min: 40.0, max: 100 },
    reliability: { min: 10, max: 1000 },
  },
};
