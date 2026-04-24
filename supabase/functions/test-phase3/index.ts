import { fetchZenoContext } from "../_shared/zeno-client.ts";
import { generateRoadmapJSON, buildUserMessage } from "../_shared/llm-provider.ts";
import { renderRoadmapSVG } from "../_shared/svg-renderer.ts";

Deno.serve(async () => {
  const results: Record<string, unknown> = {};

  // Step 1: Zeno
  try {
    const zeno = await fetchZenoContext({
      goal: "build AI agents",
      background: "software developer",
      weak_areas: ["AI and LLMs", "System design"],
      timeframe_months: 3,
    });
    results.zeno = {
      ok: true,
      overview_len: zeno.overview.length,
      index_len: zeno.index.length,
      evidence_count: zeno.evidence.length,
    };

    // Step 2: LLM
    const msg = buildUserMessage({
      name: "Test User",
      goal: "build AI agents",
      background_role: "Software developer",
      experience_years: "3-7 years",
      weak_areas: ["AI and LLMs", "System design"],
      hours_per_week: "5-8 hours",
      learning_style: "Building projects",
      timeframe_months: 3,
      overview: zeno.overview,
      index: zeno.index,
      evidence: zeno.evidence.slice(0, 5),
    });

    const roadmap = await generateRoadmapJSON(msg);
    results.llm = {
      ok: true,
      title: roadmap.roadmap_title,
      phases: roadmap.phases.length,
      skills: roadmap.skill_tree.length,
      has_reminders: !!(roadmap.reminder_emails.day_3 && roadmap.reminder_emails.day_6),
    };

    // Step 3: SVG
    const svg = renderRoadmapSVG(roadmap);
    results.svg = {
      ok: true,
      length: svg.length,
      starts_with_svg: svg.startsWith("<svg"),
      self_contained: !svg.includes("http://") && !svg.includes("https://"),
    };

  } catch (err) {
    results.error = String(err);
  }

  return Response.json(results);
});
