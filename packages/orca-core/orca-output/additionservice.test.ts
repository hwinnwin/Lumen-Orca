```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  NumberValidator,
  Calculator,
  AdditionService,
  ValidationResult,
  AdditionRequest,
  AdditionResponse
} from './addition-service';

describe('NumberValidator', () => {
  let validator: NumberValidator;

  beforeEach(() => {
    validator = new NumberValidator();
  });

  describe('isNumeric', () => {
    it('should return true for valid integers', () => {
      expect(validator.isNumeric(42)).toBe(true);
      expect(validator.isNumeric(0)).toBe(true);
      expect(validator.isNumeric(-42)).toBe(true);
    });

    it('should return true for valid floats', () => {
      expect(validator.isNumeric(3.14)).toBe(true);
      expect(validator.isNumeric(-3.14)).toBe(true);
      expect(validator.isNumeric(0.5)).toBe(true);
    });

    it('should return true for numeric strings', () => {
      expect(validator.isNumeric('42')).toBe(true);
      expect(validator.isNumeric('-42')).toBe(true);
      expect(validator.isNumeric('3.14')).toBe(true);
      expect(validator.isNumeric('0')).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(validator.isNumeric(null)).toBe(false);
      expect(validator.isNumeric(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validator.isNumeric('')).toBe(false);
    });

    it('should return false for boolean values', () => {
      expect(validator.isNumeric(true)).toBe(false);
      expect(validator.isNumeric(false)).toBe(false);
    });

    it('should return false for non-numeric strings', () => {
      expect(validator.isNumeric('abc')).toBe(false);
      expect(validator.isNumeric('12abc')).toBe(false);
      expect(validator.isNumeric('abc12')).toBe(false);
    });

    it('should return false for objects and arrays', () => {
      expect(validator.isNumeric({})).toBe(false);
      expect(validator.isNumeric([])).toBe(false);
      expect(validator.isNumeric([1, 2, 3])).toBe(false);
    });

    it('should return false for NaN and Infinity', () => {
      expect(validator.isNumeric(NaN)).toBe(false);
      expect(validator.isNumeric(Infinity)).toBe(false);
      expect(validator.isNumeric(-Infinity)).toBe(false);
    });
  });

  describe('handleSpecialCases', () => {
    it('should return valid for normal numbers', () => {
      const result = validator.handleSpecialCases(42);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for Infinity', () => {
      const result = validator.handleSpecialCases(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: Infinite values are not supported');
    });

    it('should return invalid for negative Infinity', () => {
      const result = validator.handleSpecialCases(-Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: Infinite values are not supported');
    });

    it('should return invalid for numbers exceeding MAX_SAFE_INTEGER', () => {
      const result = validator.handleSpecialCases(Number.MAX_SAFE_INTEGER + 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: Number exceeds safe integer range');
    });

    it('should return invalid for numbers below negative MAX_SAFE_INTEGER', () => {
      const result = validator.handleSpecialCases(-Number.MAX_SAFE_INTEGER - 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: Number exceeds safe integer range');
    });

    it('should return valid for MAX_SAFE_INTEGER boundary', () => {
      const result = validator.handleSpecialCases(Number.MAX_SAFE_INTEGER);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for negative MAX_SAFE_INTEGER boundary', () => {
      const result = validator.handleSpecialCases(-Number.MAX_SAFE_INTEGER);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validate', () => {
    it('should return valid for valid numbers', () => {
      const result = validator.validate(42);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for numeric strings', () => {
      const result = validator.validate('42');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for non-numeric values', () => {
      const result = validator.validate('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: "abc" is not a valid number');
    });

    it('should return invalid for null', () => {
      const result = validator.validate(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: null is not a valid number');
    });

    it('should return invalid for undefined', () => {
      const result = validator.validate(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: undefined is not a valid number');
    });

    it('should return invalid for boolean values', () => {
      const result = validator.validate(true);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: true is not a valid number');
    });

    it('should handle special cases for valid numbers', () => {
      const result = validator.validate(Infinity.toString());
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid input: Infinite values are not supported');
    });
  });
});

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('should add two negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    it('should add positive and negative numbers', () => {
      expect(calculator.add(5, -3)).toBe(2);
      expect(calculator.add(-5, 3)).toBe(-2);
    });

    it('should add zero to a number', () => {
      expect(calculator.add(5, 0)).toBe(5);
      expect(calculator.add(0, 5)).toBe(5);
    });

    it('should add decimal numbers', () => {
      expect(calculator.add(0.1, 0.2)).toBeCloseTo(0.3);
      expect(calculator.add(1.5, 2.5)).toBe(4);
    });

    it('should handle large numbers', () => {
      const large1 = 999999999999;
      const large2 = 111111111111;
      expect(calculator.add(large1, large2)).toBe(1111111111110);
    });
  });
});

describe('AdditionService', () => {
  let additionService: AdditionService;
  let validator: NumberValidator;
  let calculator: Calculator;

  beforeEach(() => {
    validator = new NumberValidator();
    calculator = new Calculator();
    additionService = new AdditionService(validator, calculator);
  });

  describe('addNumbers with AdditionRequest object', () => {
    it('should successfully add two valid numbers', () => {
      const request: AdditionRequest = { a: 2, b: 3 };
      const result = additionService.addNumbers(request);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
      expect(result.error).toBeUndefined();
    });

    it('should successfully add numeric strings', () => {
      const request: AdditionRequest = { a: '2', b: '3' };
      const result = additionService.addNumbers(request);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid first operand', () => {
      const request: AdditionRequest = { a: 'abc', b: 3 };
      const result = additionService.addNumbers(request);
      
      expect(result.success).toBe(false);
      expect(result.result).toBeUndefined();
      expect(result.error).toBe('Invalid input: "abc" is not a valid number');
    });

    it('should return error for invalid second operand', () => {
      const request: AdditionRequest = { a: 2, b: 'xyz' };
      const result = additionService.addNumbers(request);
      
      expect(result.success).toBe(false);
      expect(result.result).toBeUndefined();
      expect(result.error).toBe('Invalid input: "xyz" is not a valid number');
    });

    it('should return error for null operands', () => {
      const request: AdditionRequest = { a: null, b: 3 };
      const result = additionService.addNumbers(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input: null is not a valid number');
    });

    it('should return error for undefined operands', () => {
      const request: AdditionRequest = { a: 2, b: undefined };
      const result = additionService.addNumbers(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input: undefined is not a valid number');
    });
  });

  describe('addNumbers with direct parameters', () => {
    it('should successfully add two valid numbers', () => {
      const result = additionService.addNumbers(2, 3);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
      expect(result.error).toBeUndefined();
    });

    it('should successfully add negative numbers', () => {
      const result = additionService.addNumbers(-2, -3);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(-5);
      expect(result.error).toBeUndefined();
    });

    it('should successfully add decimal numbers', () => {
      const result = additionService.addNumbers(1.5, 2.5);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(4);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid first parameter', () => {
      const result = additionService.addNumbers('abc' as any, 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input: "abc" is not a valid number');
    });

    it('should return error for invalid second parameter', () => {
      const result = additionService.addNumbers(2, 'xyz' as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input: "xyz" is not a valid number');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very large numbers within safe integer range', () => {
      const large1 = Number.MAX_SAFE_INTEGER - 1;
      const large2 = 1;
      const result = additionService.addNumbers(large1, large2);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should return error for numbers exceeding safe integer range', () => {
      const request: AdditionRequest = { a: Number.MAX_SAFE_INTEGER + 1, b: 1 };
      const result = additionService.addNumbers(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input: Number exceeds safe integer range');
    });

    it('should return error when result exceeds safe integer range', () => {
      const large1 = Number.MAX_SAFE_INTEGER;
      const large2 = 1;
      const result = additionService.addNumbers(large1, large2);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Calculation error:');
    });

    it('should return error for Infinity input', () => {
      const result = additionService.addNumbers(Infinity, 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input: Infinite values are not supported');
    });

    it('should handle zero addition correctly', () => {
      const result = additionService.addNumbers(0, 0);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(0);
    });

    it('should handle boolean inputs as invalid', () => {
      const result = additionService.addNumbers(true as any, false as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input: true is not a valid number');
    });

    it('should handle array inputs as invalid', () => {
      const result = additionService.addNumbers([1, 2] as any, 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('is not a valid number');
    });

    it('should handle object inputs as invalid', () => {
      const result = additionService.addNumbers({ value: 1 } as any, 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('is not a valid number');
    });
  });

  describe('exception handling', () => {
    it('should handle unexpected errors gracefully', () => {
      const mockValidator = {
        validate: () => {
          throw new Error('Validation failed');
        },
        isNumeric: () => true,
        handleSpecialCases: () => ({ isValid: true })
      };
      
      const serviceWithMockValidator = new AdditionService(mockValidator, calculator);
      const result = serviceWithMockValidator.addNumbers(1, 2);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error: Validation failed');
    });

    it('should handle non-Error exceptions', () => {
      const mockValidator = {
        validate: () => {
          throw 'String error';
        },
        isNumeric: () => true,
        handleSpecialCases: () => ({ isValid: true })
      };
      
      const serviceWithMockValidator = new AdditionService(mockValidator, calculator);
      const result = serviceWithMockValidator.addNumbers(1, 2);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error: Unknown error');
    });
  });

  describe('integration tests', () => {
    it('should perform end-to-end addition with request object', () => {
      const request: AdditionRequest = { a: '10.5', b: '20.3