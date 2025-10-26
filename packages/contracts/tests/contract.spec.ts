import { describe, test, expect } from 'vitest';
import type { Entry, Event, Session, QualityGate } from '../src/index';

describe('@lumen/contracts', () => {
  test('Entry contract', () => {
    const entry: Entry = {
      id: 'test-1',
      timestamp: new Date().toISOString(),
      type: 'build',
      payload: { status: 'success' }
    };
    expect(entry.id).toBe('test-1');
  });

  test('QualityGate contract', () => {
    const gate: QualityGate = {
      name: 'mutation-score',
      threshold: 0.80,
      actual: 0.85,
      passed: true
    };
    expect(gate.passed).toBe(true);
  });
});
