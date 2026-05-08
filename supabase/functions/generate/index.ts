import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchZenoContext } from "../_shared/zeno-client.ts";
import { generateRoadmapJSON, buildUserMessage } from "../_shared/llm-provider.ts";
import { renderRoadmapHTML } from "../_shared/html-renderer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

async function verifyJWT(req: Request): Promise<{ id: string; email: string; display_name: string }> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Missing token");

  const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error } = await anonClient.auth.getUser(auth.replace("Bearer ", ""));
  if (error || !user) throw new Error("Invalid token");

  return {
    id: user.id,
    email: user.email!,
    display_name: user.user_metadata?.full_name ?? user.email!,
  };
}

async function countRecentGenerations(userId: string, hours: number): Promise<number> {
  const db = serviceClient();
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { count } = await db
    .from("roadmaps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return count ?? 0;
}

async function generateRoadmapBackground(
  roadmapId: string,
  intakeId: string,
  user: { id: string; email: string; display_name: string },
  intake: Record<string, unknown>,
): Promise<void> {
  const db = serviceClient();

  try {
    await db.from("roadmaps").update({ status: "generating", generation_attempts: 1 }).eq("id", roadmapId);

    const zeno = await fetchZenoContext({
      goal: intake.goal as string,
      background: intake.background_role as string,
      weak_areas: intake.weak_areas as string[],
      timeframe_months: intake.timeframe_months as number,
    });

    const msg = buildUserMessage({
      name: user.display_name,
      goal: intake.goal as string,
      background_role: intake.background_role as string,
      experience_years: intake.experience_years as string,
      weak_areas: intake.weak_areas as string[],
      hours_per_week: intake.hours_per_week as string,
      learning_style: intake.learning_style as string,
      timeframe_months: intake.timeframe_months as number,
      overview: zeno.overview,
      index: zeno.index,
      evidence: zeno.evidence.slice(0, 8),
    });

    const roadmap = await generateRoadmapJSON(msg);
    const html = renderRoadmapHTML(roadmap);

    // Upload HTML to storage
    const htmlBytes = new TextEncoder().encode(html);
    const storagePath = `${user.id}/${roadmapId}.html`;
    const { error: uploadError } = await db.storage
      .from("roadmaps")
      .upload(storagePath, htmlBytes, { contentType: "text/html", upsert: true });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = db.storage.from("roadmaps").getPublicUrl(storagePath);

    // Save revision
    await db.from("roadmap_revisions").insert({ roadmap_id: roadmapId, roadmap_json: roadmap });

    // Update roadmap to complete
    await db.from("roadmaps").update({
      status: "complete",
      roadmap_json: roadmap,
      svg_url: publicUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", roadmapId);

    // Schedule reminders
    const now = new Date();
    await db.from("reminders").insert([
      {
        user_id: user.id,
        roadmap_id: roadmapId,
        reminder_type: "day_3",
        scheduled_at: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString(),
      },
      {
        user_id: user.id,
        roadmap_id: roadmapId,
        reminder_type: "day_6",
        scheduled_at: new Date(now.getTime() + 6 * 24 * 3600 * 1000).toISOString(),
      },
    ]);

  } catch (err) {
    await db.from("roadmaps").update({
      status: "failed",
      error_message: String(err),
      updated_at: new Date().toISOString(),
    }).eq("id", roadmapId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

  let user: { id: string; email: string; display_name: string };
  try {
    user = await verifyJWT(req);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let intake: Record<string, unknown>;
  try {
    intake = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const required = ["goal", "background_role", "experience_years", "weak_areas", "hours_per_week", "learning_style", "timeframe_months"];
  for (const f of required) {
    if (!intake[f]) return Response.json({ error: `Missing field: ${f}` }, { status: 400 });
  }

  // Rate limit
  const recent = await countRecentGenerations(user.id, 24);
  if (recent >= 2) return Response.json({ error: "Rate limit: 2 roadmaps per 24 hours" }, { status: 429 });

  const db = serviceClient();

  // Upsert user record
  await db.from("users").upsert({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
  }, { onConflict: "id" });

  // Insert intake
  const { data: intakeRow, error: intakeErr } = await db.from("intake_answers").insert({
    user_id: user.id,
    goal: intake.goal,
    target_role: intake.target_role ?? null,
    timeframe_months: intake.timeframe_months,
    background_role: intake.background_role,
    experience_years: intake.experience_years,
    weak_areas: intake.weak_areas,
    hours_per_week: intake.hours_per_week,
    learning_style: intake.learning_style,
  }).select("id").single();
  if (intakeErr) return Response.json({ error: "DB error: " + intakeErr.message }, { status: 500 });

  // Create roadmap record
  const { data: roadmapRow, error: roadmapErr } = await db.from("roadmaps").insert({
    user_id: user.id,
    intake_id: intakeRow.id,
    status: "pending",
  }).select("id").single();
  if (roadmapErr) return Response.json({ error: "DB error: " + roadmapErr.message }, { status: 500 });

  const roadmapId = roadmapRow.id;

  // Return immediately, generate in background
  const response = Response.json(
    { roadmap_id: roadmapId, status: "generating" },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );

  EdgeRuntime.waitUntil(generateRoadmapBackground(roadmapId, intakeRow.id, user, intake));

  return response;
});
