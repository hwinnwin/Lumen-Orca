```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NumberValidator,
  Calculator,
  AdditionService,
  ValidationResult,
  AdditionRequest,
  AdditionResponse,
  INumberValidator,
  ICalculator
} from './calculator';

describe('NumberValidator', () => {
  let validator: NumberValidator;

  beforeEach(() => {
    validator = new NumberValidator();
  });

  describe('validate', () => {
    it('should validate positive integers', () => {
      const result = validator.validate(42);
      expect(result).toEqual({ isValid: true, value: 42 });
    });

    it('should validate negative integers', () => {
      const result = validator.validate(-42);
      expect(result).toEqual({ isValid: true, value: -42 });
    });

    it('should validate zero', () => {
      const result = validator.validate(0);
      expect(result).toEqual({ isValid: true, value: 0 });
    });

    it('should validate decimal numbers', () => {
      const result = validator.validate(3.14);
      expect(result).toEqual({ isValid: true, value: 3.14 });
    });

    it('should validate numeric strings', () => {
      const result = validator.validate('123');
      expect(result).toEqual({ isValid: true, value: 123 });
    });

    it('should validate decimal strings', () => {
      const result = validator.validate('3.14');
      expect(result).toEqual({ isValid: true, value: 3.14 });
    });

    it('should validate negative string numbers', () => {
      const result = validator.validate('-42');
      expect(result).toEqual({ isValid: true, value: -42 });
    });

    it('should validate strings with whitespace', () => {
      const result = validator.validate('  123  ');
      expect(result).toEqual({ isValid: true, value: 123 });
    });

    it('should validate boolean true', () => {
      const result = validator.validate(true);
      expect(result).toEqual({ isValid: true, value: 1 });
    });

    it('should validate boolean false', () => {
      const result = validator.validate(false);
      expect(result).toEqual({ isValid: true, value: 0 });
    });

    it('should validate Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = validator.validate(date);
      expect(result).toEqual({ isValid: true, value: date.getTime() });
    });

    it('should reject null values', () => {
      const result = validator.validate(null);
      expect(result).toEqual({ isValid: false, error: 'Value cannot be null' });
    });

    it('should reject undefined values', () => {
      const result = validator.validate(undefined);
      expect(result).toEqual({ isValid: false, error: 'Value cannot be undefined' });
    });

    it('should reject NaN', () => {
      const result = validator.validate(NaN);
      expect(result).toEqual({ isValid: false, error: 'Value is NaN (Not a Number)' });
    });

    it('should reject positive infinity', () => {
      const result = validator.validate(Infinity);
      expect(result).toEqual({ isValid: false, error: 'Value is positive infinity' });
    });

    it('should reject negative infinity', () => {
      const result = validator.validate(-Infinity);
      expect(result).toEqual({ isValid: false, error: 'Value is negative infinity' });
    });

    it('should reject non-numeric strings', () => {
      const result = validator.validate('hello');
      expect(result).toEqual({ isValid: false, error: 'Value is not a valid number' });
    });

    it('should reject empty strings', () => {
      const result = validator.validate('');
      expect(result).toEqual({ isValid: false, error: 'Value is not a valid number' });
    });

    it('should reject whitespace-only strings', () => {
      const result = validator.validate('   ');
      expect(result).toEqual({ isValid: false, error: 'Value is not a valid number' });
    });

    it('should reject objects', () => {
      const result = validator.validate({});
      expect(result).toEqual({ isValid: false, error: 'Value is not a valid number' });
    });

    it('should reject arrays', () => {
      const result = validator.validate([]);
      expect(result).toEqual({ isValid: false, error: 'Value is not a valid number' });
    });

    it('should reject values exceeding MAX_SAFE_INTEGER', () => {
      const result = validator.validate(Number.MAX_SAFE_INTEGER + 1);
      expect(result).toEqual({ 
        isValid: false, 
        error: `Value exceeds maximum safe integer (${Number.MAX_SAFE_INTEGER})` 
      });
    });

    it('should reject values below MIN_SAFE_INTEGER', () => {
      const result = validator.validate(Number.MIN_SAFE_INTEGER - 1);
      expect(result).toEqual({ 
        isValid: false, 
        error: `Value is below minimum safe integer (${Number.MIN_SAFE_INTEGER})` 
      });
    });

    it('should handle validation errors gracefully', () => {
      const mockValidator = new NumberValidator();
      const originalConvertToNumber = (mockValidator as any).convertToNumber;
      
      (mockValidator as any).convertToNumber = vi.fn(() => {
        throw new Error('Conversion failed');
      });

      const result = mockValidator.validate('test');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Validation error: Conversion failed');
    });
  });

  describe('isNumeric', () => {
    it('should return true for valid numbers', () => {
      expect(validator.isNumeric(42)).toBe(true);
      expect(validator.isNumeric(-42)).toBe(true);
      expect(validator.isNumeric(0)).toBe(true);
      expect(validator.isNumeric(3.14)).toBe(true);
    });

    it('should return true for numeric strings', () => {
      expect(validator.isNumeric('42')).toBe(true);
      expect(validator.isNumeric('-42')).toBe(true);
      expect(validator.isNumeric('3.14')).toBe(true);
      expect(validator.isNumeric('0')).toBe(true);
    });

    it('should return true for booleans', () => {
      expect(validator.isNumeric(true)).toBe(true);
      expect(validator.isNumeric(false)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(validator.isNumeric(NaN)).toBe(false);
    });

    it('should return false for infinity', () => {
      expect(validator.isNumeric(Infinity)).toBe(false);
      expect(validator.isNumeric(-Infinity)).toBe(false);
    });

    it('should return false for non-numeric strings', () => {
      expect(validator.isNumeric('hello')).toBe(false);
      expect(validator.isNumeric('')).toBe(false);
      expect(validator.isNumeric('   ')).toBe(false);
    });

    it('should return false for objects and arrays', () => {
      expect(validator.isNumeric({})).toBe(false);
      expect(validator.isNumeric([])).toBe(false);
      expect(validator.isNumeric(null)).toBe(false);
      expect(validator.isNumeric(undefined)).toBe(false);
    });
  });

  describe('handleSpecialCases', () => {
    it('should handle valid numbers', () => {
      const result = validator.handleSpecialCases(42);
      expect(result).toEqual({ isValid: true, value: 42 });
    });

    it('should handle zero', () => {
      const result = validator.handleSpecialCases(0);
      expect(result).toEqual({ isValid: true, value: 0 });
    });

    it('should reject NaN', () => {
      const result = validator.handleSpecialCases(NaN);
      expect(result).toEqual({ isValid: false, error: 'Value is NaN (Not a Number)' });
    });

    it('should reject positive infinity', () => {
      const result = validator.handleSpecialCases(Infinity);
      expect(result).toEqual({ isValid: false, error: 'Value is positive infinity' });
    });

    it('should reject negative infinity', () => {
      const result = validator.handleSpecialCases(-Infinity);
      expect(result).toEqual({ isValid: false, error: 'Value is negative infinity' });
    });

    it('should reject values exceeding MAX_SAFE_INTEGER', () => {
      const result = validator.handleSpecialCases(Number.MAX_SAFE_INTEGER + 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum safe integer');
    });

    it('should reject values below MIN_SAFE_INTEGER', () => {
      const result = validator.handleSpecialCases(Number.MIN_SAFE_INTEGER - 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('below minimum safe integer');
    });
  });
});

describe('Calculator', () => {
  let calculator: Calculator;
  let mockValidator: INumberValidator;

  beforeEach(() => {
    mockValidator = {
      validate: vi.fn(),
      isNumeric: vi.fn(),
      handleSpecialCases: vi.fn()
    };
    calculator = new Calculator(mockValidator);
  });

  describe('constructor', () => {
    it('should use default validator when none provided', () => {
      const calc = new Calculator();
      expect(calc).toBeDefined();
    });

    it('should use provided validator', () => {
      const calc = new Calculator(mockValidator);
      expect(calc).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add two valid numbers', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: 5 })
        .mockReturnValueOnce({ isValid: true, value: 3 });

      const result = calculator.add(5, 3);
      expect(result).toBe(8);
    });

    it('should add zero values', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: 0 })
        .mockReturnValueOnce({ isValid: true, value: 0 });

      const result = calculator.add(0, 0);
      expect(result).toBe(0);
    });

    it('should add negative numbers', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: -5 })
        .mockReturnValueOnce({ isValid: true, value: -3 });

      const result = calculator.add(-5, -3);
      expect(result).toBe(-8);
    });

    it('should add positive and negative numbers', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: 5 })
        .mockReturnValueOnce({ isValid: true, value: -3 });

      const result = calculator.add(5, -3);
      expect(result).toBe(2);
    });

    it('should throw error when first operand is invalid', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: false, error: 'Invalid number' })
        .mockReturnValueOnce({ isValid: true, value: 3 });

      expect(() => calculator.add(NaN, 3)).toThrow('Invalid first operand: Invalid number');
    });

    it('should throw error when second operand is invalid', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: 5 })
        .mockReturnValueOnce({ isValid: false, error: 'Invalid number' });

      expect(() => calculator.add(5, NaN)).toThrow('Invalid second operand: Invalid number');
    });

    it('should throw error when both operands are invalid', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValue({ isValid: false, error: 'Invalid number' });

      expect(() => calculator.add(NaN, NaN)).toThrow('Invalid first operand: Invalid number');
    });

    it('should validate operands using the validator', () => {
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: 5 })
        .mockReturnValueOnce({ isValid: true, value: 3 });

      calculator.add(5, 3);
      
      expect(mockValidator.validate).toHaveBeenCalledTimes(2);
      expect(mockValidator.validate).toHaveBeenCalledWith(5);
      expect(mockValidator.validate).toHaveBeenCalledWith(3);
    });
  });
});

describe('AdditionService', () => {
  let additionService: AdditionService;
  let mockCalculator: ICalculator;
  let mockValidator: INumberValidator;

  beforeEach(() => {
    mockValidator = {
      validate: vi.fn(),
      isNumeric: vi.fn(),
      handleSpecialCases: vi.fn()
    };
    
    mockCalculator = {
      add: vi.fn()
    };
    
    additionService = new AdditionService(mockCalculator, mockValidator);
  });

  describe('constructor', () => {
    it('should use default dependencies when none provided', () => {
      const service = new AdditionService();
      expect(service).toBeDefined();
    });

    it('should use provided dependencies', () => {
      const service = new AdditionService(mockCalculator, mockValidator);
      expect(service).toBeDefined();
    });
  });

  describe('addNumbers - AdditionRequest overload', () => {
    it('should add numbers from valid request', () => {
      const request: AdditionRequest = { operand1: 5, operand2: 3 };
      
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: 5 })
        .mockReturnValueOnce({ isValid: true, value: 3 });
      mockCalculator.add = vi.fn().mockReturnValue(8);

      const result = additionService.addNumbers(request);
      
      expect(result).toEqual({ isValid: true, result: 8 });
      expect(mockValidator.validate).toHaveBeenCalledWith(5);
      expect(mockValidator.validate).toHaveBeenCalledWith(3);
      expect(mockCalculator.add).toHaveBeenCalledWith(5, 3);
    });

    it('should handle string numbers in request', () => {
      const request: AdditionRequest = { operand1: '5', operand2: '3' };
      
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: true, value: 5 })
        .mockReturnValueOnce({ isValid: true, value: 3 });
      mockCalculator.add = vi.fn().mockReturnValue(8);

      const result = additionService.addNumbers(request);
      
      expect(result).toEqual({ isValid: true, result: 8 });
    });

    it('should return error when first operand is invalid', () => {
      const request: AdditionRequest = { operand1: null, operand2: 3 };
      
      mockValidator.validate = vi.fn()
        .mockReturnValueOnce({ isValid: false, error: 'Value cannot be null' })
        .mockReturn