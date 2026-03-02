import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_CONCURRENT_BUILDS = 5;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("JWT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Parse optional user_id filter — if provided, only process that user's queue
  let targetUserId: string | null = null;
  try {
    const body = await req.json();
    targetUserId = body.user_id || null;
  } catch {
    // No body is fine — process all queued builds
  }

  // Find queued builds, oldest first
  let query = supabase
    .from("builds")
    .select("id, user_id, prompt")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(10);

  if (targetUserId) {
    query = query.eq("user_id", targetUserId);
  }

  const { data: queuedBuilds, error: queueError } = await query;

  if (queueError || !queuedBuilds || queuedBuilds.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, message: "No queued builds" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let processed = 0;

  // Group by user to check per-user concurrency
  const byUser: Record<string, typeof queuedBuilds> = {};
  for (const build of queuedBuilds) {
    if (!byUser[build.user_id]) byUser[build.user_id] = [];
    byUser[build.user_id].push(build);
  }

  for (const [userId, builds] of Object.entries(byUser)) {
    // Check active build count for this user
    const { count } = await supabase
      .from("builds")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["pending", "specifying", "generating", "deploying"]);

    const activeCount = count ?? 0;
    const slotsAvailable = MAX_CONCURRENT_BUILDS - activeCount;

    if (slotsAvailable <= 0) continue;

    // Process up to slotsAvailable queued builds for this user
    const toProcess = builds.slice(0, slotsAvailable);

    for (const build of toProcess) {
      // Update status to pending (removes from queue)
      await supabase
        .from("builds")
        .update({ status: "pending", position_in_queue: null })
        .eq("id", build.id);

      // Fire-and-forget: invoke build-app to process this build
      // We pass build_id so build-app can pick up the existing record
      try {
        fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/build-app`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Use service role to bypass auth — build-app will use the build's user_id
              Authorization: `Bearer ${Deno.env.get("JWT_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              prompt: build.prompt,
              build_id: build.id,
              user_id: build.user_id,
              from_queue: true,
            }),
          },
        ).catch((err) => {
          console.error(`Failed to trigger build-app for queued build ${build.id}:`, err);
        });
      } catch (err) {
        console.error(`Failed to trigger build-app for queued build ${build.id}:`, err);
      }

      processed++;
      console.log(JSON.stringify({
        action: "dequeue",
        buildId: build.id,
        userId,
        slotsAvailable,
      }));
    }
  }

  // Update queue positions for remaining queued builds
  if (targetUserId) {
    const { data: remaining } = await supabase
      .from("builds")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("status", "queued")
      .order("created_at", { ascending: true });

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("builds")
          .update({ position_in_queue: i + 1 })
          .eq("id", remaining[i].id);
      }
    }
  }

  return new Response(
    JSON.stringify({ processed, message: `Dequeued ${processed} build(s)` }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
