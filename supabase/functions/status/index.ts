import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifyJWT(req: Request): Promise<{ id: string }> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Missing token");

  const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error } = await anonClient.auth.getUser(auth.replace("Bearer ", ""));
  if (error || !user) throw new Error("Invalid token");
  return { id: user.id };
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

  if (req.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });

  let user: { id: string };
  try {
    user = await verifyJWT(req);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const roadmapId = url.searchParams.get("id");
  if (!roadmapId) return Response.json({ error: "Missing ?id param" }, { status: 400 });

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data, error } = await db
    .from("roadmaps")
    .select("id, status, svg_url, error_message, created_at, updated_at")
    .eq("id", roadmapId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return Response.json({ error: "Roadmap not found" }, { status: 404 });

  return Response.json(
    {
      roadmap_id: data.id,
      status: data.status,
      svg_url: data.status === "complete" ? data.svg_url : null,
      error_message: data.status === "failed" ? data.error_message : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
});
