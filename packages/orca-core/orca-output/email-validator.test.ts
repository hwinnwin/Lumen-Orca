import { describe, it, expect } from 'vitest';
import { validateEmail } from './email-validator';

describe('validateEmail', () => {
  it('validates correct email format', () => {
    expect(validateEmail('test@example.com').valid).toBe(true);
  });

  it('rejects empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email cannot be empty');
  });

  it('rejects missing @', () => {
    expect(validateEmail('testexample.com').valid).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(validateEmail('test@').valid).toBe(false);
  });

  it('accepts valid emails with subdomains', () => {
    expect(validateEmail('test@mail.example.com').valid).toBe(true);
  });

  it('handles whitespace', () => {
    expect(validateEmail('  test@example.com  ').valid).toBe(true);
  });
});