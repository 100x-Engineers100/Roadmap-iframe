import OpenAI from "npm:openai@4";
import { RoadmapSchema, type RoadmapJSON } from "./roadmap-schema.ts";

const MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `You are a career roadmap generator for 100x Engineers — an applied AI cohort that teaches builders how to work with LLMs, agents, diffusion models, and AI systems.

Your job is to take a user's background and goal, map it to the closest AI/applied-AI career transformation, and produce a structured roadmap grounded in the 100x curriculum.

RULES:
1. Every roadmap must lead to an AI-enabled outcome. If the goal is not AI-related, reframe it into the closest AI-enabled version before generating.
2. Use the Zeno wiki evidence as your primary curriculum source. Cite zeno pages in resources where relevant.
3. Use general model knowledge only to bridge the user's background into the AI domain, or where Zeno has no coverage.
4. Do NOT generate generic internet-advice roadmaps. Every recommendation must be grounded in real 100x content where possible.
5. Be direct and clinical — no motivational filler. Treat the user as an adult who wants honest guidance.
6. If zeno_confidence is low (weak Zeno results), still generate using general AI knowledge but mark source as "model_knowledge" throughout.
7. The roadmap must be actionable. next_7_days must be doable in the first week given the stated hours/week.
8. Match phase count to timeframe: 3 months = 3 phases, 6 months = 6 phases. Each phase = 4 weeks.
9. Pre-generate two reminder email bodies (day_3 and day_6) that reference this specific roadmap content and the user's stated hours + learning style.

OUTPUT: Return only valid JSON matching EXACTLY this structure. No markdown, no explanation, no wrapper text.

{
  "version": "1.0",
  "roadmap_title": "string",
  "generated_at": "ISO8601 string",
  "source_strategy": {
    "domain_mapping": "string",
    "zeno_usage": "string",
    "zeno_confidence": "high" | "low",
    "fallback_allowed": true | false
  },
  "user_profile": {
    "name": "string",
    "goal": "string",
    "target_role": "string",
    "background_role": "string",
    "experience_years": "string",
    "weak_areas": ["string"],
    "hours_per_week": "string",
    "learning_style": "string",
    "timeframe_months": number
  },
  "summary": "string",
  "target_outcome": "string",
  "success_metrics": ["string", "string"],
  "risks": ["string", "string"],
  "assumptions": ["string"],
  "phases": [
    {
      "id": "phase-1",
      "number": 1,
      "title": "string",
      "weeks": "1-4",
      "focus": "string",
      "difficulty": "beginner" | "intermediate" | "advanced",
      "milestones": [
        { "id": "m1", "title": "string", "type": "concept" | "project" | "skill", "priority": "high" | "medium" | "low", "done": false, "resources": [{ "title": "string", "source": "zeno" | "model_knowledge", "key": "optional string" }] }
      ],
      "weekly_schedule": [{ "week": 1, "focus": "string", "estimated_hours": number }],
      "weekly_actions": ["string"]
    }
  ],
  "next_7_days": ["string", "string", "string"],
  "skill_tree": [
    { "id": "s1", "name": "string", "current_level": 1, "target_level": 4, "category": "foundation" | "ai" | "deployment" | "product", "unlocks": ["string"], "source": "zeno" | "model_knowledge" }
  ],
  "evidence_used": [{ "key": "string", "title": "string" }],
  "coaching_note": "string",
  "reminder_emails": {
    "day_3": { "subject": "string", "body": "string" },
    "day_6": { "subject": "string", "body": "string" }
  },
  "download_metadata": {
    "theme": "coral",
    "width": 1200,
    "height": 1800,
    "generated_at": "ISO8601 string"
  }
}

STRICT RULES:
- next_7_days: exactly 3 strings
- success_metrics: 2-3 strings max
- risks: 2-3 strings max
- phases: exactly match timeframe (3 months = 3 phases)
- skill_tree: array of objects (NOT strings)
- evidence_used: array of {key, title} objects (NOT strings)
- hours_per_week in user_profile: must be a STRING (e.g. "5-8 hours")`;


export async function generateRoadmapJSON(userMessage: string): Promise<RoadmapJSON> {
  const client = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

  let raw: string;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 6000,
    });
    raw = completion.choices[0].message.content ?? "";
  } catch (err) {
    throw new Error(`OpenAI call failed: ${err}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  // First attempt
  const result = RoadmapSchema.safeParse(parsed);
  if (result.success) return result.data;

  // Retry once with stricter prompt
  const retryCompletion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
        { role: "assistant", content: raw },
        {
          role: "user",
          content: `Your JSON failed schema validation: ${result.error.message}\n\nFix the JSON and return only the corrected JSON object.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 6000,
    });

  const retryRaw = retryCompletion.choices[0].message.content ?? "";
  const retryParsed = JSON.parse(retryRaw);
  const retryResult = RoadmapSchema.safeParse(retryParsed);
  if (!retryResult.success) {
    throw new Error(`LLM JSON failed validation after retry: ${retryResult.error.message}`);
  }
  return retryResult.data;
}

export function buildUserMessage(params: {
  name: string;
  goal: string;
  background_role: string;
  experience_years: string;
  weak_areas: string[];
  hours_per_week: string;
  learning_style: string;
  timeframe_months: number;
  overview: string;
  index: string;
  evidence: Array<{ key: string; title: string; excerpt: string }>;
}): string {
  return `USER PROFILE:
Name: ${params.name}
Goal: ${params.goal}
Background: ${params.background_role}, ${params.experience_years}
Weak areas: ${params.weak_areas.join(", ")}
Hours per week: ${params.hours_per_week}
Learning style: ${params.learning_style}
Timeframe: ${params.timeframe_months} months

ZENO WIKI OVERVIEW:
${params.overview}

ZENO INDEX (curriculum map):
${params.index}

RELEVANT 100x CURRICULUM EVIDENCE:
${params.evidence.map((e) => `[${e.key}] ${e.title}\n${e.excerpt}`).join("\n\n")}

Generate a complete roadmap JSON following the schema exactly.`;
}
