import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  max_attempts: number;
  window_minutes: number;
  block_duration_minutes: number;
}

interface RateLimitAttempt {
  attempts: number;
  first_attempt_at: string;
  last_attempt_at: string;
  blocked_until: string | null;
}

interface RateLimitResponse {
  allowed: boolean;
  remaining?: number;
  resetAt?: string;
  blockedUntil?: string;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { endpoint, action } = await req.json();
    
    if (!endpoint) {
      throw new Error('Endpoint is required');
    }

    // Get client IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

    console.log(`Rate limit check for IP: ${ipAddress}, endpoint: ${endpoint}, action: ${action}`);

    // Get rate limit configuration
    const { data: config, error: configError } = await supabaseClient
      .from('rate_limit_config')
      .select('max_attempts, window_minutes, block_duration_minutes')
      .eq('endpoint', endpoint)
      .single();

    if (configError) {
      console.error('Error fetching rate limit config:', configError);
      throw new Error('Failed to fetch rate limit configuration');
    }

    const rateLimitConfig = config as RateLimitConfig;
    const now = new Date();

    // Get current rate limit attempt record
    const { data: attemptData, error: attemptError } = await supabaseClient
      .from('rate_limit_attempts')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (attemptError) {
      console.error('Error fetching rate limit attempts:', attemptError);
      throw new Error('Failed to fetch rate limit attempts');
    }

    const attempt = attemptData as RateLimitAttempt | null;

    // Check if IP is currently blocked
    if (attempt?.blocked_until) {
      const blockedUntil = new Date(attempt.blocked_until);
      if (blockedUntil > now) {
        const response: RateLimitResponse = {
          allowed: false,
          blockedUntil: attempt.blocked_until,
          message: `Too many failed attempts. Try again after ${blockedUntil.toLocaleString()}`,
        };

        return new Response(JSON.stringify(response), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Calculate window start time
    const windowStart = new Date(now.getTime() - rateLimitConfig.window_minutes * 60 * 1000);

    let currentAttempts = 0;
    let shouldBlock = false;

    if (attempt) {
      const firstAttempt = new Date(attempt.first_attempt_at);
      
      // Reset counter if outside the window
      if (firstAttempt < windowStart) {
        currentAttempts = 1;
      } else {
        currentAttempts = attempt.attempts + 1;
      }

      // Check if we should block
      if (currentAttempts > rateLimitConfig.max_attempts) {
        shouldBlock = true;
      }
    } else {
      currentAttempts = 1;
    }

    // Handle successful authentication (reset counter)
    if (action === 'success' && attempt) {
      await supabaseClient
        .from('rate_limit_attempts')
        .delete()
        .eq('ip_address', ipAddress)
        .eq('endpoint', endpoint);

      console.log(`Rate limit reset for IP: ${ipAddress}, endpoint: ${endpoint}`);

      const response: RateLimitResponse = {
        allowed: true,
        message: 'Rate limit reset after successful authentication',
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle failed attempt
    if (action === 'attempt') {
      const blockedUntil = shouldBlock
        ? new Date(now.getTime() + rateLimitConfig.block_duration_minutes * 60 * 1000)
        : null;

      const updateData: any = {
        ip_address: ipAddress,
        endpoint,
        attempts: currentAttempts,
        last_attempt_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      if (!attempt || new Date(attempt.first_attempt_at) < windowStart) {
        updateData.first_attempt_at = now.toISOString();
      }

      if (blockedUntil) {
        updateData.blocked_until = blockedUntil.toISOString();
      }

      const { error: upsertError } = await supabaseClient
        .from('rate_limit_attempts')
        .upsert(updateData, {
          onConflict: 'ip_address,endpoint',
        });

      if (upsertError) {
        console.error('Error updating rate limit attempts:', upsertError);
        throw new Error('Failed to update rate limit attempts');
      }

      if (shouldBlock) {
        console.log(`IP ${ipAddress} blocked for endpoint ${endpoint} until ${blockedUntil?.toISOString()}`);

        const response: RateLimitResponse = {
          allowed: false,
          blockedUntil: blockedUntil!.toISOString(),
          message: `Too many failed attempts. Your IP has been temporarily blocked until ${blockedUntil!.toLocaleString()}`,
        };

        return new Response(JSON.stringify(response), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const remaining = rateLimitConfig.max_attempts - currentAttempts;
      const resetAt = new Date(
        new Date(attempt?.first_attempt_at || now).getTime() + rateLimitConfig.window_minutes * 60 * 1000
      );

      console.log(`Rate limit check passed for IP: ${ipAddress}, remaining: ${remaining}`);

      const response: RateLimitResponse = {
        allowed: true,
        remaining,
        resetAt: resetAt.toISOString(),
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default check (no action specified)
    const remaining = rateLimitConfig.max_attempts - (attempt?.attempts || 0);
    const response: RateLimitResponse = {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Rate limit error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        allowed: true, // Fail open to avoid blocking legitimate users
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
