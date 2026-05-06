import { fetchZenoContext } from "./_shared/zeno-client.ts";
import { generateRoadmapJSON, buildUserMessage } from "./_shared/llm-provider.ts";
import { renderRoadmapSVG } from "./_shared/svg-renderer.ts";

const profile = {
  name: "Vishal",
  goal: "Become an AI engineer",
  background_role: "Software developer",
  experience_years: "1–3 years",
  weak_areas: ["AI and LLMs", "System design"],
  hours_per_week: "5-8 hours",
  learning_style: "Building projects",
  timeframe_months: 3,
};

console.log("[1] Fetching Zeno context...");
const zeno = await fetchZenoContext({
  goal: profile.goal,
  background: profile.background_role,
  weak_areas: profile.weak_areas,
  timeframe_months: profile.timeframe_months,
});
console.log(`    overview: ${zeno.overview.length} chars, evidence: ${zeno.evidence.length} items`);

console.log("[2] Building prompt + calling LLM...");
const msg = buildUserMessage({
  ...profile,
  overview: zeno.overview,
  index: zeno.index,
  evidence: zeno.evidence.slice(0, 8),
});

const roadmap = await generateRoadmapJSON(msg);
console.log(`    title: ${roadmap.roadmap_title}`);
console.log(`    week_cards: ${roadmap.week_cards.length}`);
console.log(`    month_cards: ${roadmap.month_cards.length}`);
console.log(`    milestone_tracker: ${roadmap.milestone_tracker.length} months`);

// Print week 1 card to verify specificity
const w1 = roadmap.week_cards[0];
console.log("\n--- WEEK 1 CARD ---");
console.log(`  theme: ${w1.theme}`);
console.log(`  topics (${w1.topics.length}): ${w1.topics.join(" | ")}`);
console.log(`  tools: ${w1.tools.join(" | ")}`);
console.log(`  mini_project: ${w1.mini_project}`);
console.log(`  checkpoint: ${w1.capability_checkpoint}`);

// Print milestone tracker
console.log("\n--- MILESTONE TRACKER ---");
for (const m of roadmap.milestone_tracker) {
  console.log(`  ${m.label}`);
  for (const ms of m.milestones) console.log(`    ☐ ${ms}`);
}

console.log("\n[3] Rendering SVG...");
const svg = renderRoadmapSVG(roadmap);
console.log(`    SVG length: ${svg.length} chars`);

const outPath = "C:\\Users\\visha\\Downloads\\Roadmap iframe\\supabase\\functions\\test-output.svg";
await Deno.writeTextFile(outPath, svg);
console.log(`\n[OK] SVG saved → ${outPath}`);
