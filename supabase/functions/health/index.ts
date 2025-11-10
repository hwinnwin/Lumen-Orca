import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency_ms?: number;
      error?: string;
    };
    providers: {
      status: 'ok' | 'degraded' | 'error';
      healthy: number;
      total: number;
      details?: any[];
    };
  };
  uptime_seconds: number;
}

const startTime = Date.now();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const checks: HealthCheck['checks'] = {
      database: { status: 'ok' },
      providers: { status: 'ok', healthy: 0, total: 0 },
    };

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check database connectivity
    const dbStart = Date.now();
    try {
      const { error: dbError } = await supabase
        .from('provider_health')
        .select('count')
        .limit(1);

      checks.database.latency_ms = Date.now() - dbStart;

      if (dbError) {
        checks.database.status = 'error';
        checks.database.error = dbError.message;
      }
    } catch (error) {
      checks.database.status = 'error';
      checks.database.error = error instanceof Error ? error.message : 'Unknown database error';
    }

    // Check provider health
    try {
      const { data: providers, error: providerError } = await supabase
        .from('provider_health')
        .select('provider, status, last_success_at, consecutive_failures');

      if (!providerError && providers) {
        checks.providers.total = providers.length;
        checks.providers.healthy = providers.filter(p => p.status === 'healthy').length;
        checks.providers.details = providers;

        if (checks.providers.healthy === 0) {
          checks.providers.status = 'error';
        } else if (checks.providers.healthy < checks.providers.total) {
          checks.providers.status = 'degraded';
        }
      }
    } catch (error) {
      checks.providers.status = 'error';
    }

    // Determine overall health status
    let overallStatus: HealthCheck['status'] = 'healthy';

    if (checks.database.status === 'error' || checks.providers.status === 'error') {
      overallStatus = 'unhealthy';
    } else if (checks.providers.status === 'degraded') {
      overallStatus = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: Deno.env.get('APP_VERSION') || '1.0.0',
      checks,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(healthCheck, null, 2), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('[Health Check] Error:', error);

    const errorResponse: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        providers: { status: 'error', healthy: 0, total: 0 },
      },
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    };

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
});
