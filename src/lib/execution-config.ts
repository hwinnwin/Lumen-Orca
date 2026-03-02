/**
 * Execution Engine Configuration
 * Defines resource limits and safety parameters
 */

export interface ExecutionLimits {
  // Time limits
  maxExecutionTimeMs: number;
  defaultTimeoutMs: number;
  
  // Memory limits
  maxMemoryMb: number;
  defaultMemoryMb: number;
  
  // Code limits
  maxCodeLength: number;
  
  // Concurrency limits
  maxConcurrentExecutions: number;
}

export const EXECUTION_LIMITS: ExecutionLimits = {
  // Time: Max 30s, default 5s
  maxExecutionTimeMs: 30000,
  defaultTimeoutMs: 5000,
  
  // Memory: Max 256MB, default 128MB
  maxMemoryMb: 256,
  defaultMemoryMb: 128,
  
  // Code: Max 100KB
  maxCodeLength: 100000,
  
  // Concurrency: Max 10 parallel executions
  maxConcurrentExecutions: 10,
};

/**
 * Agent-specific execution configurations
 */
export const AGENT_EXECUTION_CONFIGS: Record<string, Partial<ExecutionLimits>> = {
  'A3_codegen_a': {
    defaultTimeoutMs: 10000, // Code generation may need more time
    defaultMemoryMb: 256,
  },
  'A4_codegen_b': {
    defaultTimeoutMs: 10000,
    defaultMemoryMb: 256,
  },
  'A6_qa_harness': {
    defaultTimeoutMs: 15000, // QA tests may take longer
    defaultMemoryMb: 256,
  },
  'A8_performance': {
    defaultTimeoutMs: 20000, // Performance analysis needs time
    defaultMemoryMb: 256,
  },
};

/**
 * Forbidden code patterns for security
 */
export const FORBIDDEN_PATTERNS = [
  {
    pattern: /Deno\.exit/gi,
    reason: 'Process termination not allowed',
  },
  {
    pattern: /Deno\.kill/gi,
    reason: 'Process killing not allowed',
  },
  {
    pattern: /Deno\.env\.set/gi,
    reason: 'Environment modification not allowed',
  },
  {
    pattern: /process\.exit/gi,
    reason: 'Process termination not allowed',
  },
  {
    pattern: /require\s*\(\s*['"]child_process['"]\s*\)/gi,
    reason: 'Child process spawning not allowed',
  },
  {
    pattern: /eval\s*\(/gi,
    reason: 'Eval is not allowed for security',
  },
  {
    pattern: /Function\s*\(/gi,
    reason: 'Function constructor not allowed',
  },
  {
    pattern: /import\s+.*\s+from\s+['"]https?:\/\//gi,
    reason: 'Remote imports not allowed',
  },
];

/**
 * Allowed languages for execution
 */
export const ALLOWED_LANGUAGES = ['typescript', 'javascript', 'python'] as const;
export type AllowedLanguage = typeof ALLOWED_LANGUAGES[number];
