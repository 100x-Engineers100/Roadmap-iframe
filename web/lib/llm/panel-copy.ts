/**
 * Phase 7 - LLM Copy Enrichment Layer.
 *
 * enrichBlueprintCopy(blueprint) -> RoadmapBlueprint | GenerationFailedResult
 *
 * LLM rewrites ONLY copy fields inside the locked blueprint:
 *   - terminology support copy (role_example, analogy_hook, why_it_matters)
 *   - atom copy (explanation, learner_action, output)
 *   - analogy copy (concept_mappings[].plain_meaning, concept_mappings[].mistake_to_avoid, takeaway)
 *   - checkpoint copy (scenario, artifact_to_create, steps, done_when, confidence_check)
 *   - project checkpoint copy (title, objective, scenario, tasks, what_youll_learn, core_components, success_criteria, deliverables, bonus_challenges, reflection_questions)
 *
 * LOCKED (LLM cannot change):
 *   node ids, titles, skill_ids, depth_level, depth_reason, node_kind
 *   atom ids, order, label, type, depth_level, depth_reason, tools
 *   analogy lens_name, lens_domain, concept, analogy_part
 *   terminology term name, plain_definition, appears_in_node_ids
 *   project checkpoint id, type, after_node_ids, concepts_covered, tools
 *
 * Retries once with exact validation errors on failure.
 * Returns GenerationFailedResult after retry failure.
 */

import { callLLM, type LLMCallParams } from './provider';
import type {
  RoadmapBlueprint,
  RoadmapBlueprintNode,
} from '@/types';

export interface GenerationFailedResult {
  generation_failed: true;
  reason: string;
}

export function isGenerationFailed(
  result: RoadmapBlueprint | GenerationFailedResult
): result is GenerationFailedResult {
  return 'generation_failed' in result && (result as GenerationFailedResult).generation_failed === true;
}

// ── Copy delta interfaces ────────────────────────────────────────────────────

interface TermCopy {
  role_example: string;
  analogy_hook: string;
  why_it_matters: string;
}

interface AtomCopy {
  explanation: string;
  learner_action: string;
  output: string;
}

interface CheckpointCopy {
  scenario: string;
  artifact_to_create: string;
  steps: string[];
  done_when: string[];
  confidence_check: string;
}

interface AnalogyMappingCopy {
  plain_meaning: string;
  mistake_to_avoid: string;
}

interface NodePanelCopy {
  title: string;
  panel: {
    checkpoint: CheckpointCopy;
    expansion: {
      left_items: AtomCopy[];
      right_items: AtomCopy[];
    };
  };
}

interface ProjectCheckpointCopy {
  title: string;
  objective: string;
  scenario: string;
  tasks: string[];
  what_youll_learn: string[];
  core_components: string[];
  success_criteria: string[];
  deliverables: string[];
  bonus_challenges?: string[];
  reflection_questions?: string[];
}

interface CopyDelta {
  terminology: Record<string, TermCopy>;
  nodes: Record<string, NodePanelCopy>;
  project_checkpoints: Record<string, ProjectCheckpointCopy>;
}

export interface EnrichmentOptions {
  callLLM?: (params: LLMCallParams) => Promise<string>;
}

const BANNED_EXPLANATION_START = /^(learn|learn how|you will learn|understand|understand the)\b/i;
const BANNED_GENERIC_COPY = /\b(practice this skill|apply your knowledge|work through the exercise|complete the task|capstone project)\b/i;

function validateCopyText(value: string | undefined, path: string, errors: string[]): void {
  const trimmed = value?.trim();
  if (!trimmed) return;
  if (BANNED_EXPLANATION_START.test(trimmed)) errors.push(`${path}_banned_start`);
  if (BANNED_GENERIC_COPY.test(trimmed)) errors.push(`${path}_generic_phrase`);
}

// ── JSON schema builder ──────────────────────────────────────────────────────

function termCopySchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      role_example: { type: 'string' },
      analogy_hook: { type: 'string' },
      why_it_matters: { type: 'string' },
    },
    required: ['role_example', 'analogy_hook', 'why_it_matters'],
    additionalProperties: false,
  };
}

function atomCopySchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      explanation: { type: 'string' },
      learner_action: { type: 'string' },
      output: { type: 'string' },
    },
    required: ['explanation', 'learner_action', 'output'],
    additionalProperties: false,
  };
}

function analogyMappingCopySchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      plain_meaning: { type: 'string' },
      mistake_to_avoid: { type: 'string' },
    },
    required: ['plain_meaning', 'mistake_to_avoid'],
    additionalProperties: false,
  };
}

function checkpointCopySchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      scenario: { type: 'string' },
      artifact_to_create: { type: 'string' },
      steps: { type: 'array', minItems: 2, items: { type: 'string' } },
      done_when: { type: 'array', minItems: 2, items: { type: 'string' } },
      confidence_check: { type: 'string' },
    },
    required: ['scenario', 'artifact_to_create', 'steps', 'done_when', 'confidence_check'],
    additionalProperties: false,
  };
}

function nodePanelCopySchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      title: { type: 'string' },
      panel: {
        type: 'object',
        properties: {
          checkpoint: checkpointCopySchema(),
          expansion: {
            type: 'object',
            properties: {
              left_items: { type: 'array', items: atomCopySchema() },
              right_items: { type: 'array', items: atomCopySchema() },
            },
            required: ['left_items', 'right_items'],
            additionalProperties: false,
          },
        },
        required: ['checkpoint', 'expansion'],
        additionalProperties: false,
      },
    },
    required: ['title', 'panel'],
    additionalProperties: false,
  };
}

function projectCheckpointCopySchema(type: string): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      objective: { type: 'string' },
      scenario: { type: 'string' },
      tasks: { type: 'array', items: { type: 'string' } },
      what_youll_learn: { type: 'array', items: { type: 'string' } },
      core_components: { type: 'array', items: { type: 'string' } },
      success_criteria: { type: 'array', items: { type: 'string' } },
      deliverables: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'objective', 'scenario', 'tasks', 'what_youll_learn', 'core_components', 'success_criteria', 'deliverables'],
    additionalProperties: false,
  };
  if (type === 'final_project') {
    (base.properties as Record<string, unknown>).bonus_challenges = { type: 'array', items: { type: 'string' } };
    (base.properties as Record<string, unknown>).reflection_questions = { type: 'array', items: { type: 'string' } };
    (base.required as string[]).push('bonus_challenges', 'reflection_questions');
  }
  return base;
}

function buildDeltaSchema(blueprint: RoadmapBlueprint): Record<string, unknown> {
  const allNodes = blueprint.phases.flatMap(p => p.nodes);
  const terms = blueprint.terminology_primer.terms;

  const termProperties: Record<string, unknown> = {};
  for (const t of terms) termProperties[t.term] = termCopySchema();

  const nodeProperties: Record<string, unknown> = {};
  for (const node of allNodes) nodeProperties[node.id] = nodePanelCopySchema();

  const cpProperties: Record<string, unknown> = {};
  for (const cp of blueprint.project_checkpoints) cpProperties[cp.id] = projectCheckpointCopySchema(cp.type);

  return {
    type: 'object',
    properties: {
      terminology: {
        type: 'object',
        properties: termProperties,
        required: terms.map(t => t.term),
        additionalProperties: false,
      },
      nodes: {
        type: 'object',
        properties: nodeProperties,
        required: allNodes.map(n => n.id),
        additionalProperties: false,
      },
      project_checkpoints: {
        type: 'object',
        properties: cpProperties,
        required: blueprint.project_checkpoints.map(c => c.id),
        additionalProperties: false,
      },
    },
    required: ['terminology', 'nodes', 'project_checkpoints'],
    additionalProperties: false,
  };
}

// ── Prompt builders ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a learning content writer for 100x School of Applied AI.
You receive a locked roadmap blueprint and rewrite ONLY the copy fields inside it.

Rules (non-negotiable):
- Rewrite ONLY the fields in the JSON schema. Do not invent or remove nodes, atoms, terms, or checkpoints.
- Every explanation must state what the learner gains in their SPECIFIC ROLE CONTEXT, not what the technology does in general.
- Every learner_action must be concrete and completable in the atom's allocated time.
- Every output must be a tangible artifact the learner can show, save, or use.
- Terminology plain definitions are locked by the blueprint. Do not rewrite or restate definitions; only personalize role_example, analogy_hook, and why_it_matters.
- Checkpoint steps must name specific tools from the node's allowed_tools list.
- confidence_check must be a single yes/no question the learner honestly answers about their own skill.
- NEVER start an explanation with "Learn", "Learn how", "You will learn", "Understand", or "Understand the".
- Every atom explanation MUST start with one of these active verbs or role-specific openings: Use, Build, Create, Map, Draft, Connect, Configure, Compare, Test, Ship, Generate, Automate, Review, Design, Implement, Diagnose, Optimize, Produce, Set up, Refactor.
- NEVER use generic phrases: "practice this skill", "apply your knowledge", "work through the exercise", "complete the task", "capstone project".
- Node title rule — max 12 words. Must contain a tech term. Two accepted formats:
  (a) Tech-forward: "[Verb] [TECH] [brief outcome]" — e.g. "Build RAG for startup docs Q&A" / "Wire ReAct agent for bug triage"
  (b) Hybrid badge: "[Outcome phrase] → [TECH]" — e.g. "Answer questions from your own docs → RAG" / "Map requirements into a build plan → OPT"
  REQUIRED: every title must contain at least one of: RAG, MCP, ReAct, LLM, API, embeddings, pgvector, chunking, SPAORL, LoRA, fine-tuning, n8n, FastAPI, OPT, multi-agent, handoff.
  If the blueprint title has no tech term: REWRITE it in format (a) or (b).
  If the blueprint title already contains a tech term: trim to 12 words max, preserving the tech term.
  WRONG (no tech term): "Turn vague requirements into a clear build plan you can size and schedule"
  WRONG (no tech term): "Get code, bugs, and design questions answered from your own project knowledge"
  RIGHT: "Map startup ideas into feature plans → OPT" / "Answer project questions from your own docs → RAG" / "Build ReAct agent for routine bug triage"
- Checkpoint scenarios must be at least 2 sentences: first sentence opens with THIS PERSON'S specific context — combine who they are (role + work context) with a concrete moment of friction in the same sentence. Use their actual situation detail (e.g. "outbound research at a B2B agency", "API integrations at a startup") NOT a bare job title. Second sentence names the EXACT tool name from the node's tool list and the deliverable. The tool name must appear verbatim in the scenario (e.g. if tools include "Claude", write "Claude" in the scenario text). ABSOLUTE BAN: NEVER start a scenario with "As a [role]...", "You are a [role]...", or "A [role] at a..." — all are banned openers. The scenario must address the person directly as "you" and name THEIR SPECIFIC CONTEXT (company type + role detail + moment of friction).
- Atom explanations must open with an active verb or a role-specific statement of what changes for the learner.
- NEVER invent tools, nodes, or concepts not present in the blueprint.
- Output ONLY the JSON delta matching the schema. No explanation, no markdown fences.
- Each node lists "left atoms (N)" and "right atoms (N)". Return exactly N items in left_items and N items in right_items for that node. All counts are mandatory — do not add or remove items.
- Every node ID listed in LOCKED NODES must appear in your output. Omitting a node ID is a fatal error.
- steps must have at least 2 items. done_when must have at least 2 items. Never return an empty array for either field.`;

function buildUserPrompt(blueprint: RoadmapBlueprint, validationErrors?: string[]): string {
  const { user_profile, journey_analogy } = blueprint;
  const allNodes = blueprint.phases.flatMap(p => p.nodes);

  const profileCtx = [
    `Role: ${user_profile.raw_role_text}`,
    `Category: ${user_profile.role_category} / ${user_profile.role_archetype}`,
    `AI familiarity: ${user_profile.ai_familiarity}`,
    `Top daily tasks: ${user_profile.high_weight_tasks.slice(0, 3).map(t => t.description).join(' | ')}`,
    `Journey frame: ${journey_analogy.frame} — ${journey_analogy.phase_1_meaning} → ${journey_analogy.phase_3_meaning}`,
  ].join('\n');

  const topTasks = user_profile.high_weight_tasks.slice(0, 2).map(t => t.description).join('" or "');

  const gapNodes = blueprint.gap_inference_nodes ?? [];
  const nodeSummary = allNodes.map((n, idx) => {
    const leftItems = n.panel.expansion.left_items;
    const rightItems = n.panel.expansion.right_items;
    const leftLabels = leftItems.map(a => a.label).join(', ');
    const rightLabels = rightItems.map(a => a.label).join(', ');
    const why = gapNodes[idx]?.why_for_this_person;
    return [
      `Node ${n.id}: "${n.title}" [${n.depth_level}]`,
      why ? `  why for this person: ${why}` : '',
      `  skills: ${n.skill_ids.join(', ')}  tools: ${n.panel.checkpoint.tools.join(', ')}  [scenario MUST name one of these tools verbatim]`,
      `  left atoms (${leftItems.length}): ${leftLabels}`,
      `  right atoms (${rightItems.length}): ${rightLabels}`,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const termList = blueprint.terminology_primer.terms.map(t => `  ${t.term}`).join('\n');
  const projectBriefContext = blueprint.project_checkpoints.map((c, i) => {
    const label = c.type === 'final_project' ? 'CAPSTONE' : `MINI BUILD ${i + 1}`;
    const coveredNodes = allNodes.filter(n => c.concepts_covered.includes(n.title));
    const nodeAtomLines = coveredNodes.map(n => {
      const leftLabels = n.panel.expansion.left_items.map(a => a.label).join(' | ');
      const rightLabels = n.panel.expansion.right_items.map(a => a.label).join(' | ');
      return `  node "${n.title}": [${leftLabels}] → [${rightLabels}]`;
    }).join('\n');
    return [
      `${label} (${c.id}):`,
      `  concepts_covered: ${c.concepts_covered.join(' → ')}`,
      `  tools available: ${c.tools.join(', ')}`,
      nodeAtomLines,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const nonTechRoles = ['marketer', 'designer', 'sales', 'pm', 'student'];
  const isNonTech = nonTechRoles.includes(user_profile.role_category);

  const atomExplanationRule = `ATOM EXPLANATION RULE — EVERY LEFT AND RIGHT ATOM:

NO mandatory sentence formula. Write prose that is dense, specific, and earned — not a 4-step template.

Quality bar: each explanation must include at least ONE of:
- A specific library or install command (e.g. "pip install pgvector supabase-py", "from langchain.text_splitter import RecursiveCharacterTextSplitter")
- A specific function call or code pattern (e.g. "redis.set(f'{user_id}:{session_id}', data, ex=3600)", "supabase.table('memories').upsert({...}).execute()")
- A quantified threshold or benchmark (e.g. "cosine_similarity > 0.70", "temperature=0 for deterministic JSON", "max_iterations=10 before forced stop")
- A named error or failure the learner WILL actually hit (e.g. "RecursionError on runaway ReAct loop", "HTTP 529 from Claude API under load", "KeyError when Redis key has no TTL")

Include "The Twist" in every concept and applied atom — the one non-obvious technical surprise specific to THIS skill that catches engineers off guard on first implementation. Name the specific failure, threshold, or race condition. A generic warning is not The Twist.

TWIST EXAMPLES:
- Document RAG: "The twist: 512-token fixed chunks split mid-sentence and lose context — use RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50) to preserve meaning at boundaries."
- ReAct agent: "The twist: without max_iterations=10 guard and a STOP token condition, agents loop indefinitely on ambiguous tool results."
- Redis memory: "The twist: Redis keys without user_id namespacing bleed sessions across users — always key by f'{user_id}:{session_id}' with TTL."
- LLM API: "The twist: Claude returns HTTP 529 under load — without exponential backoff (tenacity.retry, max_attempts=3), 10% of prod requests silently fail."
- Multi-agent: "The twist: Manager-Worker agents that use different message schemas silently drop tasks with no error — define a shared Pydantic model for all inter-agent messages."

SUB-COMPONENT RULE — every CONCEPT atom explanation MUST use this exact format:
  Line 1: one opening sentence — max 15 words. Active verb + what the learner builds. No subordinate clauses.
  Lines 2-N: bullet list — one bullet per sub-component. Format: "• [Name] — [one specific detail only, max 12 words]". No "so that", no second clause, no extra context.
  Last line: "The Twist: [exact failure named, one sentence, max 20 words]"

LENGTH HARD LIMIT: total explanation must stay under 80 words. Count before outputting. Trim until it fits.

Do NOT write a plain paragraph for concept atoms. Always: sentence → bullets → twist.

Format examples (these show the correct length — do not exceed them):

Engineer / RAG atom:
  Build a RAG pipeline connecting chunking, embeddings, and retrieval:
  • Chunking — RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50) preserves sentence boundaries
  • Embeddings — openai.embeddings.create(model="text-embedding-3-small") → 1536-dim pgvector column
  • Vector Store — pgvector column in Supabase; upsert with supabase.table('docs').upsert(...)
  • Retrieval — SELECT ... ORDER BY embedding <=> $1 LIMIT 5; cutoff at cosine > 0.70
  The Twist: cosine threshold matters more than chunk size — tune threshold before touching chunk params.

Non-tech / RAG atom:
  Set up AI that answers questions from your own documents:
  • Chunking — splits docs into small sections so the AI can search them individually
  • Embeddings (vectors) — converts each section into numbers capturing meaning, not keywords
  • Vector Store — database column that holds those numbers for instant similarity search
  • Retrieval — ranks sections by meaning-closeness to your question; returns top matches
  The Twist: answer quality depends more on how you split docs than which AI model you use.

Engineer / ReAct atom:
  Build a ReAct agent: Thought → Action → Observation loop until done:
  • Thought — model logs reasoning before every tool call; force with system prompt prefix "THOUGHT:"
  • Action — tool call with typed arguments; define as JSON schema in the API request
  • Observation — tool result injected as next user message; loop repeats
  • Stop Condition — max_iterations=10 guard; raise StopIteration on exceed
  The Twist: without max_iterations=10 and a STOP token, agents loop forever on ambiguous results.

Apply the same format to: MCP, multi-agent, API integration, memory, prompt engineering, fine-tuning, cost optimization.
FAIL: any concept atom explanation that is a plain paragraph without bullets.
FAIL: any concept atom explanation that exceeds 80 words.

Atom output field: name the EXACT artifact — filename, test result, command output. NEVER "a document" or "a report demonstrating X."
WRONG output: "A proof of mastery document demonstrating retrieval accuracy"
WRONG output: "A report on typical API errors and fixes"
RIGHT output: "Running pytest test_rag.py shows >= 8/10 correct on the test fixtures"
RIGHT output: "agent.py that completes a 3-step task with SPOAR loop logging each phase to logs/run.json"
RIGHT output: "A working FastAPI /chat endpoint returning JSON with {response, session_id} — tested with curl against 5 sample inputs"

First word of explanation: active verb (Use, Build, Create, Map, Draft, Connect, Configure, Compare, Test, Ship, Generate, Automate, Review, Design, Implement, Diagnose, Optimize, Produce, Set up, Refactor).
BANNED starters: "Learn", "Learn how", "You will learn", "Understand", "Understand the".
BANNED opener pattern: "Without [technology name]..." — state the problem first, then name the solution.
BANNED outputs: "a document", "a report", "a proof of mastery document demonstrating X functionality", "typical X issues and solutions".
${!isNonTech ? `
TECHNICAL AUDIENCE (${user_profile.role_category}): This person writes Python, uses FastAPI, knows SQL. Do NOT explain what an API is, what a function call is, or what a library is. Name the exact library, the exact method, the exact error. Generic sentences like "this improves your workflow" or "helps you work better with AI" are banned — they produce zero signal for a working engineer.` : ''}
${isNonTech ? `
NON-TECHNICAL AUDIENCE RULE: This person is a ${user_profile.role_category}. Tech concepts MUST be NAMED — then defined inline in plain English in the same sentence. NEVER omit the concept name. Always write it, then define it.
RIGHT: "pgvector (a database extension that stores AI embeddings for similarity search) is how your chatbot finds the most relevant document chunk."
RIGHT: "embeddings (numbers that capture meaning so similar text scores close) power the retrieval step."
RIGHT: "RAG (Retrieval-Augmented Generation) lets your AI answer questions from your own documents instead of guessing."
WRONG: any sentence about document retrieval that never names pgvector, embeddings, or vectors.
WRONG: replacing 'chunking' with 'splitting documents' without naming it chunking first.
WRONG: referring to "the AI search system" without naming it as RAG, vector search, or embeddings.
HARD BAN: the exact phrases "language model API", "language model", and bare "API" must never appear without an immediate inline definition in the same sentence.` : ''}`;

  const scenarioOpenerRule = `CHECKPOINT SCENARIO OPENER — NON-NEGOTIABLE FOR EVERY NODE:
MUST be exactly 2 sentences, minimum 100 characters total.
Sentence 1: Identify THIS SPECIFIC PERSON — combine who they are (from their Role + work context) with a concrete moment of friction. Both must be in the same sentence. Use their role description words, their company type, and a specific pain from their actual work. A stranger reading this sentence must know who this person is AND what went wrong.
VERBATIM SIGNAL: the specific moment of friction already exists in the 'why for this person' field shown above for each node. Copy the exact numbers, tool names, or failure events from it — do NOT invent or paraphrase. Example: if why says 'onboarding takes 3 weeks', write '3 weeks' in the scenario, not 'onboarding is slow'.
Sentence 2: Format exactly: "[EXACT tool name from node's tool list] will [build/produce/generate] [specific artifact], done when [one clear measurable criterion]."
Their situation: "${user_profile.raw_role_text}" | Context: ${user_profile.work_context}
Their key daily tasks: "${topTasks}"

WRONG: "Doing outbound research at an agency, you need to map your workflow." (job description paraphrase, not a moment)
WRONG: "As a sales rep, you handle CRM notes and outbound." (job label — banned)
RIGHT: "Your last outbound run took 3 days because prospect research was scattered across 4 tabs — no CRM, no structure, just notes. Use Claude to build a prospect brief template that outputs a call-ready summary in under 5 minutes, done when the brief covers company context, pain signals, and a personalised hook."

BANNED (output rejected): "As a [role]...", "You are a [role]...", "A [role] at a..." — sentence 1 must address the person directly as "you" and name THEIR SPECIFIC CONTEXT (company type + role detail + moment), not describe them from outside.`;

  const errorSection = validationErrors && validationErrors.length > 0
    ? `\nPrevious attempt failed validation. Fix ALL of these errors:\n${validationErrors.map(e => `  - ${e}`).join('\n')}\n\nIf any error ends with _banned_start, rewrite that explanation or learner_action so it starts with an active verb from this approved list: Use, Build, Create, Map, Draft, Connect, Configure, Compare, Test, Ship, Generate, Automate, Review, Design, Implement, Diagnose, Optimize, Produce, Set up, Refactor. Do not start any copy with Learn or Understand. If any error ends with _generic_phrase, remove the generic phrase. Do not use "capstone project"; say "final integration build" or "portfolio build" instead.\n`
    : '';

  return [
    profileCtx,
    '',
    atomExplanationRule,
    '',
    scenarioOpenerRule,
    '',
    'LOCKED NODES (rewrite copy fields only):',
    nodeSummary,
    '',
    'LOCKED TERMINOLOGY TERMS (plain_definition is fixed; enrich role_example, analogy_hook, why_it_matters only):',
    termList,
    '',
    `PROJECT BRIEFS
You are writing build briefs for a real professional — not a student doing exercises. These projects must produce something this person can actually use or show at work. Every project must feel like "this saves me real time / solves a real pain I have", not "I completed a tutorial."

PERSON CONTEXT (use this in every project — not generic):
Role: "${user_profile.raw_role_text}"
Work context: ${user_profile.work_context}
Their top tasks: "${topTasks}"

=== NARRATIVE ARC (non-negotiable) ===
All 3 projects follow ONE connected domain — same problem space, increasing complexity:
- Mini Build 1: builds the first working piece of the system using concepts_covered[1]
- Mini Build 2: extends Mini 1 or adds the next layer using concepts_covered[2]
- Capstone: integrates everything into one production-ready system a stranger can use

WRONG arc: three unrelated projects
RIGHT arc: Mini 1 = prospect research prompt chain → Mini 2 = auto-log to CRM via n8n → Capstone = full outbound pipeline (research + personalise + log + follow-up, all automated)

=== FIELD RULES — READ EVERY ONE ===

title (1 line):
  Must name the artifact, not the learning. Verb-first. Name the output, not the process.
  WRONG: "Prompt Engineering Practice"
  RIGHT: "Build a prospect brief generator that cuts research from 3 days to 20 minutes"

objective (2-3 sentences):
  What they build + the real-world pain it solves + why it matters for their specific job.
  WRONG: "In this project you will learn how to use Claude to do outreach."
  RIGHT: "You'll build a Claude-powered research pipeline that pulls public signals on any prospect and outputs a call-ready brief. This replaces the 90-minute manual tab-switching you do before every demo. The output is a live tool you can run before your next actual call."

scenario (1 paragraph — THIS IS THE PROBLEM STATEMENT. It is the first thing the user reads when they open the project. It must make them think "yes, this is my exact problem, I need to build this."):
  Structure: sentence 1 = what is breaking RIGHT NOW in their work (specific, named). Sentence 2 = what they will build to fix it (named tools + named artifact). Sentence 3+ = why this matters (what happens if not fixed). Final sentence = "The Twist: [specific technical failure they WILL hit on first attempt]."
  The Twist is a specific failure mode, race condition, or non-obvious constraint — not a generic difficulty. Name the exact error, the exact parameter, the exact collision.
  Use the person's raw_role_text words verbatim — not a paraphrase.
  WRONG: "A sales professional needs to research prospects faster."
  WRONG ending: "This will be challenging to implement correctly." (generic — not The Twist)
  WRONG (engineer): "Your startup needs better AI workflows." (no specific breakage named)
  RIGHT (engineer): "Your team's RAG prototype answers questions correctly on demo day and fails on real user queries the next morning. Chunking strategy was the culprit — fixed-size splits broke mid-sentence and lost context. This project builds a production RAG pipeline with recursive chunking, pgvector similarity search, and a pytest suite that catches retrieval regressions before they reach prod. The Twist: cosine_similarity threshold matters more than chunk size — run experiments at 0.65, 0.70, 0.75 before tuning chunk settings, or you will tune the wrong variable."
  RIGHT (engineer): "Your FastAPI backend handles 5 concurrent users in local testing and crashes under 50 in staging. The bottleneck is synchronous Claude API calls blocking the event loop. This project wires async httpx + Claude API with exponential backoff, adds Pydantic request validation, and benchmarks with locust before prod. The Twist: Claude returns HTTP 529 under load — without tenacity.retry(stop=stop_after_attempt(3), wait=wait_exponential()), 15% of prod requests silently return empty without raising an exception."
  RIGHT (non-engineer): "Your agency runs 40-60 outbound touches a week. Right now prospect research means 4 browser tabs, a LinkedIn scroll, and a guess at their pain. Two hours per week gone before you've even opened your CRM. This project wires Claude to a structured prospect intake form and outputs a brief that covers company context, recent signals, and a personalised hook — in under 90 seconds. The Twist: Claude will hallucinate company details if the fallback prompt for missing LinkedIn data isn't structured correctly — the brief looks right but contains invented facts."

tasks (5-8 items, ORDERED steps — a BUILD GUIDE, not a learning list):
  The tasks array IS the step-by-step guide for building this project. Someone with zero context must be able to follow tasks 1 through N and end up with working, tested code. Tasks are a recipe, not a syllabus.

  Structure: task 1 = environment setup with exact commands. Tasks 2-N = build each component in order, each producing a testable artifact. Final task = run the full test suite and verify success criteria.

  ENGINEER TASK FORMAT (mandatory for engineer/developer roles):
  Every step MUST name: (a) specific file being created or edited, (b) exact library or function, (c) a verification step or assert.
  Pattern: "[Create/Build/Implement/Test] [filename.py]: [exact pip install OR function signature with params] — verify: [specific command or assert]"

  WRONG (all roles): "Set up your environment and install dependencies"
  WRONG (all roles): "Use Claude to process the input"
  WRONG (engineer): "Implement the RAG pipeline with chunking"
  WRONG (engineer): "Add chunking to your document pipeline"
  WRONG (engineer): "Build the FastAPI backend with Claude"

  RIGHT (non-engineer): "Create a structured input schema in Claude's system prompt: company name, role, recent activity field — validate it returns JSON with exactly those keys"
  RIGHT (non-engineer): "Wire Claude API node in n8n: pass structured prompt with prospect fields, set temperature to 0, enable JSON mode, test with 3 real prospects from your pipeline"
  RIGHT (engineer): "pip install langchain-text-splitters supabase-py openai python-dotenv — create .env with OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY and validate with python -c 'import dotenv; dotenv.load_dotenv(); assert os.getenv(\"OPENAI_API_KEY\")'"
  RIGHT (engineer): "Create rag.py: implement chunk_docs(file_path) using RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50) → embed each chunk with openai.embeddings.create(model='text-embedding-3-small') → upsert to Supabase pgvector — verify: assert len(chunks) > 0 and len(chunks[0].embedding) == 1536"
  RIGHT (engineer): "Create retrieval.py: implement search(query, top_k=5) querying Supabase with SELECT ... ORDER BY embedding <=> $1 LIMIT 5 — verify cosine_similarity > 0.70: pytest test_retrieval.py::test_similarity_threshold"
  RIGHT (engineer): "Create memory.py: implement store_interaction(user_id, session_id, query, response) storing embeddings in Redis with key f'{user_id}:{session_id}' and TTL=3600 — verify: redis.get(f'{user_id}:{session_id}') returns stored value"
  RIGHT (engineer): "Build agent.py: implement react_loop(task) with Thought → Action → Observation phases, max_iterations=10 guard, STOP token check — test: pytest test_agent.py::test_react_completes_3_steps"
  RIGHT (engineer): "Run full test suite: pytest -v tests/ — all success_criteria must pass before marking done"

  For engineer/developer roles: every task names a specific .py file AND a specific function/method AND a verification command. Vague tasks without file names are REJECTED.

  ATOM LABEL ALIGNMENT (non-negotiable): Each project's node skill breakdown is listed in the PROJECT BRIEFS context at the bottom of this prompt. Your task steps MUST implement the specific concepts named there. Examples:
  - Node labels include "Chunking Strategy" → a task step must name RecursiveCharacterTextSplitter with chunk_size and chunk_overlap params
  - Node labels include "pgvector Similarity Search" → a task step must reference SELECT ... ORDER BY embedding <=> $1 LIMIT N and cosine_similarity > threshold
  - Node labels include "Dense Embeddings" → a task step must name openai.embeddings.create(model='text-embedding-3-small') or equivalent
  - Node labels include "ReAct Agent Loop" → a task step must implement Thought/Action/Observation with max_iterations=10 guard
  - Node labels include "AI Memory Systems" → a task step must implement Redis key with f'{user_id}:{session_id}' and TTL
  - Node labels include "Multi-Agent Orchestration" → a task step must define shared Pydantic message schema for inter-agent communication
  A project whose task steps don't map to the atom labels listed in PROJECT BRIEFS below is REJECTED.

what_youll_learn (exactly 3 items):
  Capability-framed: "You'll be able to..." not "You'll learn...". Name the exact technique.
  WRONG: "How to use AI tools for sales"
  RIGHT: "Structure a multi-field prompt so Claude returns consistent JSON across 50+ different prospect types without hallucinating missing fields"

core_components (3-4 items):
  The actual technical pieces they build. Named specifically. No fluff.
  WRONG: "AI integration layer"
  RIGHT: "Claude system prompt with structured JSON output schema and fallback handling for missing prospect data"
  RIGHT: "n8n webhook workflow with HTTP trigger, Claude API node, and Google Sheets append action"

success_criteria (3-4 items):
  Starts with "You can..." or "The system...". Measurable. A stranger must be able to verify it.
  For engineer roles: use test-command format or threshold format — a stranger can run the command and see the number.
  WRONG: "You understand the concepts"
  WRONG: "The project works correctly"
  WRONG (engineer): "The system returns accurate answers from your documents" (not measurable)
  RIGHT (non-engineer): "You can paste any LinkedIn URL and get a structured brief in under 2 minutes with no manual research"
  RIGHT (non-engineer): "The system handles a missing 'recent activity' field without breaking — it flags the gap and still produces a partial brief"
  RIGHT (engineer): "Running pytest test_rag.py shows >= 8/10 correct answers on the test fixtures"
  RIGHT (engineer): "Memory search returns cosine_similarity > 0.70 for all 4/4 test queries — verified by running python test_memory.py"
  RIGHT (engineer): "The FastAPI /chat endpoint returns HTTP 200 with valid JSON for all 5 test inputs in under 2s — run: curl -X POST localhost:8000/chat -d '{...}'"
  RIGHT (engineer): "Agent completes the 3-step task in <= 10 iterations — logs/run.json shows all SPOAR phases with no None values"

deliverables (2-3 items):
  Real artifacts. Shareable. Not "a working project."
  WRONG: "A completed project"
  WRONG (engineer): "Complete multi-agent AI system codebase" (not specific enough)
  RIGHT (non-engineer): "n8n workflow JSON (importable, shareable with your team)"
  RIGHT (non-engineer): "Claude system prompt file with input schema and 3 tested examples"
  RIGHT (engineer): "GitHub repo with agent.py / memory.py / tools.py / requirements.txt / logs/ — submit link with README showing test results"
  RIGHT (engineer): "requirements.txt with pinned versions (pip freeze > requirements.txt) — any teammate can reproduce the environment"
  RIGHT (engineer): "test_cases.py showing all 4 test cases passing — pytest output screenshot or log included"
  For engineer roles: deliverables must include a GitHub repo structure with named files AND a requirements.txt.

bonus_challenges (capstone only, 2 items):
  Harder extensions that make the system production-grade.

reflection_questions (capstone only, 3 items):
  Force them to articulate what they built. Answer = proof they understood.
  "What breaks if the prospect has no LinkedIn presence? How did you handle it?"

=== GUARDRAILS — OUTPUT REJECTED IF ANY VIOLATED ===
1. No project scenario uses "a company" or "an organisation" — must name their industry/context
2. No task step says "configure appropriately", "set up as needed", "use the tool"
3. No success criterion is time-based ("in 2 hours") or effort-based ("you complete all steps")
4. No title contains "Practice", "Exercise", "Workshop", "Learning", "Module"
5. Every task step names a specific tool from the tools list: ${blueprint.project_checkpoints.map(c => c.tools.join(', ')).join(' | ')}
6. Tasks array must have 5-8 items — not fewer
7. All 3 projects must share a recognisable domain thread (same problem space, escalating scope)

${projectBriefContext}`,
    errorSection,
    'Return the complete copy delta JSON now.',
  ].join('\n');
}

// ── Delta validation ─────────────────────────────────────────────────────────

function validateCopyDelta(delta: CopyDelta, blueprint: RoadmapBlueprint): string[] {
  const errors: string[] = [];
  const allNodes = blueprint.phases.flatMap(p => p.nodes);

  for (const term of blueprint.terminology_primer.terms) {
    const copy = delta.terminology?.[term.term];
    if (!copy) { errors.push(`terminology_missing:${term.term}`); continue; }
    if (!copy.role_example?.trim()) errors.push(`terminology_empty_role_example:${term.term}`);
    if (!copy.analogy_hook?.trim()) errors.push(`terminology_empty_analogy_hook:${term.term}`);
    if (!copy.why_it_matters?.trim()) errors.push(`terminology_empty_why_it_matters:${term.term}`);
  }

  for (const node of allNodes) {
    const nc = delta.nodes?.[node.id];
    if (!nc) { errors.push(`node_missing:${node.id}`); continue; }
    const pc = nc.panel;
    if (!pc) { errors.push(`node_panel_missing:${node.id}`); continue; }

    const left = pc.expansion?.left_items ?? [];
    const right = pc.expansion?.right_items ?? [];

    for (let i = 0; i < left.length; i++) {
      const ac = left[i];
      if (!ac?.explanation?.trim()) errors.push(`node_${node.id}_left[${i}]_empty_explanation`);
      if (!ac?.learner_action?.trim()) errors.push(`node_${node.id}_left[${i}]_empty_learner_action`);
      if (!ac?.output?.trim()) errors.push(`node_${node.id}_left[${i}]_empty_output`);
      validateCopyText(ac?.explanation, `node_${node.id}_left[${i}]_explanation`, errors);
      validateCopyText(ac?.learner_action, `node_${node.id}_left[${i}]_learner_action`, errors);
    }
    for (let i = 0; i < right.length; i++) {
      const ac = right[i];
      if (!ac?.explanation?.trim()) errors.push(`node_${node.id}_right[${i}]_empty_explanation`);
      if (!ac?.learner_action?.trim()) errors.push(`node_${node.id}_right[${i}]_empty_learner_action`);
      if (!ac?.output?.trim()) errors.push(`node_${node.id}_right[${i}]_empty_output`);
      validateCopyText(ac?.explanation, `node_${node.id}_right[${i}]_explanation`, errors);
      validateCopyText(ac?.learner_action, `node_${node.id}_right[${i}]_learner_action`, errors);
    }

    const ck = pc.checkpoint;
    if (!ck?.scenario?.trim()) errors.push(`node_${node.id}_checkpoint_empty_scenario`);
    if (!ck?.artifact_to_create?.trim()) errors.push(`node_${node.id}_checkpoint_empty_artifact_to_create`);
    if (!Array.isArray(ck?.steps) || ck.steps.length === 0) errors.push(`node_${node.id}_checkpoint_empty_steps`);
    if (!Array.isArray(ck?.done_when) || ck.done_when.length === 0) errors.push(`node_${node.id}_checkpoint_empty_done_when`);
    if (!ck?.confidence_check?.trim()) errors.push(`node_${node.id}_checkpoint_empty_confidence_check`);
  }

  for (const cp of blueprint.project_checkpoints) {
    const cc = delta.project_checkpoints?.[cp.id];
    if (!cc) { errors.push(`project_missing:${cp.id}`); continue; }
    if (!cc.title?.trim()) errors.push(`project_${cp.id}_empty_title`);
    if (!cc.objective?.trim()) errors.push(`project_${cp.id}_empty_objective`);
    if (!cc.scenario?.trim()) errors.push(`project_${cp.id}_empty_scenario`);
    if (!Array.isArray(cc.tasks) || cc.tasks.length < 3) errors.push(`project_${cp.id}_tasks_too_few`);
    if (!Array.isArray(cc.success_criteria) || cc.success_criteria.length === 0) errors.push(`project_${cp.id}_empty_success_criteria`);
    if (!Array.isArray(cc.deliverables) || cc.deliverables.length === 0) errors.push(`project_${cp.id}_empty_deliverables`);
  }

  return errors;
}

// ── Apply delta to locked blueprint ─────────────────────────────────────────

function applyDelta(blueprint: RoadmapBlueprint, delta: CopyDelta): RoadmapBlueprint {
  const enriched = JSON.parse(JSON.stringify(blueprint)) as RoadmapBlueprint;

  for (const term of enriched.terminology_primer.terms) {
    const copy = delta.terminology[term.term];
    if (!copy) continue;
    if (copy.role_example?.trim()) term.role_example = copy.role_example;
    if (copy.analogy_hook?.trim()) term.analogy_hook = copy.analogy_hook;
    if (copy.why_it_matters?.trim()) term.why_it_matters = copy.why_it_matters;
  }

  for (const phase of enriched.phases) {
    for (const node of phase.nodes) {
      const nc = delta.nodes[node.id];
      if (!nc) continue;
      const pc = nc.panel;

      const leftCopy = pc.expansion?.left_items ?? [];
      const leftApplyCount = Math.min(leftCopy.length, node.panel.expansion.left_items.length);
      for (let i = 0; i < leftApplyCount; i++) {
        const ac = leftCopy[i];
        if (!ac) continue;
        if (ac.explanation?.trim()) node.panel.expansion.left_items[i].explanation = ac.explanation;
        if (ac.learner_action?.trim()) node.panel.expansion.left_items[i].learner_action = ac.learner_action;
        if (ac.output?.trim()) node.panel.expansion.left_items[i].output = ac.output;
      }

      const rightCopy = pc.expansion?.right_items ?? [];
      const rightApplyCount = Math.min(rightCopy.length, node.panel.expansion.right_items.length);
      for (let i = 0; i < rightApplyCount; i++) {
        const ac = rightCopy[i];
        if (!ac) continue;
        if (ac.explanation?.trim()) node.panel.expansion.right_items[i].explanation = ac.explanation;
        if (ac.learner_action?.trim()) node.panel.expansion.right_items[i].learner_action = ac.learner_action;
        if (ac.output?.trim()) node.panel.expansion.right_items[i].output = ac.output;
      }

      if (nc.title?.trim()) node.title = nc.title;

      const ck = pc.checkpoint;
      if (ck?.scenario?.trim()) node.panel.checkpoint.scenario = ck.scenario;
      if (ck?.artifact_to_create?.trim()) node.panel.checkpoint.artifact_to_create = ck.artifact_to_create;
      if (Array.isArray(ck?.steps) && ck.steps.length > 0) node.panel.checkpoint.steps = ck.steps;
      if (Array.isArray(ck?.done_when) && ck.done_when.length > 0) node.panel.checkpoint.done_when = ck.done_when;
      if (ck?.confidence_check?.trim()) node.panel.checkpoint.confidence_check = ck.confidence_check;
    }
  }

  for (const cp of enriched.project_checkpoints) {
    const cc = delta.project_checkpoints[cp.id];
    if (!cc) continue;
    if (cc.title?.trim()) cp.title = cc.title;
    if (cc.objective?.trim()) cp.objective = cc.objective;
    if (cc.scenario?.trim()) cp.scenario = cc.scenario;
    if (Array.isArray(cc.tasks) && cc.tasks.length > 0) cp.tasks = cc.tasks;
    if (Array.isArray(cc.what_youll_learn) && cc.what_youll_learn.length > 0) cp.what_youll_learn = cc.what_youll_learn;
    if (Array.isArray(cc.core_components) && cc.core_components.length > 0) cp.core_components = cc.core_components;
    if (Array.isArray(cc.success_criteria) && cc.success_criteria.length > 0) cp.success_criteria = cc.success_criteria;
    if (Array.isArray(cc.deliverables) && cc.deliverables.length > 0) cp.deliverables = cc.deliverables;
    if (Array.isArray(cc.bonus_challenges) && cc.bonus_challenges.length > 0) cp.bonus_challenges = cc.bonus_challenges;
    if (Array.isArray(cc.reflection_questions) && cc.reflection_questions.length > 0) cp.reflection_questions = cc.reflection_questions;
  }

  return enriched;
}

// ── LLM call ─────────────────────────────────────────────────────────────────

async function callEnrichmentLLM(
  blueprint: RoadmapBlueprint,
  validationErrors?: string[],
  llmCaller: (params: LLMCallParams) => Promise<string> = callLLM
): Promise<CopyDelta> {
  const schema = buildDeltaSchema(blueprint);

  const raw = await llmCaller({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(blueprint, validationErrors),
    maxTokens: 16000,
    temperature: 0.2,
    jsonSchema: {
      name: 'copy_delta',
      schema,
      strict: true,
    },
  });

  // With json_schema response_format, content is already valid JSON
  return JSON.parse(raw) as CopyDelta;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function enrichBlueprintCopy(
  blueprint: RoadmapBlueprint,
  options: EnrichmentOptions = {}
): Promise<RoadmapBlueprint | GenerationFailedResult> {
  let delta: CopyDelta;
  const llmCaller = options.callLLM ?? callLLM;

  try {
    delta = await callEnrichmentLLM(blueprint, undefined, llmCaller);
  } catch (err) {
    return {
      generation_failed: true,
      reason: `LLM call failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const errors = validateCopyDelta(delta, blueprint);

  if (errors.length === 0) {
    return applyDelta(blueprint, delta);
  }

  console.warn(JSON.stringify({
    event: 'blueprint_copy_validation_failed',
    role: blueprint.user_profile.role_category,
    error_count: errors.length,
    first_errors: errors.slice(0, 3),
  }));

  // One retry with validation errors passed back
  let retryDelta: CopyDelta;
  try {
    retryDelta = await callEnrichmentLLM(blueprint, errors, llmCaller);
  } catch (retryErr) {
    return {
      generation_failed: true,
      reason: `LLM retry failed: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
    };
  }

  const retryErrors = validateCopyDelta(retryDelta, blueprint);

  if (retryErrors.length > 0) {
    console.error(JSON.stringify({
      event: 'blueprint_copy_retry_validation_failed',
      role: blueprint.user_profile.role_category,
      error_count: retryErrors.length,
      first_errors: retryErrors.slice(0, 3),
    }));
    return {
      generation_failed: true,
      reason: `Validation failed after retry: ${retryErrors.slice(0, 3).join(', ')}`,
    };
  }

  return applyDelta(blueprint, retryDelta);
}
