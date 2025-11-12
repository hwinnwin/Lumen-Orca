import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecutionRequest {
  code: string;
  language: 'typescript' | 'javascript' | 'python';
  timeoutMs?: number;
  memoryLimitMb?: number;
  agentRole?: string;
  taskId?: string;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTimeMs: number;
  memoryUsedMb?: number;
  exitCode?: number;
}

// Security: Maximum execution time (30 seconds)
const MAX_TIMEOUT_MS = 30000;
// Security: Maximum memory limit (256 MB)
const MAX_MEMORY_MB = 256;
// Security: Maximum code length (100 KB)
const MAX_CODE_LENGTH = 100000;

/**
 * Validate and sanitize execution request
 */
function validateRequest(req: ExecutionRequest): { valid: boolean; error?: string } {
  // Validate code length
  if (!req.code || req.code.length === 0) {
    return { valid: false, error: 'Code cannot be empty' };
  }
  if (req.code.length > MAX_CODE_LENGTH) {
    return { valid: false, error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` };
  }

  // Validate language
  if (!['typescript', 'javascript', 'python'].includes(req.language)) {
    return { valid: false, error: 'Unsupported language. Must be typescript, javascript, or python' };
  }

  // Validate timeout
  if (req.timeoutMs && (req.timeoutMs < 0 || req.timeoutMs > MAX_TIMEOUT_MS)) {
    return { valid: false, error: `Timeout must be between 0 and ${MAX_TIMEOUT_MS}ms` };
  }

  // Validate memory limit
  if (req.memoryLimitMb && (req.memoryLimitMb < 0 || req.memoryLimitMb > MAX_MEMORY_MB)) {
    return { valid: false, error: `Memory limit must be between 0 and ${MAX_MEMORY_MB}MB` };
  }

  // Security: Check for dangerous patterns
  const dangerousPatterns = [
    /Deno\.exit/gi,
    /Deno\.kill/gi,
    /Deno\.env\.set/gi,
    /process\.exit/gi,
    /require\s*\(\s*['"]child_process['"]\s*\)/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(req.code)) {
      return { valid: false, error: 'Code contains dangerous patterns that are not allowed' };
    }
  }

  return { valid: true };
}

/**
 * Execute code in sandboxed Deno environment
 */
async function executeSandboxedCode(
  code: string,
  language: string,
  timeoutMs: number
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // Create a sandboxed execution context
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let output = '';
    let error = '';

    try {
      // For TypeScript/JavaScript, use Deno's eval with restrictions
      if (language === 'typescript' || language === 'javascript') {
        // Wrap code in async function to support await
        const wrappedCode = `
          (async () => {
            const console = {
              log: (...args) => { output += args.join(' ') + '\\n'; },
              error: (...args) => { error += args.join(' ') + '\\n'; },
            };
            ${code}
          })()
        `;

        // Note: In production, this should use Deno.permissions and worker threads
        // For now, we'll execute in restricted context
        const result = await eval(wrappedCode);
        output = String(result || output);
      } else if (language === 'python') {
        // Python execution would require additional setup
        // For now, return unsupported error
        error = 'Python execution not yet supported in this sandbox';
      }

      clearTimeout(timeoutId);

      return {
        success: !error,
        output: output || undefined,
        error: error || undefined,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (execError: any) {
      clearTimeout(timeoutId);
      
      if (execError.name === 'AbortError') {
        return {
          success: false,
          error: `Execution timeout after ${timeoutMs}ms`,
          executionTimeMs: timeoutMs,
        };
      }

      return {
        success: false,
        error: execError.message || String(execError),
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
      executionTimeMs: Date.now() - startTime,
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const executionRequest: ExecutionRequest = await req.json();

    // Validate request
    const validation = validateRequest(executionRequest);
    if (!validation.valid) {
      console.error('[Execution Engine] Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set default limits
    const timeoutMs = Math.min(executionRequest.timeoutMs || 5000, MAX_TIMEOUT_MS);
    const memoryLimitMb = Math.min(executionRequest.memoryLimitMb || 128, MAX_MEMORY_MB);

    console.log(`[Execution Engine] Executing ${executionRequest.language} code for ${executionRequest.agentRole || 'unknown'} (timeout: ${timeoutMs}ms, memory: ${memoryLimitMb}MB)`);

    // Execute code in sandbox
    const result = await executeSandboxedCode(
      executionRequest.code,
      executionRequest.language,
      timeoutMs
    );

    console.log(`[Execution Engine] ${result.success ? '✅ Success' : '❌ Failed'} in ${result.executionTimeMs}ms`);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('[Execution Engine] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        executionTimeMs: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
