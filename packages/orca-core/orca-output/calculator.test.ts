```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ValidationResult,
  AdditionRequest,
  AdditionResponse,
  INumberValidator,
  ICalculator,
  CalculationError,
  NumberValidator,
  Calculator,
  AdditionService,
  CalculatorFactory
} from './calculator';

describe('CalculationError', () => {
  it('should create error with message and code', () => {
    const error = new CalculationError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('CalculationError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('NumberValidator', () => {
  let validator: NumberValidator;

  beforeEach(() => {
    validator = new NumberValidator();
  });

  describe('validate', () => {
    it('should validate valid integer', () => {
      const result = validator.validate(42);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(42);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid float', () => {
      const result = validator.validate(3.14);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(3.14);
    });

    it('should validate negative numbers', () => {
      const result = validator.validate(-42);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(-42);
    });

    it('should validate zero', () => {
      const result = validator.validate(0);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(0);
    });

    it('should validate numeric strings', () => {
      const result = validator.validate('42');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(42);
    });

    it('should validate float strings', () => {
      const result = validator.validate('3.14');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(3.14);
    });

    it('should reject null', () => {
      const result = validator.validate(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value cannot be null or undefined');
      expect(result.sanitizedValue).toBeUndefined();
    });

    it('should reject undefined', () => {
      const result = validator.validate(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value cannot be null or undefined');
    });

    it('should reject non-numeric strings', () => {
      const result = validator.validate('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value is not numeric');
    });

    it('should reject objects', () => {
      const result = validator.validate({});
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value is not numeric');
    });

    it('should reject arrays', () => {
      const result = validator.validate([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value is not numeric');
    });

    it('should reject booleans', () => {
      const result = validator.validate(true);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value is not numeric');
    });

    it('should reject NaN', () => {
      const result = validator.validate(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value is NaN');
    });

    it('should reject Infinity', () => {
      const result = validator.validate(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be finite');
    });

    it('should reject -Infinity', () => {
      const result = validator.validate(-Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be finite');
    });

    it('should reject string NaN', () => {
      const result = validator.validate('NaN');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value is NaN');
    });
  });

  describe('isNumeric', () => {
    it('should return true for number types', () => {
      expect(validator.isNumeric(42)).toBe(true);
      expect(validator.isNumeric(0)).toBe(true);
      expect(validator.isNumeric(-42)).toBe(true);
      expect(validator.isNumeric(3.14)).toBe(true);
      expect(validator.isNumeric(NaN)).toBe(true);
      expect(validator.isNumeric(Infinity)).toBe(true);
    });

    it('should return true for numeric strings', () => {
      expect(validator.isNumeric('42')).toBe(true);
      expect(validator.isNumeric('0')).toBe(true);
      expect(validator.isNumeric('-42')).toBe(true);
      expect(validator.isNumeric('3.14')).toBe(true);
      expect(validator.isNumeric('1e10')).toBe(true);
    });

    it('should return false for non-numeric strings', () => {
      expect(validator.isNumeric('abc')).toBe(false);
      expect(validator.isNumeric('')).toBe(false);
      expect(validator.isNumeric(' ')).toBe(false);
      expect(validator.isNumeric('42px')).toBe(false);
    });

    it('should return false for non-numeric types', () => {
      expect(validator.isNumeric(null)).toBe(false);
      expect(validator.isNumeric(undefined)).toBe(false);
      expect(validator.isNumeric({})).toBe(false);
      expect(validator.isNumeric([])).toBe(false);
      expect(validator.isNumeric(true)).toBe(false);
      expect(validator.isNumeric(false)).toBe(false);
    });
  });

  describe('handleSpecialCases', () => {
    it('should accept finite numbers', () => {
      const result = validator.handleSpecialCases(42);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(42);
    });

    it('should reject NaN', () => {
      const result = validator.handleSpecialCases(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value is NaN');
    });

    it('should reject Infinity', () => {
      const result = validator.handleSpecialCases(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be finite');
    });

    it('should reject -Infinity', () => {
      const result = validator.handleSpecialCases(-Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Value must be finite');
    });

    it('should accept very large finite numbers', () => {
      const result = validator.handleSpecialCases(Number.MAX_VALUE);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(Number.MAX_VALUE);
    });

    it('should accept very small finite numbers', () => {
      const result = validator.handleSpecialCases(Number.MIN_VALUE);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(Number.MIN_VALUE);
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

  describe('add', () => {
    it('should add two valid numbers', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 5 })
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 3 });
      vi.mocked(mockValidator.handleSpecialCases)
        .mockReturnValue({ isValid: true, sanitizedValue: 8 });

      const result = calculator.add(5, 3);
      expect(result).toBe(8);
    });

    it('should add negative numbers', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: true, sanitizedValue: -5 })
        .mockReturnValueOnce({ isValid: true, sanitizedValue: -3 });
      vi.mocked(mockValidator.handleSpecialCases)
        .mockReturnValue({ isValid: true, sanitizedValue: -8 });

      const result = calculator.add(-5, -3);
      expect(result).toBe(-8);
    });

    it('should add zero', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 5 })
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 0 });
      vi.mocked(mockValidator.handleSpecialCases)
        .mockReturnValue({ isValid: true, sanitizedValue: 5 });

      const result = calculator.add(5, 0);
      expect(result).toBe(5);
    });

    it('should add float numbers', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 3.14 })
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 2.86 });
      vi.mocked(mockValidator.handleSpecialCases)
        .mockReturnValue({ isValid: true, sanitizedValue: 6 });

      const result = calculator.add(3.14, 2.86);
      expect(result).toBe(6);
    });

    it('should throw CalculationError for invalid first operand', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: false, error: 'Value is not numeric' });

      expect(() => calculator.add(null as any, 3)).toThrow(CalculationError);
      expect(() => calculator.add(null as any, 3)).toThrow('Invalid first operand: Value is not numeric');
      
      try {
        calculator.add(null as any, 3);
      } catch (error) {
        expect((error as CalculationError).code).toBe('INVALID_OPERAND_A');
      }
    });

    it('should throw CalculationError for invalid second operand', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 5 })
        .mockReturnValueOnce({ isValid: false, error: 'Value is null' });

      expect(() => calculator.add(5, null as any)).toThrow(CalculationError);
      expect(() => calculator.add(5, null as any)).toThrow('Invalid second operand: Value is null');
      
      try {
        calculator.add(5, null as any);
      } catch (error) {
        expect((error as CalculationError).code).toBe('INVALID_OPERAND_B');
      }
    });

    it('should throw CalculationError for invalid result', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: true, sanitizedValue: Number.MAX_VALUE })
        .mockReturnValueOnce({ isValid: true, sanitizedValue: Number.MAX_VALUE });
      vi.mocked(mockValidator.handleSpecialCases)
        .mockReturnValue({ isValid: false, error: 'Value must be finite' });

      expect(() => calculator.add(Number.MAX_VALUE, Number.MAX_VALUE)).toThrow(CalculationError);
      expect(() => calculator.add(Number.MAX_VALUE, Number.MAX_VALUE)).toThrow('Invalid result: Value must be finite');
      
      try {
        calculator.add(Number.MAX_VALUE, Number.MAX_VALUE);
      } catch (error) {
        expect((error as CalculationError).code).toBe('INVALID_RESULT');
      }
    });

    it('should validate both operands before performing operation', () => {
      vi.mocked(mockValidator.validate)
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 5 })
        .mockReturnValueOnce({ isValid: true, sanitizedValue: 3 });
      vi.mocked(mockValidator.handleSpecialCases)
        .mockReturnValue({ isValid: true, sanitizedValue: 8 });

      calculator.add(5, 3);

      expect(mockValidator.validate).toHaveBeenCalledTimes(2);
      expect(mockValidator.validate).toHaveBeenNthCalledWith(1, 5);
      expect(mockValidator.validate).toHaveBeenNthCalledWith(2, 3);
      expect(mockValidator.handleSpecialCases).toHaveBeenCalledWith(8);
    });
  });
});

describe('AdditionService', () => {
  let service: AdditionService;
  let mockCalculator: ICalculator;

  beforeEach(() => {
    mockCalculator = {
      add: vi.fn()
    };
    service = new AdditionService(mockCalculator);
  });

  describe('addNumbers with AdditionRequest', () => {
    it('should add numbers from request object', () => {
      vi.mocked(mockCalculator.add).mockReturnValue(8);
      const request: AdditionRequest = { operand1: 5, operand2: 3 };

      const result = service.addNumbers(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(8);
      expect(result.error).toBeUndefined();
      expect(mockCalculator.add).toHaveBeenCalledWith(5, 3);
    });

    it('should handle negative numbers in request', () => {
      vi.mocked(mockCalculator.add).mockReturnValue(-8);
      const request: AdditionRequest = { operand1: -5, operand2: -3 };

      const result = service.addNumbers(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(-8);
    });

    it('should handle zero in request', () => {
      vi.mocked(mockCalculator.add).mockReturnValue(5);
      const request: AdditionRequest = { operand1: 5, operand2: 0 };

      const result = service.addNumbers(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
    });

    it('should handle CalculationError from calculator', () => {
      const error = new CalculationError('Invalid operand', 'INVALID_OPERAND');
      vi.mocked(mockCalculator.add).mockImplementation(() => { throw error; });
      const request: AdditionRequest = { operand1: null as any, operand2: 3 };

      const result = service.addNumbers(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid operand');
      expect(result.result).toBeUndefined();
    });
  });

  describe('addNumbers with separate parameters', () => {
    it('should add numbers from separate parameters