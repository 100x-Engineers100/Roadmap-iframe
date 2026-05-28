/**
 * aaa-phase-map.mjs — Fallback node pool when /api/gap-inference fails.
 * Each role has 3 assisted + 3 accelerated + 3 autonomous = 9 nodes.
 * sliceByFamiliarity() returns the correct subset per ai_familiarity level:
 *   none        → 3A + 3AC + 2AU = 8 nodes
 *   basic       → 2A + 3AC + 2AU = 7 nodes
 *   intermediate → 1A + 3AC + 3AU = 7 nodes
 *   advanced    → 0A + 3AC + 3AU = 6 nodes
 *
 * All skill_ids are valid S-IDs from SKILL_REGISTRY.
 * All titles are outcome statements, not capability labels.
 */

// Code/API/server tools non-tech roles (marketer, designer, sales) must never receive.
export const NON_TECH_TOOL_BLOCKLIST = [
  'FastAPI',
  'Claude API',
  'OpenAI API',
  'LangChain',
  'LlamaIndex',
  'Pinecone',
  'Redis',
  'Supabase',
  'Supabase pgvector',
  'LangGraph',
  'CrewAI',
  'AutoGen',
  'Axolotl',
  'LLaMA Factory',
  'LlamaGuard',
  'LangSmith',
  'Langfuse',
  'MCP SDK',
  'Claude MCP',
  'LangFlow',
  'Hugging Face',
];

const FAMILIARITY_SLICES = {
  none:         { assisted: 3, accelerated: 3, autonomous: 2 },
  basic:        { assisted: 2, accelerated: 3, autonomous: 2 },
  intermediate: { assisted: 1, accelerated: 3, autonomous: 3 },
  advanced:     { assisted: 0, accelerated: 3, autonomous: 3 },
};

/**
 * Returns ordered nodes for the given role + familiarity.
 * Order: all assisted first, then accelerated, then autonomous — matching AAA spine progression.
 */
export function sliceByFamiliarity(role, ai_familiarity) {
  const nodes = AAA_PHASE_MAP[role];
  if (!nodes) return [];
  const slice = FAMILIARITY_SLICES[ai_familiarity] ?? FAMILIARITY_SLICES.none;
  const assisted     = nodes.filter(n => n.phase === 'assisted').slice(0, slice.assisted);
  const accelerated  = nodes.filter(n => n.phase === 'accelerated').slice(0, slice.accelerated);
  const autonomous   = nodes.filter(n => n.phase === 'autonomous').slice(0, slice.autonomous);
  return [...assisted, ...accelerated, ...autonomous];
}

export const AAA_PHASE_MAP = {
  marketer: [
    // ── ASSISTED ──
    { phase: 'assisted',    title: 'Map which tasks in your week AI can take over right now',             skill_ids: ['S2.1', 'S2.2'] },
    { phase: 'assisted',    title: 'Produce a spokesperson video without hiring anyone',                  skill_ids: ['S1.6', 'S1.4'] },
    { phase: 'assisted',    title: 'Generate 20 on-brand image variants from one product reference',      skill_ids: ['S1.1', 'S1.2'] },
    // ── ACCELERATED ──
    { phase: 'accelerated', title: 'Build your AVTV pipeline: script to published in one session',       skill_ids: ['S1.7', 'S1.5'] },
    { phase: 'accelerated', title: 'Auto-publish AI content across channels without touching it',        skill_ids: ['S3.2', 'S2.2'] },
    { phase: 'accelerated', title: 'Train a brand LoRA so your visual style generates without re-prompting', skill_ids: ['S1.3', 'S1.8'] },
    // ── AUTONOMOUS ──
    { phase: 'autonomous',  title: 'New brief in — content published — zero manual steps',              skill_ids: ['S3.4', 'S3.2'] },
    { phase: 'autonomous',  title: 'Your full content operation running itself',                         skill_ids: ['S3.4', 'S1.7', 'S2.2'] },
    { phase: 'autonomous',  title: 'Run a 90-day campaign calendar from a single brief, autonomously',  skill_ids: ['S3.4', 'S1.5'] },
  ],

  sales: [
    // ── ASSISTED ──
    { phase: 'assisted',    title: "Research a prospect's signals and pain in 5 minutes",                skill_ids: ['S2.1', 'S2.2'] },
    { phase: 'assisted',    title: 'Write 20 personalised outreach messages from one template',          skill_ids: ['S2.2', 'S1.6'] },
    { phase: 'assisted',    title: 'Turn any call transcript into a CRM note and follow-up in 2 minutes', skill_ids: ['S2.2', 'S2.1'] },
    // ── ACCELERATED ──
    { phase: 'accelerated', title: 'Prep for any demo in 15 minutes with AI-built materials',           skill_ids: ['S2.2', 'S1.7'] },
    { phase: 'accelerated', title: 'Auto-log every call summary to CRM without typing',                 skill_ids: ['S3.2', 'S2.2'] },
    { phase: 'accelerated', title: 'Build a personalised email sequence that adapts to each prospect',  skill_ids: ['S3.2', 'S2.1'] },
    // ── AUTONOMOUS ──
    { phase: 'autonomous',  title: 'Prospect research that runs on a trigger, not your time',           skill_ids: ['S3.2', 'S3.4'] },
    { phase: 'autonomous',  title: 'Research — personalise — follow up, fully automated',              skill_ids: ['S3.4', 'S3.2', 'S2.2'] },
    { phase: 'autonomous',  title: 'Your entire outbound pipeline running 24/7 without you',            skill_ids: ['S3.4', 'S3.2'] },
  ],

  pm: [
    // ── ASSISTED ──
    { phase: 'assisted',    title: 'Map which parts of your week AI can take over right now',            skill_ids: ['S2.1', 'S2.2'] },
    { phase: 'assisted',    title: 'Turn 30 user interviews into a prioritised brief in an hour',        skill_ids: ['S2.2', 'S2.4'] },
    { phase: 'assisted',    title: 'Write a PRD with requirements, edge cases, and acceptance criteria in 30 minutes', skill_ids: ['S2.2', 'S2.1'] },
    // ── ACCELERATED ──
    { phase: 'accelerated', title: 'Go from PRD to deployed MVP without writing code',                  skill_ids: ['S2.11', 'S2.2'] },
    { phase: 'accelerated', title: 'Build a ticket triage or ops workflow that handles itself',         skill_ids: ['S3.2', 'S2.8'] },
    { phase: 'accelerated', title: 'Automate stakeholder updates: extract sprint data and send summaries automatically', skill_ids: ['S3.2', 'S2.2'] },
    // ── AUTONOMOUS ──
    { phase: 'autonomous',  title: 'Design an AI agent system your team can run and trust',             skill_ids: ['S3.1', 'S3.3'] },
    { phase: 'autonomous',  title: 'Research — ship — iterate, running continuously',                  skill_ids: ['S3.4', 'S2.11', 'S3.1'] },
    { phase: 'autonomous',  title: 'Your product ops cycle running itself: metrics, decisions, next sprint', skill_ids: ['S3.4', 'S3.1'] },
  ],

  designer: [
    // ── ASSISTED ──
    { phase: 'assisted',    title: 'Generate 20 on-brand image variants from one reference',            skill_ids: ['S1.1', 'S1.2'] },
    { phase: 'assisted',    title: 'Train a LoRA so your brand style generates itself',                 skill_ids: ['S1.3', 'S1.2'] },
    { phase: 'assisted',    title: 'Write a system prompt that turns Claude into your client creative director', skill_ids: ['S2.2', 'S2.1'] },
    // ── ACCELERATED ──
    { phase: 'accelerated', title: 'Create AI video content without a director or shoot',              skill_ids: ['S1.4', 'S1.8'] },
    { phase: 'accelerated', title: 'Build a consistent AI persona for any client brief',               skill_ids: ['S1.5', 'S1.4'] },
    { phase: 'accelerated', title: 'Produce a full AI campaign ad from brief to export in one session', skill_ids: ['S1.8', 'S1.7'] },
    // ── AUTONOMOUS ──
    { phase: 'autonomous',  title: 'Deliver a full campaign asset set from one brief',                 skill_ids: ['S1.7', 'S3.2'] },
    { phase: 'autonomous',  title: 'Brief in — assets out, no manual production steps',               skill_ids: ['S3.4', 'S1.7', 'S2.2'] },
    { phase: 'autonomous',  title: 'Your creative pipeline running itself: brief to assets to delivery', skill_ids: ['S3.4', 'S3.2'] },
  ],

  engineer: [
    // ── ASSISTED ──
    { phase: 'assisted',    title: 'Diagnose why your LLM is failing and fix it with a framework',     skill_ids: ['S2.1', 'S2.2'] },
    { phase: 'assisted',    title: 'Wire any LLM into your product via FastAPI and tool calling',      skill_ids: ['S2.3', 'S2.8'] },
    { phase: 'assisted',    title: 'Build structured output so AI returns data your system can use',   skill_ids: ['S2.2', 'S2.3'] },
    // ── ACCELERATED ──
    { phase: 'accelerated', title: 'Build RAG that cuts hallucinations from 38% to under 10%',        skill_ids: ['S2.4', 'S2.5', 'S2.6'] },
    { phase: 'accelerated', title: 'Expose any internal tool to AI via MCP in one afternoon',         skill_ids: ['S2.7', 'S2.8'] },
    { phase: 'accelerated', title: 'Add memory to your LLM system so it learns from past sessions',   skill_ids: ['S2.6', 'S2.4'] },
    // ── AUTONOMOUS ──
    { phase: 'autonomous',  title: 'Ship a production agent with guardrails, evals, and HITL',        skill_ids: ['S3.1', 'S3.5', 'S3.6'] },
    { phase: 'autonomous',  title: 'Deploy a cost-optimised system that observes and improves',        skill_ids: ['S2.9', 'S2.10', 'S3.3'] },
    { phase: 'autonomous',  title: 'Build a multi-agent system that handles complex tasks end-to-end', skill_ids: ['S3.3', 'S3.1', 'S3.4'] },
  ],

  student: [
    // ── ASSISTED ──
    { phase: 'assisted',    title: 'Map your learning path and cover ground 3x faster with AI',        skill_ids: ['S2.1', 'S2.2'] },
    { phase: 'assisted',    title: 'Go from idea to deployed project in one weekend',                  skill_ids: ['S2.11', 'S2.3'] },
    { phase: 'assisted',    title: 'Build a study assistant that teaches any topic from your own notes', skill_ids: ['S2.2', 'S2.4'] },
    // ── ACCELERATED ──
    { phase: 'accelerated', title: 'Build a RAG chatbot that answers from your own documents',        skill_ids: ['S2.4', 'S2.5'] },
    { phase: 'accelerated', title: 'Connect AI to real tools and data with MCP and n8n',              skill_ids: ['S2.7', 'S3.2'] },
    { phase: 'accelerated', title: 'Build an API that any frontend can call to run an AI feature',    skill_ids: ['S2.3', 'S2.8'] },
    // ── AUTONOMOUS ──
    { phase: 'autonomous',  title: 'Build and deploy an autonomous agent with a real use case',       skill_ids: ['S3.1', 'S3.3'] },
    { phase: 'autonomous',  title: 'Ship a portfolio project that proves engineering depth',           skill_ids: ['S3.4', 'S2.9', 'S3.6'] },
    { phase: 'autonomous',  title: 'Run a production-grade multi-agent system from start to ship',    skill_ids: ['S3.3', 'S3.1', 'S3.4'] },
  ],
};
