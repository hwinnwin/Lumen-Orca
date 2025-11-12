/**
 * Execution Engine - Manages safe code execution with sandboxing
 */

import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schema
const executionRequestSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty').max(100000, 'Code exceeds maximum length'),
  language: z.enum(['typescript', 'javascript', 'python']),
  timeoutMs: z.number().min(0).max(30000).optional(),
  memoryLimitMb: z.number().min(0).max(256).optional(),
  agentRole: z.string().optional(),
  taskId: z.string().optional(),
});

export type ExecutionRequest = z.infer<typeof executionRequestSchema>;

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTimeMs: number;
  memoryUsedMb?: number;
  exitCode?: number;
}

export interface SandboxConfig {
  timeoutMs: number;
  memoryLimitMb: number;
  allowNetworkAccess: boolean;
  allowFileSystem: boolean;
}

// Default sandbox configuration
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  timeoutMs: 5000,
  memoryLimitMb: 128,
  allowNetworkAccess: false,
  allowFileSystem: false,
};

/**
 * Execution Engine Class
 */
class ExecutionEngine {
  private static instance: ExecutionEngine;
  private config: SandboxConfig;

  private constructor(config: SandboxConfig = DEFAULT_SANDBOX_CONFIG) {
    this.config = config;
  }

  static getInstance(config?: SandboxConfig): ExecutionEngine {
    if (!ExecutionEngine.instance) {
      ExecutionEngine.instance = new ExecutionEngine(config);
    }
    return ExecutionEngine.instance;
  }

  /**
   * Execute code in sandboxed environment
   */
  async execute(request: Partial<ExecutionRequest>): Promise<ExecutionResult> {
    try {
      // Validate request
      const validatedRequest = executionRequestSchema.parse({
        ...request,
        timeoutMs: request.timeoutMs || this.config.timeoutMs,
        memoryLimitMb: request.memoryLimitMb || this.config.memoryLimitMb,
      });

      console.log('[Execution Engine] Executing code:', {
        language: validatedRequest.language,
        timeout: validatedRequest.timeoutMs,
        agentRole: validatedRequest.agentRole,
      });

      // Log execution start
      try {
        const { logAuditEvent } = await import('@/lib/audit-logger');
        await logAuditEvent({
          eventType: 'code_execution_started',
          eventStatus: 'success',
          eventDetails: {
            language: validatedRequest.language,
            codeLength: validatedRequest.code.length,
            timeoutMs: validatedRequest.timeoutMs,
            memoryLimitMb: validatedRequest.memoryLimitMb
          }
        });
      } catch (err) {
        console.error('Failed to log execution start:', err);
      }

      // Call sandboxed execution edge function
      const { data, error } = await supabase.functions.invoke('execute-code', {
        body: validatedRequest,
      });

      if (error) {
        console.error('[Execution Engine] Error:', error);
        
        // Log execution failure
        try {
          const { logAuditEvent } = await import('@/lib/audit-logger');
          await logAuditEvent({
            eventType: 'code_execution_failed',
            eventStatus: 'failure',
            eventDetails: {
              error: error.message,
              language: validatedRequest.language
            }
          });
        } catch (err) {
          console.error('Failed to log execution failure:', err);
        }
        
        return {
          success: false,
          error: error.message || 'Execution failed',
          executionTimeMs: 0,
        };
      }

      const result = data as ExecutionResult;

      // Log execution result
      try {
        const { logAuditEvent } = await import('@/lib/audit-logger');
        if (result.success) {
          await logAuditEvent({
            eventType: 'code_execution_completed',
            eventStatus: 'success',
            eventDetails: {
              language: validatedRequest.language,
              executionTimeMs: result.executionTimeMs,
              outputLength: result.output?.length || 0
            }
          });
        } else if (result.error?.includes('timeout')) {
          await logAuditEvent({
            eventType: 'code_execution_timeout',
            eventStatus: 'blocked',
            eventDetails: {
              language: validatedRequest.language,
              timeoutMs: validatedRequest.timeoutMs,
              error: result.error
            }
          });
        } else {
          await logAuditEvent({
            eventType: 'code_execution_failed',
            eventStatus: 'failure',
            eventDetails: {
              language: validatedRequest.language,
              error: result.error
            }
          });
        }
      } catch (err) {
        console.error('Failed to log execution result:', err);
      }

      return result;
    } catch (error: any) {
      console.error('[Execution Engine] Validation or execution error:', error);
      
      // Log execution error
      try {
        const { logAuditEvent } = await import('@/lib/audit-logger');
        await logAuditEvent({
          eventType: 'code_execution_failed',
          eventStatus: 'failure',
          eventDetails: {
            error: error.message || String(error)
          }
        });
      } catch (err) {
        console.error('Failed to log execution error:', err);
      }
      
      return {
        success: false,
        error: error.message || String(error),
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Execute with custom configuration
   */
  async executeWithConfig(
    request: Partial<ExecutionRequest>,
    config: Partial<SandboxConfig>
  ): Promise<ExecutionResult> {
    const mergedRequest = {
      ...request,
      timeoutMs: config.timeoutMs || this.config.timeoutMs,
      memoryLimitMb: config.memoryLimitMb || this.config.memoryLimitMb,
    };

    return this.execute(mergedRequest);
  }

  /**
   * Validate code for security issues before execution
   */
  validateCode(code: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /Deno\.exit/gi, message: 'Code contains Deno.exit which is not allowed' },
      { pattern: /Deno\.kill/gi, message: 'Code contains Deno.kill which is not allowed' },
      { pattern: /process\.exit/gi, message: 'Code contains process.exit which is not allowed' },
      { pattern: /eval\s*\(/gi, message: 'Code contains eval() which is not allowed' },
      { pattern: /Function\s*\(/gi, message: 'Code contains Function() constructor which is not allowed' },
      { pattern: /import\s+.*\s+from\s+['"]https?:\/\//gi, message: 'External imports are not allowed' },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(code)) {
        issues.push(message);
      }
    }

    // Check code length
    if (code.length > 100000) {
      issues.push('Code exceeds maximum allowed length of 100KB');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): SandboxConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const executionEngine = ExecutionEngine.getInstance();

// Export class for testing
export { ExecutionEngine };
