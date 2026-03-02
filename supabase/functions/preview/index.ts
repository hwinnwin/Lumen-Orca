import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Preview Edge Function — serves generated app HTML.
 *
 * Supabase Storage serves private bucket files as text/plain with a strict
 * sandbox CSP, which prevents HTML rendering. This function:
 * 1. Fetches the HTML from Storage using the service role key
 * 2. Verifies the build exists and is "live"
 * 3. Returns the HTML content
 *
 * Usage:
 *   GET  /functions/v1/preview?build_id=<uuid>
 *   POST /functions/v1/preview  { "build_id": "<uuid>" }
 */
serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract build_id from query params or JSON body (supports both GET and POST)
  const url = new URL(req.url);
  let buildId: string | null = url.searchParams.get("build_id");

  if (!buildId && req.method === "POST") {
    try {
      const body = await req.json();
      buildId = body?.build_id ?? null;
    } catch (e) {
      console.error("Failed to parse request body:", (e as Error).message);
    }
  }

  if (!buildId) {
    return new Response(JSON.stringify({ error: "Missing build_id parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // UUID format check
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(buildId)) {
    return new Response(JSON.stringify({ error: "Invalid build_id format" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("JWT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Look up the build to get the user_id and verify it exists
  const { data: build, error: buildError } = await supabase
    .from("builds")
    .select("id, user_id, status")
    .eq("id", buildId)
    .single();

  if (buildError || !build) {
    return new Response(JSON.stringify({ error: "Build not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (build.status !== "live") {
    return new Response(JSON.stringify({ error: "Build is not live yet" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Download the preview HTML from Storage
  const filePath = `${build.user_id}/${buildId}/index.html`;
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("builder-previews")
    .download(filePath);

  if (downloadError || !fileData) {
    return new Response(JSON.stringify({ error: "Preview not found in storage" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const html = await fileData.text();

  // Return as plain text so the client can use it as srcdoc
  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
