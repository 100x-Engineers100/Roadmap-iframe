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
 *   - project checkpoint copy (description, artifact_to_build, steps, done_when)
 *
 * LOCKED (LLM cannot change):
 *   node ids, titles, skill_ids, depth_level, depth_reason, node_kind
 *   atom ids, order, label, type, depth_level, depth_reason, tools, time_est
 *   analogy lens_name, lens_domain, concept, analogy_part
 *   terminology term name, plain_definition, appears_in_node_ids
 *   project checkpoint id, type, after_node_ids, title, goal, concepts_checked, tools, time_est
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
  description: string;
  artifact_to_build: string;
  steps: string[];
  done_when: string[];
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

function projectCheckpointCopySchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      description: { type: 'string' },
      artifact_to_build: { type: 'string' },
      steps: { type: 'array', minItems: 2, items: { type: 'string' } },
      done_when: { type: 'array', minItems: 2, items: { type: 'string' } },
    },
    required: ['description', 'artifact_to_build', 'steps', 'done_when'],
    additionalProperties: false,
  };
}

function buildDeltaSchema(blueprint: RoadmapBlueprint): Record<string, unknown> {
  const allNodes = blueprint.phases.flatMap(p => p.nodes);
  const terms = blueprint.terminology_primer.terms;

  const termProperties: Record<string, unknown> = {};
  for (const t of terms) termProperties[t.term] = termCopySchema();

  const nodeProperties: Record<string, unknown> = {};
  for (const node of allNodes) nodeProperties[node.id] = nodePanelCopySchema();

  const cpProperties: Record<string, unknown> = {};
  for (const cp of blueprint.project_checkpoints) cpProperties[cp.id] = projectCheckpointCopySchema();

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
- Node title rewriting: each node in the delta MUST include a "title" field. If the current title contains technical jargon (OPT, RAG, FastAPI, Supabase, API, MCP, LoRA, n8n, embeddings, structured output, fine-tuning, vector, LLM, pipeline, naive, advanced, ReAct, SPAORL, retrieval, inference), rewrite it as a plain-language outcome statement: what will this person GAIN or be ABLE TO DO? Max 12 words. No acronyms or tool names. If already jargon-free, repeat verbatim.
  WRONG title: "Map your sales workflow with OPT" → RIGHT: "Turn your 3-day prospect prep into a 5-minute brief"
  WRONG title: "Build naive RAG pipeline for document retrieval" → RIGHT: "Get AI to answer questions from your own documents automatically"
  WRONG title: "Set up FastAPI with Supabase backend" → RIGHT: "Ship a working backend that handles real requests from real users"
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
  const cpList = blueprint.project_checkpoints.map(c => `  ${c.id} (${c.type}): "${c.title}"`).join('\n');

  const nonTechRoles = ['marketer', 'designer', 'sales', 'pm', 'student'];
  const isNonTech = nonTechRoles.includes(user_profile.role_category);

  const atomExplanationRule = `ATOM EXPLANATION RULE — EVERY LEFT AND RIGHT ATOM:

Structure (mandatory order):
1. STATE the specific problem this person faces WITHOUT this capability — name the pain in their actual work
2. SHOW why the obvious workaround fails for them
3. REVEAL why this capability solves it
4. THEN demonstrate or name it with an active verb

First word: active verb (Use, Build, Create, Map, Draft, Connect, Configure, Compare, Test, Ship, Generate, Automate, Review, Design, Implement, Diagnose, Optimize, Produce, Set up, Refactor).
BANNED starters: "Learn", "Learn how", "You will learn", "Understand", "Understand the".
BANNED opener pattern: "Without [technology name]..." — this names the solution BEFORE the problem. State the problem first, then reveal what solves it.

WRONG: "Use vector databases to store embeddings for semantic search."
RIGHT: "Your documents don't fit in the context window — copy-pasting is chaos at scale. Map how each piece of content gets from source to AI so you see exactly where retrieval breaks."

WRONG: "Build a no-code content pipeline using n8n to automate handoffs."
RIGHT: "Every campaign handoff is a Slack thread that dies — one missed message means a delayed launch. Map the exact handoff points in your workflow, then connect them in n8n so nothing slips."

WRONG: "Without naive RAG, your backend lacks dynamic document retrieval, forcing static data inclusion."
RIGHT: "Every API query returns whatever you hardcoded — users asking about recent data get stale answers. Map how documents flow from source to query response, then build the retrieval layer that makes it dynamic."
${isNonTech ? `
NON-TECHNICAL AUDIENCE RULE: This person is a ${user_profile.role_category}. Every technical term in atom explanations must be plain English OR defined inline in the same sentence.
NEVER assume they know: RAG, embeddings, vector database, MCP, structured output, context window, token, n8n, LLM, language model, language model API, API, LoRA, ReAct, prompt engineering, fine-tuning. HARD BAN: the exact phrases "language model API", "language model", and bare "API" must never appear in atom text without an immediate inline definition in the same sentence.
If you must use a technical term: define it immediately — "embeddings (a way to convert text into numbers the AI can compare)".` : ''}`;

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
    'PROJECT CHECKPOINTS (enrich description, artifact_to_build, steps, done_when):',
    cpList,
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
    if (!cc) { errors.push(`project_checkpoint_missing:${cp.id}`); continue; }
    if (!cc.description?.trim()) errors.push(`project_checkpoint_${cp.id}_empty_description`);
    if (!cc.artifact_to_build?.trim()) errors.push(`project_checkpoint_${cp.id}_empty_artifact_to_build`);
    if (!Array.isArray(cc.steps) || cc.steps.length === 0) errors.push(`project_checkpoint_${cp.id}_empty_steps`);
    if (!Array.isArray(cc.done_when) || cc.done_when.length === 0) errors.push(`project_checkpoint_${cp.id}_empty_done_when`);
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
    if (cc.description?.trim()) cp.description = cc.description;
    if (cc.artifact_to_build?.trim()) cp.artifact_to_build = cc.artifact_to_build;
    if (Array.isArray(cc.steps) && cc.steps.length > 0) cp.steps = cc.steps;
    if (Array.isArray(cc.done_when) && cc.done_when.length > 0) cp.done_when = cc.done_when;
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
    maxTokens: 12000,
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
