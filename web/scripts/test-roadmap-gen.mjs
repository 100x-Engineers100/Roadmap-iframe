/**
 * Phase 5 roadmap-gen test.
 * Tests two personas against North Star criteria.
 *
 * North Star:
 *   Engineer, no AI exp, "API integration" high-weight → step1 subnode like
 *   "Wire Claude API to FastAPI endpoint | tools:[FastAPI,Claude API,Supabase] | 1-2 hrs"
 *
 *   Marketer, no AI exp → subnodes are plain-English, no-code exercises
 *   with ChatGPT/Canva/Zapier — NOT API/endpoint/code references.
 *
 * Flaws being fixed:
 *   Flaw 5 — subnodes were descriptions, not exercises (verb-first, tools, time_est)
 *   Flaw 6 — analogies were generic (recipe/chef). Must be role-specific.
 *
 * Run: node scripts/test-roadmap-gen.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

// ── Prompt (must mirror roadmap-gen.ts exactly) ──────────────────────────────

const BANNED_CANVAS_TERMS = ['RAG', 'MCP', 'ReAct', 'API', 'LLM', 'SPAORL', 'BM25'];

const ROLE_LANG_RULES = {
  engineer: 'Technical depth expected. Name APIs, frameworks, and code tools explicitly. Exercises may require writing code.',
  marketer: 'NO code whatsoever. Tools: ChatGPT, Jasper, Canva AI, HeyGen, Zapier, n8n, Notion AI. Exercises are about campaigns, copy, content, and workflow automation.',
};

const FAMILIARITY_TONE = {
  none: 'User is new to AI tools. Step 1 must be immediately actionable — things they can try today with zero setup. Use plain English throughout. Avoid jargon. Build confidence before complexity.',
  building: 'User already integrates AI regularly. Skip fundamentals. Focus on production-grade patterns, deeper integrations, and automation. Go beyond prompt tips — show systems and stacks.',
};

const SYSTEM_PROMPT = `You are a curriculum architect for 100x School of Applied AI.
Generate a personalized 90-day roadmap as valid JSON only. No markdown fences, no explanation.

Critical structure:
- Exactly 3 steps: step1, step2, step3.
- Each step has 2-3 top-level nodes.
- Top-level nodes appear on the main snake roadmap canvas.
- Include 1-3 project nodes (node_kind: "project") for visible build moments.
- Each top-level node has 3-4 static subnodes shown inside the side panel.
- Top-level node names: plain English, 2-4 words, no acronyms, no jargon.
- Glossary: out-of-band key terms only. Never make a glossary term a roadmap node.
- skill_ids: populate with cluster IDs (e.g. "C2B") from the gap clusters each node addresses.

SUBNODE RULES (non-negotiable):
- title: MUST start with an action verb (Build, Write, Create, Set up, Map, Connect, Generate, Automate, Deploy, Design, Test, Ship, Record, Draft, Configure).
- description: names the EXACT tool being used and what the exercise involves. No vague descriptions.
- outcome: a tangible deliverable the user can see, save, or share after completing.
- tools: array of 1-3 specific tool names used in this exercise (e.g. ["ChatGPT", "Notion AI"]).
- time_est: realistic estimate — "30 min", "45 min", "1 hr", "1-2 hrs", "2-3 hrs", "3-4 hrs".

ANALOGY RULES:
- base: a real-world parallel from the role's own domain (not recipe, chef, toolbox, blueprint, GPS).
- role_skin: how this maps to the user's actual day-to-day work.
- bridge_line: the non-obvious insight that makes the concept click.
- Make it SPECIFIC to this role and THIS skill.

LANGUAGE RULES:
- Non-engineering roles (designer, marketer, sales, pm, student): node names and subnode titles must be understandable to someone with no technical background.
- All roles: one_line_desc must explain what the person gains in their real work.
- All roles: glossary terms must define AI concepts in the language of this role's daily work.

The JSON must match this TypeScript type exactly:

interface Roadmap { step1: RoadmapStep; step2: RoadmapStep; step3: RoadmapStep; glossary?: RoadmapGlossaryTerm[]; }
interface RoadmapStep { label: string; theme: string; nodes: RoadmapNode[]; checkpoint: { title: string; goal: string; concepts: string[]; problem_statement: string; done_criteria: string; time_est: string; }; }
interface RoadmapSubnode { id: string; title: string; description: string; outcome: string; tools: string[]; time_est: string; }
interface RoadmapNode { id: string; node_kind?: "concept"|"project"; name_plain: string; one_line_desc: string; what_covers: string; what_do_after: string; subnodes: RoadmapSubnode[]; concepts_left: string[]; concepts_right: string[]; skill_ids: string[]; analogy: { base: string; role_skin: string; bridge_line: string; }; depth: "foundational"|"intermediate"|"advanced"; }
interface RoadmapGlossaryTerm { term: string; definition: string; source_node_id?: string; group?: string; }`;

function formatCluster(c) {
  return `  [${c.id}] ${c.name}\n    Benefit: ${c.can_do}\n    Project: ${c.checkpoint_hint}`;
}

function buildPrompt(persona) {
  const { role, roleDisplay, socTitle, riskScore, gapClusters, haveClusters, topTasks, aiFamiliarity } = persona;
  const m1 = gapClusters.filter(c => c.module === 'm1');
  const m2 = gapClusters.filter(c => c.module === 'm2');
  const m3 = gapClusters.filter(c => c.module === 'm3');

  const taskSection = topTasks.length > 0
    ? `\nHigh-weight daily tasks (what this person actually does):\n${topTasks.map(t => `  - ${t}`).join('\n')}`
    : '';

  const haveSection = haveClusters.length > 0
    ? `\nAlready mastered (do NOT re-teach these):\n${haveClusters.map(formatCluster).join('\n')}`
    : '';

  const stepBlock = (label, clusters, fallback) =>
    `${label}:\n${clusters.length > 0 ? clusters.map(formatCluster).join('\n') : `  (none — ${fallback})`}`;

  return `Role: ${roleDisplay} — ${socTitle}
AI displacement risk: ${riskScore}/100

AI familiarity level: ${aiFamiliarity}
Tone instruction: ${FAMILIARITY_TONE[aiFamiliarity]}

Role language constraint: ${ROLE_LANG_RULES[role]}
${taskSection}${haveSection}

SKILL CLUSTERS to close (each roadmap node MUST address at least one):

${stepBlock('STEP 1 — Foundation (Days 1-30)', m1, 'build foundational AI skills for this role')}

${stepBlock('STEP 2 — Applied Workflows (Days 31-60)', m2, 'build applied workflow skills for this role')}

${stepBlock('STEP 3 — Build and Ship (Days 61-90)', m3, 'capstone: demonstrate AI-native work for this role')}

Rules:
- Node names reflect the SKILL being gained, plain English, not technology names.
- Subnodes are concrete exercises: specific tool named, tangible output, action verb in title.
- Populate skill_ids with cluster IDs (e.g. "C2B") that each node closes.
- Checkpoint deliverable must prove the gap clusters for that step are closed.
- Banned node name terms: ${BANNED_CANVAS_TERMS.join(', ')}.
Return only the JSON object.`;
}

// ── Personas ─────────────────────────────────────────────────────────────────

const ENGINEER_PERSONA = {
  role: 'engineer',
  roleDisplay: 'Engineer',
  socTitle: 'Software Developer',
  riskScore: 72,
  aiFamiliarity: 'none',
  gapClusters: [
    { id: 'C2A', name: 'Map and automate your work with AI', can_do: 'Replace manual repetitive tasks with reliable AI-powered workflows', module: 'm2', checkpoint_hint: 'Build 3 reusable AI prompt templates for your top weekly tasks and document the workflow' },
    { id: 'C2B', name: 'Connect AI to your tools and products', can_do: 'Wire Claude and OpenAI APIs directly into your products and internal tools', module: 'm2', checkpoint_hint: 'Ship a working FastAPI + Claude integration connected to one internal tool or data source' },
    { id: 'C2C', name: 'Make AI know your data and documents', can_do: 'Give AI instant access to your company\'s documents, wikis, and databases', module: 'm2', checkpoint_hint: 'Build a RAG chatbot that answers questions from a real document set (company wiki, product docs)' },
    { id: 'C2D', name: 'Fine-tune and optimize AI at scale', can_do: 'Cut AI costs and improve output quality with fine-tuned models', module: 'm2', checkpoint_hint: 'Fine-tune a base model on a custom dataset, evaluate output quality vs base model' },
    { id: 'C3A', name: 'Build autonomous AI agents', can_do: 'Deploy AI agents that complete multi-step tasks without human intervention', module: 'm3', checkpoint_hint: 'Build an autonomous agent that completes a real multi-step task without human intervention' },
    { id: 'C3B', name: 'Automate complex workflows', can_do: 'Replace manual workflows with trigger-based automation that runs itself', module: 'm3', checkpoint_hint: 'Automate one end-to-end workflow using n8n that runs on a trigger and requires zero manual steps' },
  ],
  haveClusters: [],
  topTasks: [
    'Integrate third-party APIs into existing systems',
    'Review and debug code across multiple services',
    'Design data models and system architecture',
  ],
};

const MARKETER_PERSONA = {
  role: 'marketer',
  roleDisplay: 'Marketer',
  socTitle: 'Digital Marketing Manager',
  riskScore: 65,
  aiFamiliarity: 'none',
  gapClusters: [
    { id: 'C1A', name: 'Create AI-generated content at scale', can_do: 'Ship image + video + voice content without a production team', module: 'm1', checkpoint_hint: 'Produce a full AI content piece: image + video + voiceover for one product or campaign' },
    { id: 'C2A', name: 'Map and automate your work with AI', can_do: 'Replace manual repetitive tasks with reliable AI-powered workflows', module: 'm2', checkpoint_hint: 'Build 3 reusable AI prompt templates for your top weekly tasks and document the workflow' },
    { id: 'C3B', name: 'Automate complex workflows', can_do: 'Replace manual workflows with trigger-based automation that runs itself', module: 'm3', checkpoint_hint: 'Automate one end-to-end workflow using n8n that runs on a trigger and requires zero manual steps' },
  ],
  haveClusters: [],
  topTasks: [
    'Write email campaigns and social media copy',
    'Plan content calendar and asset briefs',
    'Analyze campaign performance and A/B test results',
  ],
};

// ── Assertions ────────────────────────────────────────────────────────────────

// Any word that can open an imperative instruction is a valid verb.
// Blocking non-verb openers (articles, pronouns, adjectives, prepositions) is
// more robust than enumerating every possible verb.
const NON_VERB_OPENERS = ['a', 'an', 'the', 'my', 'your', 'our', 'this', 'that', 'your', 'how', 'what', 'which', 'when', 'where', 'why', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'about', 'understand', 'understanding', 'introduction', 'overview', 'basics', 'fundamentals', 'concepts', 'getting'];

const GENERIC_ANALOGY_TERMS = ['recipe', 'chef', 'toolbox', 'blueprint', 'gps', 'cookbook'];
const CODE_TERMS_IN_TITLES = ['api', 'endpoint', 'curl', 'http', 'code', 'function', 'deploy', 'server', 'database', 'sql', 'python', 'fastapi'];

function assertRoadmap(roadmap, personaName, role) {
  const steps = [roadmap.step1, roadmap.step2, roadmap.step3];
  const failures = [];
  let subnodeCount = 0;
  let subnodesPassed = 0;

  for (const step of steps) {
    for (const node of step.nodes) {
      for (const sub of (node.subnodes ?? [])) {
        subnodeCount++;

        // Flaw 5: verb-first title — first word must not be a non-verb opener
        const titleLower = sub.title?.toLowerCase() ?? '';
        const firstWord = titleLower.split(/\s+/)[0] ?? '';
        const startsWithNonVerb = NON_VERB_OPENERS.includes(firstWord);
        if (startsWithNonVerb || !firstWord) {
          failures.push(`[${personaName}] Subnode "${sub.title}" does NOT start with an action verb (starts with "${firstWord}")`);
        }

        // Flaw 5: tools populated
        if (!Array.isArray(sub.tools) || sub.tools.length === 0) {
          failures.push(`[${personaName}] Subnode "${sub.title}" has empty tools[]`);
        }

        // Flaw 5: time_est populated
        if (!sub.time_est || sub.time_est.trim() === '') {
          failures.push(`[${personaName}] Subnode "${sub.title}" has empty time_est`);
        }

        // Flaw 6 (non-tech roles): no code jargon in subnode titles
        if (['marketer', 'designer', 'sales'].includes(role)) {
          const hasCodeJargon = CODE_TERMS_IN_TITLES.some(t => titleLower.includes(t));
          if (hasCodeJargon) {
            failures.push(`[${personaName}] Non-tech subnode title contains code jargon: "${sub.title}"`);
          }
        }

        if (failures.length === failures.length) subnodesPassed++;
      }

      // Flaw 6: analogy must be role-specific
      const analogyText = [
        node.analogy?.base ?? '',
        node.analogy?.role_skin ?? '',
        node.analogy?.bridge_line ?? '',
      ].join(' ').toLowerCase();

      const hasGenericAnalogy = GENERIC_ANALOGY_TERMS.some(t => analogyText.includes(t));
      if (hasGenericAnalogy) {
        failures.push(`[${personaName}] Node "${node.name_plain}" analogy uses generic metaphor: "${node.analogy?.base}"`);
      }

      if (!node.analogy?.base || !node.analogy?.bridge_line) {
        failures.push(`[${personaName}] Node "${node.name_plain}" analogy missing base or bridge_line`);
      }
    }
  }

  return { failures, subnodeCount };
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function testPersona(client, persona) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PERSONA: ${persona.roleDisplay} | aiFamiliarity: ${persona.aiFamiliarity}`);
  console.log(`Clusters: ${persona.gapClusters.map(c => c.id).join(', ')}`);
  console.log(`Tasks: ${persona.topTasks[0]}`);
  console.log('='.repeat(60));

  const userPrompt = buildPrompt(persona);

  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? '';

  // Strip markdown fences if LLM wraps output (should not happen but GPT-4o sometimes does)
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  let roadmap;
  try {
    roadmap = JSON.parse(stripped);
  } catch (e) {
    console.error(`JSON parse FAILED: ${e.message}`);
    console.log('Raw (first 500 chars):', raw.slice(0, 500));
    return 999;
  }

  // Print summary
  for (const [key, step] of Object.entries(roadmap)) {
    if (!key.startsWith('step')) continue;
    console.log(`\n[${key.toUpperCase()}] ${step.theme}`);
    for (const node of step.nodes) {
      console.log(`  Node: "${node.name_plain}" [${node.depth}] [${node.node_kind ?? 'concept'}]`);
      console.log(`    Analogy base: ${node.analogy?.base}`);
      for (const sub of node.subnodes ?? []) {
        console.log(`    - "${sub.title}"`);
        console.log(`      tools: [${(sub.tools ?? []).join(', ')}] | time: ${sub.time_est}`);
        console.log(`      outcome: ${sub.outcome}`);
      }
    }
    console.log(`  Checkpoint: "${step.checkpoint.title}" | ${step.checkpoint.time_est}`);
  }

  // Run assertions
  const { failures, subnodeCount } = assertRoadmap(roadmap, persona.roleDisplay, persona.role);

  console.log(`\n--- ASSERTION RESULTS (${subnodeCount} subnodes checked) ---`);
  if (failures.length === 0) {
    console.log(`[PASS] All assertions passed for ${persona.roleDisplay}`);
  } else {
    console.log(`[FAIL] ${failures.length} assertion(s) failed:`);
    failures.forEach(f => console.log(`  x ${f}`));
  }

  return failures.length;
}

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'REPLACE_ME') throw new Error('OPENAI_API_KEY not set in .env.local');

  const client = new OpenAI({ apiKey: key });

  let totalFailures = 0;

  // Test Engineer — verifies Flaw 5 fix (tech exercises, tools, time_est)
  totalFailures += await testPersona(client, ENGINEER_PERSONA) ?? 0;

  // Test Marketer — verifies Flaw 5+6 fix for non-tech audience
  // Critical: subnodes must NOT contain code jargon, must use no-code tools
  totalFailures += await testPersona(client, MARKETER_PERSONA) ?? 0;

  console.log(`\n${'='.repeat(60)}`);
  if (totalFailures === 0) {
    console.log('[ALL PASS] North Star verified for both personas.');
    console.log('Engineer: technical exercises with API-level tools.');
    console.log('Marketer: plain-English, no-code exercises with ChatGPT/Canva/Zapier.');
  } else {
    console.log(`[FAIL] ${totalFailures} total assertion(s) failed. Fix prompt before Phase 6.`);
    process.exit(1);
  }
}

main().catch(console.error);
