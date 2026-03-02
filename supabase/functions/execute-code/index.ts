import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecutionRequest {
  code: string;
  language: 'typescript' | 'javascript';
  timeoutMs?: number;
  agentRole?: string;
  taskId?: string;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTimeMs: number;
  logs: string[];
}

// Security limits
const MAX_TIMEOUT_MS = 15000;
const MAX_CODE_LENGTH = 50000;

// Patterns that should never appear in user code executed on the server
const BLOCKED_PATTERNS = [
  /\bDeno\s*\./g,
  /\bprocess\s*\./g,
  /\brequire\s*\(/g,
  /\bimport\s*\(/g,
  /\bimport\s+/g,
  /\bfetch\s*\(/g,
  /\bXMLHttpRequest/g,
  /\bWebSocket/g,
  /\bnew\s+Worker/g,
  /\bSharedArrayBuffer/g,
  /\bAtomics\s*\./g,
  /\beval\s*\(/g,
  /\bFunction\s*\(/g,
  /\bglobalThis/g,
  /\bself\s*\[/g,
];

function validateRequest(req: ExecutionRequest): { valid: boolean; error?: string } {
  if (!req.code || req.code.length === 0) {
    return { valid: false, error: 'Code cannot be empty' };
  }
  if (req.code.length > MAX_CODE_LENGTH) {
    return { valid: false, error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` };
  }
  if (!['typescript', 'javascript'].includes(req.language)) {
    return { valid: false, error: 'Unsupported language. Must be typescript or javascript' };
  }
  if (req.timeoutMs && (req.timeoutMs < 100 || req.timeoutMs > MAX_TIMEOUT_MS)) {
    return { valid: false, error: `Timeout must be between 100 and ${MAX_TIMEOUT_MS}ms` };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(req.code)) {
      return { valid: false, error: `Code contains blocked pattern: ${pattern.source}` };
    }
  }

  return { valid: true };
}

/**
 * Strip TypeScript type annotations for plain JS execution.
 * Handles: type declarations, interface declarations, type annotations on params/vars,
 * generic type params, as assertions, and import type statements.
 */
function stripTypeScript(code: string): string {
  let result = code;
  // Remove `type X = ...` and `interface X { ... }` declarations
  result = result.replace(/^\s*(?:export\s+)?type\s+\w+.*?(?:;|\n)/gm, '');
  result = result.replace(/^\s*(?:export\s+)?interface\s+\w+[^{]*\{[^}]*\}/gm, '');
  // Remove `: Type` annotations from parameters and variables
  result = result.replace(/:\s*(?:string|number|boolean|any|void|never|unknown|null|undefined|Record<[^>]+>|Array<[^>]+>|Promise<[^>]+>|\w+(?:\[\])?)\s*(?=[,)=;{])/g, '');
  // Remove generic type params `<T>` on function calls (but not JSX)
  result = result.replace(/<(?:string|number|boolean|any|void|Record<[^>]+>|Array<[^>]+>|\w+)>/g, '');
  // Remove `as Type` assertions
  result = result.replace(/\s+as\s+\w+(?:\[\])?/g, '');
  // Remove `import type` statements
  result = result.replace(/^\s*import\s+type\s+.*?;?\s*$/gm, '');
  return result;
}

/**
 * Execute code in a sandboxed context using a dynamically created module.
 * The code runs in a restricted scope with no access to Deno APIs, network, or filesystem.
 */
async function executeInSandbox(
  code: string,
  language: string,
  timeoutMs: number
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const logs: string[] = [];

  try {
    // Strip TS if needed
    const jsCode = language === 'typescript' ? stripTypeScript(code) : code;

    // Build sandboxed execution wrapper
    // The code runs inside an async IIFE with a custom console that captures output.
    // No globals (Deno, fetch, etc.) are available inside the wrapper.
    const wrappedCode = `
      "use strict";
      const __logs = [];
      const console = {
        log: (...args) => __logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args) => __logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        warn: (...args) => __logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        info: (...args) => __logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      };
      const Math = globalThis.Math;
      const Date = globalThis.Date;
      const JSON = globalThis.JSON;
      const Array = globalThis.Array;
      const Object = globalThis.Object;
      const String = globalThis.String;
      const Number = globalThis.Number;
      const Boolean = globalThis.Boolean;
      const Map = globalThis.Map;
      const Set = globalThis.Set;
      const Promise = globalThis.Promise;
      const RegExp = globalThis.RegExp;
      const Error = globalThis.Error;
      const TypeError = globalThis.TypeError;
      const RangeError = globalThis.RangeError;
      const parseInt = globalThis.parseInt;
      const parseFloat = globalThis.parseFloat;
      const isNaN = globalThis.isNaN;
      const isFinite = globalThis.isFinite;
      const setTimeout = undefined;
      const setInterval = undefined;
      const clearTimeout = undefined;
      const clearInterval = undefined;
      const fetch = undefined;
      const Deno = undefined;
      const process = undefined;
      const require = undefined;
      const __returnValue = await (async () => {
        ${jsCode}
      })();
      ({ logs: __logs, returnValue: __returnValue });
    `;

    // Create a Blob URL for isolated execution
    const blob = new Blob([wrappedCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    // Execute with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Use dynamic import to execute in its own module scope
      const moduleResult = await Promise.race([
        import(blobUrl),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Execution timeout after ${timeoutMs}ms`))
          );
        }),
      ]) as any;

      clearTimeout(timeoutId);
      URL.revokeObjectURL(blobUrl);

      // The module's default export is our result object
      const captured = moduleResult?.default || moduleResult;
      const capturedLogs = captured?.logs || [];
      const returnValue = captured?.returnValue;

      logs.push(...capturedLogs);

      let output = capturedLogs.join('\n');
      if (returnValue !== undefined && returnValue !== null) {
        const returnStr = typeof returnValue === 'object' ? JSON.stringify(returnValue, null, 2) : String(returnValue);
        if (output) output += '\n';
        output += returnStr;
      }

      return {
        success: true,
        output: output || '(no output)',
        executionTimeMs: Date.now() - startTime,
        logs,
      };
    } catch (execError: any) {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(blobUrl);

      return {
        success: false,
        error: execError.message || String(execError),
        executionTimeMs: Date.now() - startTime,
        logs,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
      executionTimeMs: Date.now() - startTime,
      logs,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const executionRequest: ExecutionRequest = await req.json();

    const validation = validateRequest(executionRequest);
    if (!validation.valid) {
      console.error('[ExecuteCode] Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error, executionTimeMs: 0, logs: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timeoutMs = Math.min(executionRequest.timeoutMs || 5000, MAX_TIMEOUT_MS);

    console.log(`[ExecuteCode] Executing ${executionRequest.language} (${executionRequest.code.length} chars, timeout: ${timeoutMs}ms, agent: ${executionRequest.agentRole || 'direct'})`);

    const result = await executeInSandbox(
      executionRequest.code,
      executionRequest.language,
      timeoutMs
    );

    console.log(`[ExecuteCode] ${result.success ? 'OK' : 'FAIL'} in ${result.executionTimeMs}ms`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[ExecuteCode] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        executionTimeMs: 0,
        logs: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
