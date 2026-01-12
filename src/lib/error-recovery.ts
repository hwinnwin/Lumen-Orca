/**
 * Error Recovery Service
 * Provides resilient error handling, retry logic, and automatic recovery
 * for the Lumen-Orca orchestration system
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory =
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'invalid_response'
  | 'provider_error'
  | 'resource_limit'
  | 'authentication'
  | 'validation'
  | 'unknown';

export interface ErrorContext {
  operation: string;
  agentRole?: string;
  taskId?: string;
  provider?: string;
  model?: string;
  attempt?: number;
  metadata?: Record<string, unknown>;
}

export interface RecoveryStrategy {
  shouldRetry: boolean;
  delayMs: number;
  maxAttempts: number;
  fallbackAction?: () => Promise<unknown>;
  escalate: boolean;
}

export interface ErrorAnalysis {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
  suggestedAction: string;
  rootCause: string;
}

/**
 * Analyze an error to determine category, severity, and recovery options
 */
export function analyzeError(error: unknown): ErrorAnalysis {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('econnrefused') || message.includes('dns')) {
    return {
      category: 'network',
      severity: 'medium',
      isRetryable: true,
      suggestedAction: 'Retry with exponential backoff',
      rootCause: 'Network connectivity issue',
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out') || message.includes('deadline')) {
    return {
      category: 'timeout',
      severity: 'medium',
      isRetryable: true,
      suggestedAction: 'Retry with increased timeout',
      rootCause: 'Operation exceeded time limit',
    };
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return {
      category: 'rate_limit',
      severity: 'low',
      isRetryable: true,
      suggestedAction: 'Wait and retry with exponential backoff',
      rootCause: 'API rate limit exceeded',
    };
  }

  // Authentication errors
  if (message.includes('401') || message.includes('403') || message.includes('unauthorized') || message.includes('forbidden')) {
    return {
      category: 'authentication',
      severity: 'high',
      isRetryable: false,
      suggestedAction: 'Check API credentials and permissions',
      rootCause: 'Authentication or authorization failure',
    };
  }

  // Provider errors
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('service unavailable')) {
    return {
      category: 'provider_error',
      severity: 'medium',
      isRetryable: true,
      suggestedAction: 'Retry or switch to fallback provider',
      rootCause: 'LLM provider service error',
    };
  }

  // Invalid response
  if (message.includes('parse') || message.includes('json') || message.includes('invalid') || message.includes('unexpected token')) {
    return {
      category: 'invalid_response',
      severity: 'medium',
      isRetryable: true,
      suggestedAction: 'Retry with clearer prompt or different model',
      rootCause: 'Agent produced unparseable output',
    };
  }

  // Resource limits
  if (message.includes('memory') || message.includes('resource') || message.includes('quota') || message.includes('limit exceeded')) {
    return {
      category: 'resource_limit',
      severity: 'high',
      isRetryable: false,
      suggestedAction: 'Reduce input size or increase resource allocation',
      rootCause: 'Resource limit exceeded',
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('required') || message.includes('missing')) {
    return {
      category: 'validation',
      severity: 'low',
      isRetryable: false,
      suggestedAction: 'Fix input data and retry',
      rootCause: 'Input validation failed',
    };
  }

  // Unknown
  return {
    category: 'unknown',
    severity: 'medium',
    isRetryable: true,
    suggestedAction: 'Log error and retry once',
    rootCause: 'Unclassified error',
  };
}

/**
 * Get recovery strategy based on error analysis
 */
export function getRecoveryStrategy(
  analysis: ErrorAnalysis,
  context: ErrorContext
): RecoveryStrategy {
  const currentAttempt = context.attempt || 1;

  // Base delays for exponential backoff
  const baseDelays: Record<ErrorCategory, number> = {
    network: 1000,
    timeout: 2000,
    rate_limit: 5000,
    provider_error: 2000,
    invalid_response: 500,
    resource_limit: 0,
    authentication: 0,
    validation: 0,
    unknown: 1000,
  };

  // Max attempts per category
  const maxAttempts: Record<ErrorCategory, number> = {
    network: 4,
    timeout: 3,
    rate_limit: 5,
    provider_error: 3,
    invalid_response: 2,
    resource_limit: 1,
    authentication: 1,
    validation: 1,
    unknown: 2,
  };

  const baseDelay = baseDelays[analysis.category];
  const maxAttemptsForCategory = maxAttempts[analysis.category];

  // Calculate exponential backoff delay
  const delay = analysis.isRetryable
    ? Math.min(baseDelay * Math.pow(2, currentAttempt - 1), 30000)
    : 0;

  return {
    shouldRetry: analysis.isRetryable && currentAttempt < maxAttemptsForCategory,
    delayMs: delay,
    maxAttempts: maxAttemptsForCategory,
    escalate: analysis.severity === 'critical' || currentAttempt >= maxAttemptsForCategory,
  };
}

/**
 * Execute an operation with automatic retry and recovery
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    onRetry?: (attempt: number, error: unknown, delay: number) => void;
    onSuccess?: (result: T, attempts: number) => void;
    onFailure?: (error: unknown, attempts: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    onRetry,
    onSuccess,
    onFailure,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      onSuccess?.(result, attempt);
      return result;
    } catch (error) {
      lastError = error;

      const analysis = analyzeError(error);
      const strategy = getRecoveryStrategy(analysis, { ...context, attempt });

      if (!strategy.shouldRetry || attempt >= maxAttempts) {
        break;
      }

      // Calculate delay with jitter to avoid thundering herd
      const jitter = Math.random() * 0.3 * strategy.delayMs;
      const delay = strategy.delayMs + jitter;

      onRetry?.(attempt, error, delay);

      await sleep(delay);
    }
  }

  onFailure?.(lastError, maxAttempts);
  throw lastError;
}

/**
 * Execute an operation with circuit breaker pattern
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly options: {
      failureThreshold: number;
      resetTimeoutMs: number;
      halfOpenMaxAttempts: number;
    } = {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      halfOpenMaxAttempts: 2,
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - operation rejected');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}

/**
 * Provider-specific circuit breakers
 */
const providerCircuitBreakers = new Map<string, CircuitBreaker>();

export function getProviderCircuitBreaker(provider: string): CircuitBreaker {
  if (!providerCircuitBreakers.has(provider)) {
    providerCircuitBreakers.set(provider, new CircuitBreaker());
  }
  return providerCircuitBreakers.get(provider)!;
}

/**
 * Execute with provider fallback
 */
export async function withProviderFallback<T>(
  providers: Array<{ name: string; execute: () => Promise<T> }>,
  context: ErrorContext
): Promise<{ result: T; provider: string }> {
  const errors: Array<{ provider: string; error: unknown }> = [];

  for (const provider of providers) {
    const circuitBreaker = getProviderCircuitBreaker(provider.name);

    // Skip if circuit breaker is open
    if (circuitBreaker.getState() === 'open') {
      continue;
    }

    try {
      const result = await circuitBreaker.execute(() =>
        withRetry(provider.execute, { ...context, provider: provider.name })
      );
      return { result, provider: provider.name };
    } catch (error) {
      errors.push({ provider: provider.name, error });
    }
  }

  // All providers failed
  const errorSummary = errors
    .map(e => `${e.provider}: ${e.error instanceof Error ? e.error.message : String(e.error)}`)
    .join('; ');

  throw new Error(`All providers failed: ${errorSummary}`);
}

/**
 * Graceful degradation wrapper
 */
export async function withGracefulDegradation<T, F>(
  operation: () => Promise<T>,
  fallback: () => F,
  context: ErrorContext
): Promise<T | F> {
  try {
    return await withRetry(operation, context);
  } catch (error) {
    console.warn(`[Recovery] Operation ${context.operation} failed, using fallback:`, error);
    return fallback();
  }
}

/**
 * Helper: Sleep for specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a monitored operation that tracks success/failure metrics
 */
export function createMonitoredOperation<T>(
  name: string,
  operation: () => Promise<T>,
  context: ErrorContext
): () => Promise<T> {
  return async () => {
    const startTime = Date.now();
    let success = false;

    try {
      const result = await operation();
      success = true;
      return result;
    } finally {
      const duration = Date.now() - startTime;
      // In production, this would emit metrics
      console.log(`[Monitor] ${name}: ${success ? 'success' : 'failure'} in ${duration}ms`, context);
    }
  };
}
