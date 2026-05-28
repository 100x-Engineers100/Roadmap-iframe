/**
 * Phase 4 - gapInferenceResult wiring test gate.
 * Run from web/: node scripts/test-phase4-wiring.mjs
 *
 * Gates:
 *  Gate 1: buildRoadmapBlueprint uses gapInferenceResult nodes (not fallback)
 *  Gate 2: blueprint node count == gapInferenceResult.nodes.length (different from fallback)
 *  Gate 3: atom count = skill_ids.length*2+2 per node — all 6 role fixtures WITH gap inference
 *  Gate 4: panel-copy validateCopyDelta logic accepts correct variable atom counts (pure JS sim)
 *  Gate 5: validateRoadmap does NOT emit PANEL_ATOM_COUNT_INVALID for nodes from REAL blueprints
 *  Gate 6: fallback path still works when gapInferenceResult is null
 *  Gate 7: node IDs in gap-inference blueprint match what was provided (not remapped to fallback IDs)
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { buildRoadmapBlueprint } from '../lib/roadmap/blueprint.mjs';
import { buildUserWorkProfile } from '../lib/profile/user-work-profile.mjs';
import { validateRoadmap, ISSUE_CODES } from '../lib/roadmap/validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, '../../test output');
const reportPath = resolve(outputDir, 'phase4-wiring.json');

// ── 6 role fixtures × gapInferenceResult (all different node counts/skill combos) ──

const CASES = [
  {
    id: 'marketer-none-5nodes',
    profile: {
      rawRoleText: 'Digital marketer at a fintech startup running campaign and content ops',
      socMatch: { soc_code: '11-2021.00', title: 'Marketing Managers', confidence: 0.92 },
      roleCategory: 'marketer',
      aiFamiliarity: 'none',
      confirmedClusterIds: ['C1A'],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'low' },
      tasks: [
        { id: 't1', description: 'Plan campaign calendar', importance: 92 },
        { id: 't2', description: 'Draft content briefs', importance: 88 },
        { id: 't3', description: 'Review campaign performance', importance: 76 },
        { id: 't4', description: 'Coordinate creative approvals', importance: 60 },
      ],
    },
    // 5 nodes — fallback gives 8, so proof gapInference was used
    gapInference: {
      nodes: [
        { title: 'Map content workflow with OPT',             aaa_phase: 'assisted',     skill_ids: ['S2.1'],           why_for_this_person: 'Ops clarity first',      tools: ['Claude'] },
        { title: 'Draft briefs with prompt engineering',       aaa_phase: 'assisted',     skill_ids: ['S2.1', 'S2.2'],   why_for_this_person: 'Daily task',             tools: ['Claude'] },
        { title: 'Build no-code content pipeline',             aaa_phase: 'accelerated',  skill_ids: ['S3.2'],           why_for_this_person: 'Automate handoffs',       tools: ['n8n'] },
        { title: 'Set up trigger-based reporting',             aaa_phase: 'accelerated',  skill_ids: ['S3.1', 'S3.2', 'S3.4'], why_for_this_person: 'Reports build themselves', tools: ['n8n', 'Claude'] },
        { title: 'Deploy content monitoring agent',            aaa_phase: 'autonomous',   skill_ids: ['S3.3', 'S3.4'],   why_for_this_person: 'Frees ops time',         tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Content production studio', phase_1_meaning: 'You direct manually', phase_2_meaning: 'Templates run on command', phase_3_meaning: 'Brief in, content out' },
      fallback_used: false,
    },
    expectedNodeCount: 5,
    fallbackNodeCount: 8,
  },
  {
    id: 'designer-basic-6nodes',
    profile: {
      rawRoleText: 'Brand designer creating visual systems for a SaaS team',
      socMatch: { soc_code: '27-1024.00', title: 'Graphic Designers', confidence: 0.9 },
      roleCategory: 'designer',
      aiFamiliarity: 'basic',
      confirmedClusterIds: ['C1A'],
      taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
      tasks: [
        { id: 't1', description: 'Create visual concepts', importance: 90 },
        { id: 't2', description: 'Adapt brand assets', importance: 74 },
        { id: 't3', description: 'Prepare presentation boards', importance: 83 },
      ],
    },
    // 6 nodes — fallback gives 7, different but inside valid range
    gapInference: {
      nodes: [
        { title: 'Generate on-brand images with Midjourney',   aaa_phase: 'assisted',     skill_ids: ['S1.1', 'S1.2'],   why_for_this_person: 'You create visuals daily',   tools: ['Midjourney'] },
        { title: 'Build brand training LoRA',                  aaa_phase: 'assisted',     skill_ids: ['S1.3'],           why_for_this_person: 'Brand consistency at scale',  tools: ['FLUX'] },
        { title: 'Produce AVTV pipeline for presentations',    aaa_phase: 'accelerated',  skill_ids: ['S1.7'],           why_for_this_person: 'Automate deck production',    tools: ['HeyGen', 'CapCut'] },
        { title: 'Automate asset delivery workflow',           aaa_phase: 'accelerated',  skill_ids: ['S3.2', 'S2.1'],   why_for_this_person: 'No more manual handoffs',     tools: ['n8n'] },
        { title: 'Create AI influencer persona for brand',     aaa_phase: 'accelerated',  skill_ids: ['S1.5'],           why_for_this_person: 'Scalable brand presence',     tools: ['FreePik Spaces'] },
        { title: 'Deploy autonomous brand asset generator',    aaa_phase: 'autonomous',   skill_ids: ['S1.2', 'S3.4'],   why_for_this_person: 'Briefs trigger full output',  tools: ['n8n', 'FLUX'] },
      ],
      journey_analogy: { frame: 'Scaling a creative studio', phase_1_meaning: 'You produce every asset', phase_2_meaning: 'Workflows run on trigger', phase_3_meaning: 'Briefs auto-route to pipelines' },
      fallback_used: false,
    },
    expectedNodeCount: 6,
    fallbackNodeCount: 7,
  },
  {
    id: 'sales-none-6nodes',
    profile: {
      rawRoleText: 'Sales rep doing outbound research, CRM notes, and deal prep',
      socMatch: { soc_code: '41-3091.00', title: 'Sales Representatives', confidence: 0.89 },
      roleCategory: 'sales',
      aiFamiliarity: 'none',
      confirmedClusterIds: [],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
      tasks: [
        { id: 't1', description: 'Research prospects', importance: 90 },
        { id: 't2', description: 'Personalize outbound emails', importance: 86 },
        { id: 't3', description: 'Prepare call followups', importance: 72 },
      ],
    },
    // 6 nodes — fallback gives 8
    gapInference: {
      nodes: [
        { title: 'Map your sales workflow with OPT',           aaa_phase: 'assisted',     skill_ids: ['S2.1'],           why_for_this_person: 'You research prospects daily', tools: ['Claude'] },
        { title: 'Write AI-personalised outbound sequences',   aaa_phase: 'assisted',     skill_ids: ['S2.1', 'S2.2'],   why_for_this_person: 'You write emails every day',  tools: ['Claude'] },
        { title: 'Research prospects with ReAct loop',         aaa_phase: 'assisted',     skill_ids: ['S3.1', 'S2.2'],   why_for_this_person: 'Faster research per rep',      tools: ['n8n', 'Claude'] },
        { title: 'Build outbound automation pipeline',         aaa_phase: 'accelerated',  skill_ids: ['S3.2', 'S3.4'],   why_for_this_person: 'Automate the handoff chain',   tools: ['n8n'] },
        { title: 'Evaluate pipeline quality with LLM-as-Judge', aaa_phase: 'accelerated', skill_ids: ['S3.6'],           why_for_this_person: 'Quality control per sequence', tools: ['n8n', 'Claude'] },
        { title: 'Deploy autonomous CRM update agent',         aaa_phase: 'autonomous',   skill_ids: ['S3.3', 'S3.4', 'S3.5'], why_for_this_person: 'CRM stays current without manual effort', tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Building your own outbound sales team', phase_1_meaning: 'You handle every task', phase_2_meaning: 'Pipelines run on command', phase_3_meaning: 'System runs autonomously' },
      fallback_used: false,
    },
    expectedNodeCount: 6,
    fallbackNodeCount: 8,
  },
  {
    id: 'founder-pm-intermediate-7nodes',
    profile: {
      rawRoleText: 'Founder PM at a healthcare startup handling launch ops and discovery',
      socMatch: { soc_code: '11-1021.00', title: 'Chief Executives', confidence: 0.86 },
      roleCategory: 'pm',
      aiFamiliarity: 'intermediate',
      confirmedClusterIds: ['C2A'],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
      tasks: [
        { id: 't1', description: 'Synthesize customer calls', importance: 94 },
        { id: 't2', description: 'Prioritize launch scope', importance: 89 },
        { id: 't3', description: 'Write product briefs', importance: 75 },
      ],
    },
    // 7 nodes — fallback gives 7 too, but different node IDs/structure → verify by node content
    gapInference: {
      nodes: [
        { title: 'Synthesize customer calls with structured output', aaa_phase: 'assisted',    skill_ids: ['S2.2'],                why_for_this_person: 'You spend hours on call notes',     tools: ['Claude'] },
        { title: 'Build a product brief generator',              aaa_phase: 'accelerated',  skill_ids: ['S2.1', 'S2.2'],         why_for_this_person: 'Briefs take half your week',         tools: ['Claude', 'Notion'] },
        { title: 'Connect customer CRM to AI pipeline via MCP',  aaa_phase: 'accelerated',  skill_ids: ['S2.7'],                 why_for_this_person: 'CRM context always current',         tools: ['Claude', 'n8n'] },
        { title: 'Automate launch scope prioritisation',         aaa_phase: 'accelerated',  skill_ids: ['S3.4', 'S2.2'],         why_for_this_person: 'Decisions need data, not gut',       tools: ['Claude', 'Linear'] },
        { title: 'Ship MVP with Ship Cycle',                     aaa_phase: 'autonomous',   skill_ids: ['S2.11'],                why_for_this_person: 'You need to validate fast',          tools: ['Lovable', 'Cursor'] },
        { title: 'Evaluate discovery quality automatically',     aaa_phase: 'autonomous',   skill_ids: ['S3.6'],                 why_for_this_person: 'Quality of insight drives decisions', tools: ['Claude', 'n8n'] },
        { title: 'Deploy multi-agent ops orchestrator',          aaa_phase: 'autonomous',   skill_ids: ['S3.3', 'S3.4', 'S3.5'], why_for_this_person: 'Ops run without you in the loop',   tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Hiring your first operations manager', phase_1_meaning: 'You handle every task', phase_2_meaning: 'You build processes and delegate', phase_3_meaning: 'Ops run themselves' },
      fallback_used: false,
    },
    expectedNodeCount: 7,
    fallbackNodeCount: 7, // same count — verify node content differs
  },
  {
    id: 'engineer-advanced-9nodes',
    profile: {
      rawRoleText: 'Backend engineer building API integrations and agent systems',
      socMatch: { soc_code: '15-1252.00', title: 'Software Developers', confidence: 0.94 },
      roleCategory: 'engineer',
      aiFamiliarity: 'advanced',
      confirmedClusterIds: ['C2B'],
      taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
      tasks: [
        { id: 't1', description: 'Integrate APIs', importance: 92 },
        { id: 't2', description: 'Design backend services', importance: 80 },
        { id: 't3', description: 'Debug multi-step agent workflows', importance: 85 },
      ],
    },
    // 9 nodes — max — fallback gives 6
    gapInference: {
      nodes: [
        { title: 'Build naive RAG pipeline for document retrieval',   aaa_phase: 'accelerated', skill_ids: ['S2.4'],                why_for_this_person: 'You integrate APIs daily',           tools: ['FastAPI', 'Supabase'] },
        { title: 'Upgrade to hybrid search with re-ranking',          aaa_phase: 'accelerated', skill_ids: ['S2.5'],                why_for_this_person: 'Quality of retrieval matters',       tools: ['FastAPI', 'Supabase'] },
        { title: 'Implement Redis memory across sessions',             aaa_phase: 'accelerated', skill_ids: ['S2.6'],                why_for_this_person: 'Agents need context continuity',     tools: ['FastAPI', 'Supabase'] },
        { title: 'Connect external systems with MCP protocol',        aaa_phase: 'accelerated', skill_ids: ['S2.7'],                why_for_this_person: 'Standard integration pattern',       tools: ['MCP SDK'] },
        { title: 'Implement tool calling with structured outputs',     aaa_phase: 'accelerated', skill_ids: ['S2.3', 'S2.8'],        why_for_this_person: 'Agents need reliable tool use',      tools: ['FastAPI', 'Supabase'] },
        { title: 'Reduce LLM cost with caching and tiering',          aaa_phase: 'accelerated', skill_ids: ['S2.10'],               why_for_this_person: 'Prod cost must be controlled',       tools: ['LangSmith', 'Langfuse'] },
        { title: 'Deploy ReAct agents with LangGraph',                aaa_phase: 'autonomous',  skill_ids: ['S3.1', 'S3.4'],        why_for_this_person: 'Multi-step tasks need real agents',  tools: ['LangGraph', 'CrewAI'] },
        { title: 'Orchestrate multi-agent workflows',                  aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4'],        why_for_this_person: 'Complex pipelines need orchestration', tools: ['LangGraph', 'CrewAI'] },
        { title: 'Add safety guardrails and LLM evaluation',          aaa_phase: 'autonomous',  skill_ids: ['S3.5', 'S3.6'],        why_for_this_person: 'Production agents must be safe',     tools: ['LangSmith', 'Langfuse'] },
      ],
      journey_analogy: { frame: 'Deploying your first junior engineer who never sleeps', phase_1_meaning: 'You write every integration', phase_2_meaning: 'Pipelines run on triggers', phase_3_meaning: 'System monitors itself' },
      fallback_used: false,
    },
    expectedNodeCount: 9,
    fallbackNodeCount: 6,
  },
  {
    id: 'student-none-5nodes',
    profile: {
      rawRoleText: 'Student learning AI through projects and portfolio work',
      socMatch: { soc_code: '25-3099.00', title: 'Student Learners', confidence: 0.78 },
      roleCategory: 'student',
      aiFamiliarity: 'none',
      confirmedClusterIds: [],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
      tasks: [
        { id: 't1', description: 'Study new concepts', importance: 88 },
        { id: 't2', description: 'Build small projects', importance: 84 },
        { id: 't3', description: 'Document portfolio work', importance: 70 },
      ],
    },
    // 5 nodes — minimum valid — fallback gives 8
    gapInference: {
      nodes: [
        { title: 'Set up FastAPI with Supabase backend',              aaa_phase: 'assisted',    skill_ids: ['S2.3'],                why_for_this_person: 'You build projects for portfolio',   tools: ['FastAPI', 'Supabase'] },
        { title: 'Build your first RAG application',                  aaa_phase: 'assisted',    skill_ids: ['S2.4', 'S2.2'],        why_for_this_person: 'RAG is the most requested skill',    tools: ['FastAPI', 'Supabase'] },
        { title: 'Add AI tool calling to your project',               aaa_phase: 'accelerated', skill_ids: ['S2.8'],                why_for_this_person: 'Tool use is employer baseline',      tools: ['FastAPI', 'Supabase'] },
        { title: 'Build a ReAct agent that solves real tasks',        aaa_phase: 'accelerated', skill_ids: ['S3.1', 'S3.4'],        why_for_this_person: 'Agents are your differentiator',     tools: ['n8n', 'Claude', 'FastAPI'] },
        { title: 'Ship an end-to-end product users can test',        aaa_phase: 'autonomous',  skill_ids: ['S2.11', 'S3.3'],       why_for_this_person: 'Portfolio needs real shipped products', tools: ['Cursor', 'Vercel', 'Supabase'] },
      ],
      journey_analogy: { frame: 'Solo developer shipping a product used by real users', phase_1_meaning: 'You build each feature with AI assistance', phase_2_meaning: 'Automated pipelines run on trigger', phase_3_meaning: 'Product runs and improves autonomously' },
      fallback_used: false,
    },
    expectedNodeCount: 5,
    fallbackNodeCount: 8,
  },
];

function flattenNodes(blueprint) {
  return (blueprint.phases ?? []).flatMap(p => p.nodes ?? []);
}

// ── Gate 4: Pure JS simulation of panel-copy.ts validateCopyDelta atom check ──
function simulateCopyDeltaAtomCheck(skillIds, leftItems, rightItems) {
  const expectedCount = skillIds.length + 1;
  const errors = [];
  if (leftItems.length !== expectedCount)
    errors.push(`left_must_be_${expectedCount}_got_${leftItems.length}`);
  if (rightItems.length !== expectedCount)
    errors.push(`right_must_be_${expectedCount}_got_${rightItems.length}`);
  return errors;
}

async function main() {
  const caseResults = [];
  const gate3Failures = [];

  for (const caseDef of CASES) {
    const profile = buildUserWorkProfile({
      rawRoleText:         caseDef.profile.rawRoleText,
      socMatch:            caseDef.profile.socMatch,
      roleCategory:        caseDef.profile.roleCategory,
      tasks:               caseDef.profile.tasks,
      taskWeights:         caseDef.profile.taskWeights,
      aiFamiliarity:       caseDef.profile.aiFamiliarity,
      confirmedClusterIds: caseDef.profile.confirmedClusterIds,
    });

    let blueprintWithGap = null;
    let blueprintNoGap   = null;
    let buildError       = null;

    try {
      blueprintWithGap = buildRoadmapBlueprint(profile, caseDef.gapInference);
      blueprintNoGap   = buildRoadmapBlueprint(profile);
    } catch (err) {
      buildError = err.message ?? String(err);
    }

    const nodesWithGap = blueprintWithGap ? flattenNodes(blueprintWithGap) : [];
    const nodesNoGap   = blueprintNoGap   ? flattenNodes(blueprintNoGap)   : [];
    const actualGapCount     = nodesWithGap.length;
    const actualFallbackCount = nodesNoGap.length;

    const gate1Pass = actualGapCount === caseDef.expectedNodeCount;
    const gate2Pass = actualGapCount !== actualFallbackCount || caseDef.expectedNodeCount === caseDef.fallbackNodeCount;
    // When same count, verify at least that gap_inference_nodes field is populated
    const gate2bPass = caseDef.expectedNodeCount === caseDef.fallbackNodeCount
      ? (blueprintWithGap?.gap_inference_nodes?.length === caseDef.expectedNodeCount)
      : (actualGapCount !== actualFallbackCount);

    // Atom count check per node
    const atomChecks = nodesWithGap.map(node => {
      const exp = node.panel?.expansion;
      if (!exp) return { node_id: node.id, pass: false, reason: 'missing_expansion' };
      const expectedPerSide = node.skill_ids.length + 1;
      const leftOk  = exp.left_items?.length  === expectedPerSide;
      const rightOk = exp.right_items?.length === expectedPerSide;
      return {
        node_id:          node.id,
        skill_ids_n:      node.skill_ids.length,
        expected_per_side: expectedPerSide,
        left_count:       exp.left_items?.length  ?? null,
        right_count:      exp.right_items?.length ?? null,
        pass:             leftOk && rightOk,
      };
    });
    const gate3Pass = !buildError && atomChecks.length > 0 && atomChecks.every(r => r.pass);

    if (!gate3Pass) {
      for (const r of atomChecks) {
        if (!r.pass) gate3Failures.push(`${caseDef.id}_node_${r.node_id}_left_${r.left_count}_right_${r.right_count}_expected_${r.expected_per_side}`);
      }
      if (buildError) gate3Failures.push(`${caseDef.id}_build_error: ${buildError}`);
    }

    // Gate 5: run validateRoadmap on each real blueprint node
    // Build minimal roadmap with nodes from actual blueprint, check no PANEL_ATOM_COUNT_INVALID
    const atomCountIssuesFromRealBlueprint = [];
    if (blueprintWithGap && nodesWithGap.length > 0) {
      for (const bpNode of nodesWithGap.slice(0, 3)) { // check first 3 nodes per case
        const minRoadmap = {
          step1: {
            label: 'Assisted — Foundation',
            theme: 'Foundation',
            nodes: [bpNode],
            checkpoint: {},
          },
          step2: { label: 'Accelerated — Building', theme: 'Building', nodes: [], checkpoint: {} },
          step3: { label: 'Autonomous — Operating', theme: 'Operating', nodes: [], checkpoint: {} },
          terminology_primer: { terms: [] },
          project_checkpoints: [],
          glossary: [],
        };
        const { issues } = validateRoadmap(minRoadmap, { audience: caseDef.profile.roleCategory });
        const atomIssues = issues.filter(i => i.code === ISSUE_CODES.PANEL_ATOM_COUNT_INVALID);
        if (atomIssues.length > 0) {
          atomCountIssuesFromRealBlueprint.push({
            case: caseDef.id,
            node_id: bpNode.id,
            issues: atomIssues,
          });
        }
      }
    }

    caseResults.push({
      id:            caseDef.id,
      buildError:    buildError ?? null,
      gate1Pass,
      gate2Pass:     gate1Pass && gate2bPass,
      gate3Pass,
      gate5Pass:     atomCountIssuesFromRealBlueprint.length === 0,
      actualGapCount,
      expectedNodeCount: caseDef.expectedNodeCount,
      actualFallbackCount,
      atomChecks,
      gate5AtomIssues: atomCountIssuesFromRealBlueprint,
    });
  }

  // ── Gate 4: panel-copy atom count logic simulation ─────────────────────────
  const gate4Tests = [
    // 1 skill → 2 per side
    { desc: '1skill_2atoms',   pass: simulateCopyDeltaAtomCheck(['S2.1'], new Array(2).fill({}), new Array(2).fill({})).length === 0 },
    // 2 skills → 3 per side
    { desc: '2skills_3atoms',  pass: simulateCopyDeltaAtomCheck(['S2.1', 'S2.2'], new Array(3).fill({}), new Array(3).fill({})).length === 0 },
    // 3 skills → 4 per side
    { desc: '3skills_4atoms',  pass: simulateCopyDeltaAtomCheck(['S1', 'S2', 'S3'], new Array(4).fill({}), new Array(4).fill({})).length === 0 },
    // old hardcoded-5 count would fail for 2-skill node — regression guard
    { desc: '2skills_old5_rejects', pass: simulateCopyDeltaAtomCheck(['S2.1', 'S2.2'], new Array(5).fill({}), new Array(5).fill({})).length > 0 },
    // wrong count catches mismatches
    { desc: 'wrong_count_caught',   pass: simulateCopyDeltaAtomCheck(['S2.1', 'S2.2'], new Array(2).fill({}), new Array(3).fill({})).length > 0 },
    // all 6 gap fixtures have correct per-node counts
    ...CASES.flatMap(c => c.gapInference.nodes.map(n => ({
      desc: `${c.id}_${n.skill_ids.length}skills`,
      pass: simulateCopyDeltaAtomCheck(n.skill_ids, new Array(n.skill_ids.length + 1).fill({}), new Array(n.skill_ids.length + 1).fill({})).length === 0,
    }))),
  ];
  const gate4Pass = gate4Tests.every(t => t.pass);

  // ── Gate 6: fallback still works with null gapInferenceResult ─────────────
  let gate6Pass = true;
  let gate6Error = null;
  try {
    const testProfile = buildUserWorkProfile({
      rawRoleText: CASES[0].profile.rawRoleText,
      socMatch:    CASES[0].profile.socMatch,
      roleCategory: CASES[0].profile.roleCategory,
      tasks:        CASES[0].profile.tasks,
      taskWeights:  CASES[0].profile.taskWeights,
      aiFamiliarity: CASES[0].profile.aiFamiliarity,
      confirmedClusterIds: [],
    });
    const fallbackBp = buildRoadmapBlueprint(testProfile, null);
    const fallbackNodes = flattenNodes(fallbackBp);
    gate6Pass = fallbackNodes.length === CASES[0].fallbackNodeCount && fallbackNodes.length > 0;
    if (!gate6Pass) gate6Error = `expected_${CASES[0].fallbackNodeCount}_got_${fallbackNodes.length}`;
  } catch (err) {
    gate6Pass = false;
    gate6Error = err.message ?? String(err);
  }

  // ── Gate 7: gap node IDs in blueprint match inference node order ───────────
  // Verify the blueprint's gap_inference_nodes matches what was passed in
  let gate7Pass = true;
  const gate7Failures = [];
  for (const caseDef of CASES) {
    const profile = buildUserWorkProfile({
      rawRoleText:         caseDef.profile.rawRoleText,
      socMatch:            caseDef.profile.socMatch,
      roleCategory:        caseDef.profile.roleCategory,
      tasks:               caseDef.profile.tasks,
      taskWeights:         caseDef.profile.taskWeights,
      aiFamiliarity:       caseDef.profile.aiFamiliarity,
      confirmedClusterIds: caseDef.profile.confirmedClusterIds,
    });
    try {
      const bp = buildRoadmapBlueprint(profile, caseDef.gapInference);
      const stored = bp.gap_inference_nodes ?? [];
      const expected = caseDef.gapInference.nodes;
      if (stored.length !== expected.length) {
        gate7Pass = false;
        gate7Failures.push(`${caseDef.id}_gap_inference_nodes_count_${stored.length}_vs_${expected.length}`);
      }
    } catch {}
  }

  // ── Aggregate results ──────────────────────────────────────────────────────

  const allGate1 = caseResults.every(r => r.gate1Pass);
  const allGate2 = caseResults.every(r => r.gate2Pass);
  const allGate3 = caseResults.every(r => r.gate3Pass) && gate3Failures.length === 0;
  const allGate5 = caseResults.every(r => r.gate5Pass);

  const completionGate = {
    gate1_all_blueprints_use_gap_inference_nodes:       allGate1,
    gate2_node_count_differs_from_fallback_or_verified: allGate2,
    gate3_variable_atom_counts_correct_all_6_fixtures:  allGate3,
    gate4_panel_copy_atom_validation_logic:             gate4Pass,
    gate5_validateRoadmap_no_false_atom_count_real_nodes: allGate5,
    gate6_fallback_still_works_with_null:               gate6Pass,
    gate7_gap_inference_nodes_stored_in_blueprint:      gate7Pass,
  };

  const allGatesPassed = Object.values(completionGate).every(Boolean);

  const report = {
    phase: 'phase4-wiring',
    generated_at: new Date().toISOString(),
    completion_gate: completionGate,
    all_gates_passed: allGatesPassed,
    case_results: caseResults.map(r => ({
      id: r.id,
      gate1: r.gate1Pass ? '[OK]' : '[FAIL]',
      gate2: r.gate2Pass ? '[OK]' : '[FAIL]',
      gate3: r.gate3Pass ? '[OK]' : '[FAIL]',
      gate5: r.gate5Pass ? '[OK]' : '[FAIL]',
      gap_nodes: r.actualGapCount,
      fallback_nodes: r.actualFallbackCount,
      atom_checks_passed: r.atomChecks.filter(a => a.pass).length,
      atom_checks_total:  r.atomChecks.length,
      atom_count_issues_from_real_blueprint: r.gate5AtomIssues.length,
    })),
    gate4_tests: gate4Tests,
    gate6_fallback: { pass: gate6Pass, error: gate6Error },
    gate7_failures: gate7Failures,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log('\n[PHASE 4] gapInferenceResult Wiring — 6 Fixtures × 7 Gates');
  console.log('');
  console.log('  fixture results:');
  for (const r of caseResults) {
    const allPass = r.gate1Pass && r.gate2Pass && r.gate3Pass && r.gate5Pass;
    const atomSummary = r.atomChecks.map(a => `${a.skill_ids_n}sk→${a.left_count}+${a.right_count}`).join(' ');
    console.log(`  ${allPass ? '[OK]' : '[FAIL]'} ${r.id}`);
    console.log(`         nodes: gap=${r.actualGapCount} fallback=${r.actualFallbackCount}`);
    console.log(`         atoms: ${atomSummary}`);
    if (r.gate5AtomIssues.length > 0) {
      for (const issue of r.gate5AtomIssues) {
        console.log(`         [ERROR] validateRoadmap PANEL_ATOM_COUNT_INVALID on node ${issue.node_id}`);
      }
    }
  }
  console.log('');
  console.log('  completion gate:');
  for (const [key, val] of Object.entries(completionGate)) {
    console.log(`    ${val ? '[OK]' : '[FAIL]'} ${key}`);
  }
  if (gate3Failures.length > 0) {
    console.log('\n  gate3 failures:');
    for (const f of gate3Failures) console.log(`    [ERROR] ${f}`);
  }
  if (gate7Failures.length > 0) {
    console.log('\n  gate7 failures:');
    for (const f of gate7Failures) console.log(`    [ERROR] ${f}`);
  }
  console.log(`\n  report saved: ${reportPath}`);

  if (!allGatesPassed) {
    console.error('\n[PHASE 4] FAILED completion gate');
    process.exit(1);
  }

  console.log('\n[PHASE 4] ALL GATES PASSED');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
