import { supabase } from "@/integrations/supabase/client";

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: string;
  blockedUntil?: string;
  message?: string;
}

export async function checkRateLimit(
  endpoint: string,
  action: 'attempt' | 'success' | 'check' = 'check'
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke('check-rate-limit', {
      body: { endpoint, action },
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow the request if rate limiting service is down
      return { allowed: true };
    }

    return data as RateLimitResult;
  } catch (error) {
    console.error('Rate limit exception:', error);
    // Fail open - allow the request if there's an exception
    return { allowed: true };
  }
}

export async function recordSuccessfulAuth(endpoint: string): Promise<void> {
  try {
    await supabase.functions.invoke('check-rate-limit', {
      body: { endpoint, action: 'success' },
    });
  } catch (error) {
    console.error('Failed to record successful auth:', error);
    // Non-critical, don't throw
  }
}
