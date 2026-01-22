```typescript
/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: number;
}

/**
 * Addition request interface
 */
interface AdditionRequest {
  operand1: number;
  operand2: number;
}

/**
 * Addition response interface
 */
interface AdditionResponse {
  result?: number;
  error?: string;
  success: boolean;
}

/**
 * Number validator interface
 */
interface INumberValidator {
  validate(value: any): ValidationResult;
  isNumeric(value: any): boolean;
  handleSpecialCases(value: number): ValidationResult;
}

/**
 * Calculator interface
 */
interface ICalculator {
  add(a: number, b: number): number;
}

/**
 * Addition service interface
 */
interface IAdditionService {
  addNumbers(request: AdditionRequest): AdditionResponse;
  addNumbers(a: number, b: number): AdditionResponse;
}

/**
 * Custom error for calculation operations
 */
class CalculationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'CalculationError';
  }
}

/**
 * Number validator implementation
 */
class NumberValidator implements INumberValidator {
  /**
   * Validates a value and returns validation result
   * @param value - Value to validate
   * @returns ValidationResult with validation status and sanitized value
   */
  validate(value: any): ValidationResult {
    if (value === null || value === undefined) {
      return { isValid: false, error: 'Value cannot be null or undefined' };
    }

    if (!this.isNumeric(value)) {
      return { isValid: false, error: 'Value is not numeric' };
    }

    const numericValue = Number(value);
    const specialCaseResult = this.handleSpecialCases(numericValue);
    
    if (!specialCaseResult.isValid) {
      return specialCaseResult;
    }

    return { isValid: true, sanitizedValue: numericValue };
  }

  /**
   * Checks if a value is numeric
   * @param value - Value to check
   * @returns True if value is numeric, false otherwise
   */
  isNumeric(value: any): boolean {
    if (typeof value === 'number') {
      return true;
    }
    
    if (typeof value === 'string') {
      return !isNaN(Number(value)) && !isNaN(parseFloat(value));
    }
    
    return false;
  }

  /**
   * Handles special numeric cases like Infinity and NaN
   * @param value - Numeric value to check
   * @returns ValidationResult for special cases
   */
  handleSpecialCases(value: number): ValidationResult {
    if (isNaN(value)) {
      return { isValid: false, error: 'Value is NaN' };
    }

    if (!isFinite(value)) {
      return { isValid: false, error: 'Value must be finite' };
    }

    return { isValid: true, sanitizedValue: value };
  }
}

/**
 * Core calculator implementation
 */
class Calculator implements ICalculator {
  private readonly validator: INumberValidator;

  constructor(validator: INumberValidator) {
    this.validator = validator;
  }

  /**
   * Adds two numbers together
   * @param a - First operand
   * @param b - Second operand
   * @returns Sum of a and b
   * @throws CalculationError if inputs are invalid
   */
  add(a: number, b: number): number {
    const validationA = this.validator.validate(a);
    if (!validationA.isValid) {
      throw new CalculationError(`Invalid first operand: ${validationA.error}`, 'INVALID_OPERAND_A');
    }

    const validationB = this.validator.validate(b);
    if (!validationB.isValid) {
      throw new CalculationError(`Invalid second operand: ${validationB.error}`, 'INVALID_OPERAND_B');
    }

    const result = validationA.sanitizedValue! + validationB.sanitizedValue!;
    
    const resultValidation = this.validator.handleSpecialCases(result);
    if (!resultValidation.isValid) {
      throw new CalculationError(`Invalid result: ${resultValidation.error}`, 'INVALID_RESULT');
    }

    return result;
  }
}

/**
 * Addition service implementation with overloaded methods
 */
class AdditionService implements IAdditionService {
  private readonly calculator: ICalculator;

  constructor(calculator: ICalculator) {
    this.calculator = calculator;
  }

  /**
   * Adds numbers from request object or direct parameters
   * @param requestOrA - AdditionRequest object or first number
   * @param b - Second number (when first parameter is number)
   * @returns AdditionResponse with result or error
   */
  addNumbers(requestOrA: AdditionRequest | number, b?: number): AdditionResponse {
    try {
      let operand1: number;
      let operand2: number;

      if (typeof requestOrA === 'object' && requestOrA !== null) {
        operand1 = requestOrA.operand1;
        operand2 = requestOrA.operand2;
      } else if (typeof requestOrA === 'number' && b !== undefined) {
        operand1 = requestOrA;
        operand2 = b;
      } else {
        return {
          success: false,
          error: 'Invalid parameters provided'
        };
      }

      const result = this.calculator.add(operand1, operand2);
      
      return {
        success: true,
        result
      };
    } catch (error) {
      if (error instanceof CalculationError) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: 'An unexpected error occurred during calculation'
      };
    }
  }
}

/**
 * Factory for creating calculator components
 */
class CalculatorFactory {
  /**
   * Creates a complete calculator system with all dependencies
   * @returns Configured AdditionService instance
   */
  static createAdditionService(): IAdditionService {
    const validator = new NumberValidator();
    const calculator = new Calculator(validator);
    return new AdditionService(calculator);
  }
}

export {
  ValidationResult,
  AdditionRequest,
  AdditionResponse,
  INumberValidator,
  ICalculator,
  IAdditionService,
  CalculationError,
  NumberValidator,
  Calculator,
  AdditionService,
  CalculatorFactory
};
```