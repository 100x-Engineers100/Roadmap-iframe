import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm/provider';
import {
  sliceByFamiliarity,
  AAA_PHASE_MAP,
} from '@/lib/roadmap/aaa-phase-map.mjs';
import type {
  RoleCategory,
  WorkContext,
  AiFamiliarity,
  OnetTask,
  TaskWeight,
  GapInferenceNode,
  GapInferenceResult,
  JourneyAnalogy,
  AAAPhase,
} from '@/types';

// ── Valid S-IDs (SKILL_REGISTRY) ──────────────────────────────────────────────
const VALID_SKILL_IDS = new Set([
  'S1.1','S1.2','S1.3','S1.4','S1.5','S1.6','S1.7','S1.8',
  'S2.1','S2.2','S2.3','S2.4','S2.5','S2.6','S2.7','S2.8','S2.9','S2.10','S2.11',
  'S3.1','S3.2','S3.3','S3.4','S3.5','S3.6',
]);

// ── AAA distribution per familiarity level ────────────────────────────────────
const FAMILIARITY_SLICES: Record<AiFamiliarity, { assisted: number; accelerated: number; autonomous: number }> = {
  none:         { assisted: 3, accelerated: 3, autonomous: 2 },
  basic:        { assisted: 2, accelerated: 3, autonomous: 2 },
  intermediate: { assisted: 1, accelerated: 3, autonomous: 3 },
  advanced:     { assisted: 0, accelerated: 3, autonomous: 3 },
};

// ── Role tool stacks ──────────────────────────────────────────────────────────
const ROLE_TOOLS: Record<RoleCategory, string[]> = {
  marketer:  ['Claude', 'ChatGPT', 'Midjourney', 'FLUX', 'HeyGen', 'ElevenLabs', 'n8n', 'CapCut', 'FreePik Spaces', 'Suno'],
  designer:  ['Claude', 'ChatGPT', 'Midjourney', 'FLUX', 'HeyGen', 'ElevenLabs', 'n8n', 'CapCut', 'FreePik Spaces', 'ComfyUI'],
  sales:     ['Claude', 'n8n', 'Clay', 'HubSpot', 'Apollo', 'LinkedIn'],
  pm:        ['Claude', 'Lovable', 'Cursor', 'Linear', 'n8n', 'Notion'],
  engineer:  ['FastAPI', 'Supabase', 'LangSmith', 'Langfuse', 'LangChain', 'LangGraph', 'CrewAI', 'MCP SDK'],
  student:   ['Claude', 'Cursor', 'FastAPI', 'Supabase', 'n8n', 'Vercel'],
};

// ── Fallback journey analogies per role ───────────────────────────────────────
const FALLBACK_ANALOGIES: Record<RoleCategory, JourneyAnalogy> = {
  marketer: {
    frame: 'Going from hand-crafting every campaign to running a content engine that refills from your brief',
    phase_1_meaning: 'You write and launch every piece manually — AI helps you produce faster but you drive every step',
    phase_2_meaning: 'You build pipeline templates that run when you trigger them — one brief generates all variants',
    phase_3_meaning: 'Brief goes in, the engine routes it through creation, approval and publishing without you in the loop',
  },
  designer: {
    frame: 'Going from manually producing every visual asset per brief to having your brand system generate consistent outputs from any brief',
    phase_1_meaning: 'You produce every asset manually — AI generates options but you select and re-prompt each time',
    phase_2_meaning: 'You set up brand-locked templates and production pipelines — trigger once per brief and assets come out consistent',
    phase_3_meaning: 'Client brief goes in, the brand-matched asset set comes out — no per-asset decisions or manual sourcing',
  },
  sales: {
    frame: 'Going from writing every prospect brief by hand to getting call-ready research prepared before every conversation',
    phase_1_meaning: 'You research and write every message manually — AI speeds each step but you run every one',
    phase_2_meaning: 'You build a sequence pipeline that runs on your trigger — one prospect list in, personalised messages and CRM entries out',
    phase_3_meaning: 'New lead hits your pipeline, the system researches them, drafts outreach, logs the call — you review the summary and move to close',
  },
  pm: {
    frame: 'Going from writing every product brief and synthesis manually to getting structured insight ready before each product decision',
    phase_1_meaning: 'You synthesize every call and write every brief yourself — Claude helps you draft faster but you drive each one',
    phase_2_meaning: 'You build templates and pipelines that auto-structure call output — trigger once after each call, structured insight lands in Notion',
    phase_3_meaning: 'Calls auto-route to structured summaries, launch scope updates itself, and discovery gaps surface without you pulling the thread',
  },
  engineer: {
    frame: 'Going from manually wiring every API integration to shipping features your system monitors and validates automatically',
    phase_1_meaning: 'You write every integration — AI helps you build and debug each feature but you drive every session',
    phase_2_meaning: 'You build automated evaluation pipelines — they run on every deploy and report quality without you watching',
    phase_3_meaning: 'Your systems catch their own edge cases, log anomalies, and escalate only what needs a human decision',
  },
  student: {
    frame: 'Going from spending a week on each portfolio project to shipping a working demo in one focused day',
    phase_1_meaning: 'You build each feature with AI assistance — Cursor and Claude speed the code but you run every session',
    phase_2_meaning: 'You wire up reusable templates and CI pipelines — push to GitHub and Vercel deploys automatically',
    phase_3_meaning: 'Your portfolio projects run, collect usage data, and surface errors on their own — you review what real users do and ship the next feature',
  },
};

// ── System prompt (full curriculum — all terms, compressed format) ────────────
const SYSTEM_PROMPT = `You are a 100x Engineers curriculum architect. Select and sequence 5-9 AI capability nodes for this specific person, grounded entirely in the 100x curriculum below. Every node must trace to something 100x actually teaches.

=== 100X SKILL REGISTRY (S-ID → concept) ===
Use these exact S-IDs in skill_ids. Pick the IDs whose concepts match the node's focus.
S1.1=AI Image Generation (Midjourney/DALL-E, prompt precision, style variants)
S1.2=Visual Style Consistency (IP Adapters, ControlNet, FLUX Redux, brand locking)
S1.3=Brand AI Training (LoRA training, 15-25 ref images, AI Toolkit, JavasLabs)
S1.4=AI Video Creation (Kling, WAN, image-to-video, text-to-video clips)
S1.5=AI Influencer Personas (FreePik Spaces, 9-image reference set, consistent AI persona)
S1.6=AI Spokesperson Pipeline (HeyGen, ElevenLabs, digital spokesperson, multi-language)
S1.7=AVTV Production Stack (Script→Avatar→Voice→B-roll→Edit→Publish full pipeline)
S1.8=AI Short Film Workflow (6-phase filmmaking: narrative→character→storyboard→scenes→video→combine)
S2.1=Workflow Mapping OPT (Operating Model→Processes→Tasks — map before automating)
S2.2=Prompt Engineering (system prompt, few-shot, chain-of-thought, role prompting, structured output, temperature, context window)
S2.3=LLM API Integration (FastAPI, Claude API, OpenAI API, tool calling, JSON schema, structured output)
S2.4=Document RAG — Naive (chunking strategies: fixed/semantic/recursive, embeddings, vector databases, Supabase pgvector, LlamaIndex)
S2.5=Advanced RAG (hybrid search: BM25+vector, re-ranking: cross-encoder, query expansion, Pinecone, retrieval quality)
S2.6=AI Memory Systems (Redis, conversation memory, episodic memory, cross-session context, memory RAG)
S2.7=MCP Protocol (Model Context Protocol — standard for connecting AI to external systems, MCP SDK, Claude MCP)
S2.8=AI Tool Calling (tool definitions, function calling, OpenAI/Claude tools, database/API/workflow actions)
S2.9=LoRA Fine-tuning (Axolotl, LLaMA Factory, 50+ examples, adapter training, base model comparison)
S2.10=LLM Cost Optimisation (model tiering, Redis caching, latency vs cost, LangSmith/Langfuse tracing, observability)
S2.11=Ship Cycle (PRD→Lovable→GitHub→Cursor→Claude Code→deploy — no-code product shipping)
S3.1=ReAct Agent Loop (Thought→Action→Observation interleaved, tool-using agents, n8n, multi-step tasks)
S3.2=No-Code Automation (n8n drag-and-drop, trigger→AI node→output, workflow automation without code)
S3.3=Multi-Agent Orchestration (Manager-Worker/Handoff/Routing/Parallelization/Orchestrator-Worker/Evaluator-Optimizer, CrewAI, LangGraph)
S3.4=Agentic Pipeline Design (trigger→execute→output loop, event-driven autonomy, pipeline architecture)
S3.5=Agent Safety Guardrails (LlamaGuard 7-category safety classification, intent classification before tool calls, unsafe action prevention)
S3.6=LLM Evaluation (LLM-as-Judge, quality rubric design, automated regression detection, 5-criterion scoring, LangSmith, quality threshold)

=== 100X CURRICULUM ===

AAA PROGRESSION:
- Assisted: AI helps you. You trigger every action. You are present every time.
- Accelerated: You set up workflows. You decide when they run.
- Autonomous: System triggers it. You review output. Not in loop for every step.

MODULE 1 — AI CONTENT CREATION:
Topics: diffusion models, image generation, text-to-image, image-to-image, style transfer, IP Adapters, ControlNet, LoRA style training, FLUX, Midjourney, DALL-E, ComfyUI, AVTV pipeline (Script→HeyGen+ElevenLabs→FreePik Spaces→Edit(After Effects/Premiere/CapCut)→Suno→Publish), AI spokesperson (HeyGen/Kling), voice synthesis (ElevenLabs), AI influencer personas, FreePik Spaces, brand consistency, AI short film 6 phases (narrative→character design→storyboard→scene generation→video assembly→combine/post)
Constraint: Cannot fully automate a YouTube channel — idea/structure/perspective remain human.
Mental model: output-first creation — define the artifact before choosing the tool.

MODULE 2 — FULL STACK LLM:
Topics: LLMs (GPT/Claude/Gemini/Llama), tokens, context window, inference cost, temperature, hallucination (f(Uncertainty × Forced Response)), system prompt, few-shot prompting, chain-of-thought, role prompting, structured output, JSON schema, FastAPI, Supabase, PostgreSQL, naive RAG (chunking→embeddings→vector store→retrieve), advanced RAG (hybrid search BM25+vector, cross-encoder re-ranking, query expansion), memory RAG (Redis, episodic memory, conversation history), Supabase pgvector, Pinecone, LlamaIndex, MCP (Model Context Protocol — standard for AI↔external system connections), tool calling, function calling, fine-tuning, LoRA, Axolotl, LLaMA Factory, Ship Cycle (PRD→Lovable→GitHub→Cursor→deploy)
KEY FRAMEWORK — OPT (Operating Model→Processes→Tasks): Map full operating model → identify repeatable processes → break into discrete tasks AI can own. Cannot automate what you have not mapped.
KEY FRAMEWORK — PPT (Principle→Process→Tool): Start with outcome, design the process, only then pick tools. 4 questions: What is input/output? What is the process? What is the first principle? Which part can you build yourself?
KEY FRAMEWORK — Two-lever: Lever 1=context failure (fix: RAG/tools/examples). Lever 2=behaviour failure (fix: fine-tuning/LoRA). Diagnose before you build.
Augmented LLM = LLM + Knowledge + Capabilities + Controller. Build this before agents.
Mental model: diagnose before you build.

MODULE 3 — AI AGENTS:
Topics: ReAct loop (Thought→Action→Observation interleaved reasoning+acting), SPAORL (Sense→Plan→Act→Observe→Reflect→Adapt — ADAPT is last step, NOT Loop), n8n workflows, event-driven automation, HITL checkpoints (trigger on: confidence threshold / irreversible action / cost threshold), input guardrails (prompt injection defence, PII scrubbing), output guardrails (hallucination check, format validation, toxicity filter), LlamaGuard, Ragas eval, BLEU, LangSmith, Langfuse, orchestrator+subagent, agentic pipelines, AutoGen, CrewAI, LangGraph
6 MULTI-AGENT PATTERNS (exact names — no others):
  1. Manager-Worker (orchestrator + N workers)
  2. Handoff (A completes → passes full context to B)
  3. Routing (router assigns to specialist)
  4. Parallelization (same task → N agents → consensus)
  5. Orchestrator-Worker (dynamic task decomposition at runtime)
  6. Evaluator-Optimizer (generate → critique → iterate)
KEY RULE — 95% rule: 95% of production use cases are better solved with LLM chains + deterministic workflows than autonomous agents. Default to NOT agents. Agent pipelines cost 64.9% more. Only reach for agents when the task is genuinely open-ended, multi-step, and cannot be decomposed upfront.
Mental model: LLMs for judgment/reasoning, deterministic scripts for everything else.

ROLE TOOL STACKS (use only tools listed for the role):
marketer/designer: Claude, ChatGPT, Midjourney/FLUX, HeyGen, ElevenLabs, n8n, CapCut, FreePik Spaces, Suno, ComfyUI
sales: Claude, n8n, Clay, HubSpot, Apollo, LinkedIn
pm/founder: Claude, Lovable, Cursor, Linear, n8n, Notion
engineer: FastAPI, Supabase, LangSmith, Langfuse, LangChain, LangGraph, CrewAI, MCP SDK, OpenAI API, Claude API, Axolotl, LlamaGuard
student: Claude, Cursor, FastAPI, Supabase, n8n, Vercel, LlamaIndex

SEQUENCING RULES:
- Non-tech (marketer/designer/sales): first node must be OPT (S2.1), then AVTV before agentic pipeline
- Never sequence autonomous nodes before ≥2 assisted nodes (exception: ai_familiarity=advanced)
- engineer/student: RAG (S2.4/S2.5) before agents (S3.1+)
- Confirmed clusters = skills user already has — deprioritise or skip; show growth path beyond them

=== OUTPUT RULES ===
- 5-9 nodes total, ordered Assisted → Accelerated → Autonomous
- Node titles: plain-language outcome statements ONLY. No technical terms, acronyms, tool names, or AI jargon in any title. A non-technical person reads the title and knows immediately what they will GAIN — not what technology they will use.
  BANNED in titles: OPT, RAG, FastAPI, Supabase, API, MCP, LoRA, n8n, embeddings, structured output, fine-tuning, vector, LLM, pipeline, naive, advanced, ReAct, SPAORL, retrieval, inference
  WRONG: "Map your sales workflow with OPT" → RIGHT: "Turn your 3-day prospect prep into a 5-minute brief"
  WRONG: "Build naive RAG pipeline for document retrieval" → RIGHT: "Get AI to answer questions from your own documents automatically"
  WRONG: "Set up FastAPI with Supabase backend" → RIGHT: "Ship a working backend that handles real requests from real users"
  WRONG: "Synthesize customer calls with structured output" → RIGHT: "Turn 30 customer call recordings into a prioritised brief in one hour"
- skill_ids: pick 1-3 S-IDs per node from the registry above; no duplicates within a node
- AAA distribution must match ai_familiarity exactly: none→3A+3AC+2AU | basic→2A+3AC+2AU | intermediate→1A+3AC+3AU | advanced→0A+3AC+3AU
- why_for_this_person: 1-2 sentences referencing their actual tasks and work context
- journey_analogy.frame: 8-20 words. Reference THIS person's actual work vocabulary and domain. BANNED: generic team/employee/hire metaphors ("build your own team", "junior engineer who never sleeps", "studio head"). Frame the transformation in terms of their real work — what changes for how they actually spend their day.
  WRONG: "Building your own outbound sales team that works 24/7" (generic hire metaphor — could describe any role)
  WRONG: "Running a content production studio as head of ops" (generic studio — no domain, no personal reference)
  WRONG: "Deploying your first junior backend engineer who never sleeps" (hire metaphor — not engineering work)
  RIGHT (sales, agency): "Going from writing every prospect brief by hand to getting call-ready research on demand"
  RIGHT (marketer, startup): "Going from hand-crafting every campaign to running a content engine that refills from your brief"
  RIGHT (engineer, startup): "Going from manually wiring every API integration to shipping features your system monitors and validates"
  RIGHT (student): "Going from spending a week on each portfolio project to shipping a working demo in one focused day"
- journey_analogy phase_meanings: describe what CHANGES for this person's actual daily workflow in each phase — reference their specific tasks, not generic "you trigger every action"`;

// ── JSON schema for structured output ─────────────────────────────────────────
const OUTPUT_SCHEMA = {
  name: 'gap_inference',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      nodes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title:               { type: 'string' },
            aaa_phase:           { type: 'string', enum: ['assisted', 'accelerated', 'autonomous'] },
            skill_ids:           { type: 'array', items: { type: 'string' } },
            why_for_this_person: { type: 'string' },
            tools:               { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'aaa_phase', 'skill_ids', 'why_for_this_person', 'tools'],
          additionalProperties: false,
        },
      },
      journey_analogy: {
        type: 'object',
        properties: {
          frame:            { type: 'string' },
          phase_1_meaning:  { type: 'string' },
          phase_2_meaning:  { type: 'string' },
          phase_3_meaning:  { type: 'string' },
        },
        required: ['frame', 'phase_1_meaning', 'phase_2_meaning', 'phase_3_meaning'],
        additionalProperties: false,
      },
    },
    required: ['nodes', 'journey_analogy'],
    additionalProperties: false,
  },
};

// ── Rebalance: trim excess phase nodes to hit exact distribution ───────────────
// Returns rebalanced nodes, or null if LLM didn't generate enough of a phase.
function rebalance(
  nodes: GapInferenceNode[],
  familiarity: AiFamiliarity,
): GapInferenceNode[] | null {
  const expected = FAMILIARITY_SLICES[familiarity];
  const byPhase = {
    assisted:    nodes.filter(n => n.aaa_phase === 'assisted'),
    accelerated: nodes.filter(n => n.aaa_phase === 'accelerated'),
    autonomous:  nodes.filter(n => n.aaa_phase === 'autonomous'),
  };
  if (
    byPhase.assisted.length    < expected.assisted    ||
    byPhase.accelerated.length < expected.accelerated ||
    byPhase.autonomous.length  < expected.autonomous
  ) {
    return null;
  }
  return [
    ...byPhase.assisted.slice(0, expected.assisted),
    ...byPhase.accelerated.slice(0, expected.accelerated),
    ...byPhase.autonomous.slice(0, expected.autonomous),
  ];
}

// ── Validation (after rebalance) ──────────────────────────────────────────────
function validate(
  nodes: GapInferenceNode[],
  analogy: JourneyAnalogy,
  familiarity: AiFamiliarity,
): string | null {
  if (nodes.length < 5 || nodes.length > 9)
    return `node count ${nodes.length} outside 5-9`;

  for (const node of nodes) {
    const dupes = node.skill_ids.filter((id, i) => node.skill_ids.indexOf(id) !== i);
    if (dupes.length) return `duplicate skill_ids [${dupes}] in node "${node.title}"`;

    const invalid = node.skill_ids.filter(id => !VALID_SKILL_IDS.has(id));
    if (invalid.length) return `invalid skill_ids [${invalid}] in node "${node.title}"`;
  }

  const expected = FAMILIARITY_SLICES[familiarity];
  const counts = { assisted: 0, accelerated: 0, autonomous: 0 };
  for (const n of nodes) counts[n.aaa_phase]++;
  if (
    counts.assisted    !== expected.assisted    ||
    counts.accelerated !== expected.accelerated ||
    counts.autonomous  !== expected.autonomous
  ) {
    return `AAA distribution ${JSON.stringify(counts)} ≠ expected ${JSON.stringify(expected)} for familiarity "${familiarity}"`;
  }

  if (!analogy.frame || !analogy.phase_1_meaning || !analogy.phase_2_meaning || !analogy.phase_3_meaning)
    return 'journey_analogy has empty fields';

  return null;
}

// ── Fallback: deterministic AAA_PHASE_MAP ─────────────────────────────────────
function buildFallback(
  role: RoleCategory,
  familiarity: AiFamiliarity,
): GapInferenceResult {
  const rawNodes = sliceByFamiliarity(role, familiarity) as Array<{
    phase: AAAPhase;
    title: string;
    skill_ids: string[];
  }>;
  const allowedTools = ROLE_TOOLS[role] ?? [];
  const nodes: GapInferenceNode[] = rawNodes.map(n => ({
    title:               n.title,
    aaa_phase:           n.phase,
    skill_ids:           n.skill_ids,
    why_for_this_person: '',
    tools:               allowedTools.slice(0, 3),
  }));
  return {
    nodes,
    journey_analogy: FALLBACK_ANALOGIES[role],
    fallback_used: true,
  };
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: {
    raw_role_text: string;
    role_category: RoleCategory;
    work_context: WorkContext;
    ai_familiarity: AiFamiliarity;
    tasks: OnetTask[];
    task_weights: Record<string, TaskWeight>;
    confirmed_cluster_ids: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const {
    raw_role_text,
    role_category,
    work_context,
    ai_familiarity,
    tasks,
    task_weights,
    confirmed_cluster_ids,
  } = body;

  if (!raw_role_text || !role_category || !ai_familiarity) {
    return NextResponse.json(
      { error: 'missing required fields: raw_role_text, role_category, ai_familiarity' },
      { status: 400 },
    );
  }

  // Check AAA_PHASE_MAP has this role — if not, fall back immediately
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(AAA_PHASE_MAP as any)[role_category]) {
    return NextResponse.json(buildFallback(role_category, ai_familiarity));
  }

  // Build high-weight task list for user context block
  const highWeightTasks = tasks
    .filter(t => task_weights[t.id] === 'high')
    .map(t => t.description)
    .slice(0, 5);

  const expected = FAMILIARITY_SLICES[ai_familiarity];
  const totalNodes = expected.assisted + expected.accelerated + expected.autonomous;

  const userContextBlock = [
    `Role: ${raw_role_text}`,
    `Work context: ${work_context ?? 'not specified'}`,
    `AI familiarity: ${ai_familiarity}`,
    `Confirmed skill clusters (already have): ${confirmed_cluster_ids.length ? confirmed_cluster_ids.join(', ') : 'none'}`,
    `Highest-priority tasks: ${highWeightTasks.length ? highWeightTasks.join(' | ') : 'not provided'}`,
    ``,
    `REQUIRED NODE COUNT (strict — do not produce more or fewer of each phase):`,
    `  Assisted: ${expected.assisted}`,
    `  Accelerated: ${expected.accelerated}`,
    `  Autonomous: ${expected.autonomous}`,
    `  Total: ${totalNodes}`,
  ].join('\n');

  let result: GapInferenceResult;

  try {
    const raw = await callLLM({
      system: SYSTEM_PROMPT,
      user: `=== USER CONTEXT ===\n${userContextBlock}\n\nSelect and sequence the right 5-9 nodes for this person. Be specific to their role and context.`,
      maxTokens: 2500,
      temperature: 0.3,
      jsonSchema: OUTPUT_SCHEMA,
    });

    if (!raw) throw new Error('empty LLM response');

    const parsed = JSON.parse(raw) as {
      nodes: GapInferenceNode[];
      journey_analogy: JourneyAnalogy;
    };

    // Try rebalance first if distribution is off — avoids full fallback
    let nodes = parsed.nodes;
    const preCheck = validate(nodes, parsed.journey_analogy, ai_familiarity);
    if (preCheck?.startsWith('AAA distribution')) {
      const rebalanced = rebalance(nodes, ai_familiarity);
      if (rebalanced) {
        console.info(`[gap-inference] rebalanced nodes for familiarity="${ai_familiarity}"`);
        nodes = rebalanced;
      }
    }

    const validationError = validate(nodes, parsed.journey_analogy, ai_familiarity);
    if (validationError) {
      console.warn(`[gap-inference] validation failed: ${validationError} — using fallback`);
      result = buildFallback(role_category, ai_familiarity);
    } else {
      result = { nodes, journey_analogy: parsed.journey_analogy, fallback_used: false };
    }
  } catch (err) {
    console.error('[gap-inference] LLM error — using fallback', err);
    result = buildFallback(role_category, ai_familiarity);
  }

  return NextResponse.json(result);
}
