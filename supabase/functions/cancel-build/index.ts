import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STORAGE_BUCKET = "builder-previews";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("JWT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Parse body
  let body: { build_id: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { build_id } = body;
  if (!build_id) {
    return new Response(
      JSON.stringify({ error: "build_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Verify build belongs to user and is cancellable
  const { data: build, error: fetchError } = await supabase
    .from("builds")
    .select("id, user_id, status")
    .eq("id", build_id)
    .single();

  if (fetchError || !build) {
    return new Response(
      JSON.stringify({ error: "Build not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (build.user_id !== user.id) {
    return new Response(
      JSON.stringify({ error: "Not authorized to cancel this build" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const cancellableStatuses = ["queued", "pending", "specifying", "generating", "deploying"];
  if (!cancellableStatuses.includes(build.status)) {
    return new Response(
      JSON.stringify({ error: `Build cannot be cancelled (status: ${build.status})` }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Cancel the build
  const { error: updateError } = await supabase
    .from("builds")
    .update({
      status: "cancelled",
      error: { message: "Cancelled by user", stage: build.status },
      completed_at: new Date().toISOString(),
    })
    .eq("id", build_id);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: `Failed to cancel build: ${updateError.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Cancel all running/pending steps
  await supabase
    .from("build_steps")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
    })
    .eq("build_id", build_id)
    .in("status", ["pending", "running"]);

  // Clean up partial storage uploads (best-effort)
  const filePath = `${user.id}/${build_id}/index.html`;
  await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath])
    .catch(() => { /* best-effort cleanup */ });

  console.log(JSON.stringify({ buildId: build_id, action: "cancelled", userId: user.id }));

  // Trigger queue processing — kick the next queued build if one exists
  try {
    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-build-queue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("JWT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      },
    ).catch(() => { /* best-effort */ });
  } catch {
    // Non-critical — queue will process on next build completion
  }

  return new Response(
    JSON.stringify({ success: true, buildId: build_id, status: "cancelled" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
