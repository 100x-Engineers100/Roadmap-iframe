/**
 * Phase 5 — Terminology primer post-enrichment wiring test.
 * Run from web/: node scripts/test-phase5-terminology.mjs
 *
 * What this tests:
 *   buildRoadmapBlueprint() pre-enrichment scan — validates that SKILL_REGISTRY
 *   atom text is rich enough that the canonical term scan finds ≥4 matches per fixture.
 *   This is the foundation; the post-enrichment re-scan in roadmap-gen.ts overrides it
 *   with richer LLM-generated text (that path requires a real LLM, untestable here).
 *
 * Gates:
 *   Gate 1: terms.length >= 4 for ALL 6 fixtures (scan ran, fallback NOT used)
 *   Gate 2: engineer fixture returns >= 8 terms
 *   Gate 3: marketer fixture returns >= 5 terms
 *   Gate 4: appears_in_node_ids accuracy — term appears in atom text of every listed node
 *   Gate 5: no term has appears_in_node_ids = [] (every term links to >= 1 node)
 *   Gate 6: all returned terms are in CANONICAL_TERM_NAMES (no hallucinated terms)
 *   Gate 7: scan ran (not fallback) — each fixture returns >= 1 term not in role fallback
 */

import { buildRoadmapBlueprint } from '../lib/roadmap/blueprint.mjs';
import { buildUserWorkProfile } from '../lib/profile/user-work-profile.mjs';
import {
  CANONICAL_TERM_NAMES,
  ROLE_TERMS_FALLBACK,
} from '../lib/roadmap/canonical-ai-terms.mjs';

// ── Identical fixtures to Phase 4 test ────────────────────────────────────────

const CASES = [
  {
    id: 'marketer-none',
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
    gapInference: {
      nodes: [
        { title: 'Map content workflow with OPT',         aaa_phase: 'assisted',    skill_ids: ['S2.1'],               why_for_this_person: 'Ops clarity first',             tools: ['Claude'] },
        { title: 'Draft briefs with prompt engineering',  aaa_phase: 'assisted',    skill_ids: ['S2.1', 'S2.2'],       why_for_this_person: 'Daily task',                    tools: ['Claude'] },
        { title: 'Build no-code content pipeline',        aaa_phase: 'accelerated', skill_ids: ['S3.2'],               why_for_this_person: 'Automate handoffs',              tools: ['n8n'] },
        { title: 'Set up trigger-based reporting',        aaa_phase: 'accelerated', skill_ids: ['S3.1', 'S3.2', 'S3.4'], why_for_this_person: 'Reports build themselves',    tools: ['n8n', 'Claude'] },
        { title: 'Deploy content monitoring agent',       aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4'],       why_for_this_person: 'Frees ops time',                tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Content production studio', phase_1_meaning: 'You direct manually', phase_2_meaning: 'Templates run on command', phase_3_meaning: 'Brief in, content out' },
      fallback_used: false,
    },
    minTerms: 5, // Gate 3
  },
  {
    id: 'designer-basic',
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
    gapInference: {
      nodes: [
        { title: 'Generate on-brand images with Midjourney', aaa_phase: 'assisted',    skill_ids: ['S1.1', 'S1.2'],   why_for_this_person: 'You create visuals daily',     tools: ['Midjourney'] },
        { title: 'Build brand training LoRA',                aaa_phase: 'assisted',    skill_ids: ['S1.3'],           why_for_this_person: 'Brand consistency at scale',   tools: ['FLUX'] },
        { title: 'Produce AVTV pipeline for presentations',  aaa_phase: 'accelerated', skill_ids: ['S1.7'],           why_for_this_person: 'Automate deck production',     tools: ['HeyGen', 'CapCut'] },
        { title: 'Automate asset delivery workflow',         aaa_phase: 'accelerated', skill_ids: ['S3.2', 'S2.1'],   why_for_this_person: 'No more manual handoffs',      tools: ['n8n'] },
        { title: 'Create AI influencer persona for brand',   aaa_phase: 'accelerated', skill_ids: ['S1.5'],           why_for_this_person: 'Scalable brand presence',      tools: ['FreePik Spaces'] },
        { title: 'Deploy autonomous brand asset generator',  aaa_phase: 'autonomous',  skill_ids: ['S1.2', 'S3.4'],   why_for_this_person: 'Briefs trigger full output',   tools: ['n8n', 'FLUX'] },
      ],
      journey_analogy: { frame: 'Scaling a creative studio', phase_1_meaning: 'You produce every asset', phase_2_meaning: 'Workflows run on trigger', phase_3_meaning: 'Briefs auto-route to pipelines' },
      fallback_used: false,
    },
    minTerms: 4,
  },
  {
    id: 'sales-none',
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
    gapInference: {
      nodes: [
        { title: 'Map your sales workflow with OPT',            aaa_phase: 'assisted',    skill_ids: ['S2.1'],                why_for_this_person: 'You research prospects daily',  tools: ['Claude'] },
        { title: 'Write AI-personalised outbound sequences',    aaa_phase: 'assisted',    skill_ids: ['S2.1', 'S2.2'],        why_for_this_person: 'You write emails every day',    tools: ['Claude'] },
        { title: 'Research prospects with ReAct loop',          aaa_phase: 'assisted',    skill_ids: ['S3.1', 'S2.2'],        why_for_this_person: 'Faster research per rep',        tools: ['n8n', 'Claude'] },
        { title: 'Build outbound automation pipeline',          aaa_phase: 'accelerated', skill_ids: ['S3.2', 'S3.4'],        why_for_this_person: 'Automate the handoff chain',     tools: ['n8n'] },
        { title: 'Evaluate pipeline quality with LLM-as-Judge', aaa_phase: 'accelerated', skill_ids: ['S3.6'],               why_for_this_person: 'Quality control per sequence',   tools: ['n8n', 'Claude'] },
        { title: 'Deploy autonomous CRM update agent',          aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4', 'S3.5'], why_for_this_person: 'CRM stays current without manual effort', tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Building your own outbound sales team', phase_1_meaning: 'You handle every task', phase_2_meaning: 'Pipelines run on command', phase_3_meaning: 'System runs autonomously' },
      fallback_used: false,
    },
    minTerms: 4,
  },
  {
    id: 'founder-pm-intermediate',
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
    gapInference: {
      nodes: [
        { title: 'Synthesize customer calls with structured output', aaa_phase: 'assisted',    skill_ids: ['S2.2'],                  why_for_this_person: 'You spend hours on call notes',     tools: ['Claude'] },
        { title: 'Build a product brief generator',                  aaa_phase: 'accelerated', skill_ids: ['S2.1', 'S2.2'],          why_for_this_person: 'Briefs take half your week',         tools: ['Claude', 'Notion'] },
        { title: 'Connect customer CRM to AI pipeline via MCP',      aaa_phase: 'accelerated', skill_ids: ['S2.7'],                  why_for_this_person: 'CRM context always current',         tools: ['Claude', 'n8n'] },
        { title: 'Automate launch scope prioritisation',             aaa_phase: 'accelerated', skill_ids: ['S3.4', 'S2.2'],          why_for_this_person: 'Decisions need data, not gut',       tools: ['Claude', 'Linear'] },
        { title: 'Ship MVP with Ship Cycle',                         aaa_phase: 'autonomous',  skill_ids: ['S2.11'],                 why_for_this_person: 'You need to validate fast',          tools: ['Lovable', 'Cursor'] },
        { title: 'Evaluate discovery quality automatically',         aaa_phase: 'autonomous',  skill_ids: ['S3.6'],                  why_for_this_person: 'Quality of insight drives decisions', tools: ['Claude', 'n8n'] },
        { title: 'Deploy multi-agent ops orchestrator',              aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4', 'S3.5'], why_for_this_person: 'Ops run without you in the loop',   tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Hiring your first operations manager', phase_1_meaning: 'You handle every task', phase_2_meaning: 'You build processes and delegate', phase_3_meaning: 'Ops run themselves' },
      fallback_used: false,
    },
    minTerms: 4,
  },
  {
    id: 'engineer-advanced',
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
    minTerms: 8, // Gate 2
  },
  {
    id: 'student-none',
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
    minTerms: 4,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenNodes(blueprint) {
  return (blueprint.phases ?? []).flatMap(p => p.nodes ?? []);
}

function extractAtomText(node) {
  const atoms = [
    ...(node.panel?.expansion?.left_items ?? []),
    ...(node.panel?.expansion?.right_items ?? []),
  ];
  return atoms.map(a => `${a.explanation ?? ''} ${a.learner_action ?? ''}`).join(' ');
}

function buildProfile(c) {
  return buildUserWorkProfile(
    c.profile.rawRoleText,
    c.profile.socMatch,
    c.profile.roleCategory,
    c.profile.tasks,
    c.profile.taskWeights,
    c.profile.confirmedClusterIds,
    c.profile.aiFamiliarity,
    'startup'
  );
}

// ── Run all gates ─────────────────────────────────────────────────────────────

const results = {};
let allPass = true;

function fail(id, gate, msg) {
  allPass = false;
  if (!results[id]) results[id] = [];
  results[id].push(`[FAIL] Gate ${gate}: ${msg}`);
}

function pass(id, gate, msg) {
  if (!results[id]) results[id] = [];
  results[id].push(`[PASS] Gate ${gate}: ${msg}`);
}

for (const c of CASES) {
  const profile = buildProfile(c);
  const blueprint = buildRoadmapBlueprint(profile, c.gapInference);
  const { terminology_primer } = blueprint;
  const terms = terminology_primer?.terms ?? [];
  const nodes = flattenNodes(blueprint);
  const nodeAtomTexts = nodes.map(n => extractAtomText(n));
  const nodeIds = nodes.map(n => n.id);
  const roleCategory = c.profile.roleCategory;
  const fallbackSet = new Set(ROLE_TERMS_FALLBACK[roleCategory] ?? ROLE_TERMS_FALLBACK.student);

  // Gate 1: terms.length >= 4
  if (terms.length >= 4) {
    pass(c.id, 1, `${terms.length} terms found`);
  } else {
    fail(c.id, 1, `only ${terms.length} terms — expected >= 4. Terms: ${JSON.stringify(terms.map(t => t.term))}`);
  }

  // Gate 2/3: role-specific minimum
  if (terms.length >= c.minTerms) {
    pass(c.id, c.id === 'engineer-advanced' ? 2 : c.id === 'marketer-none' ? 3 : '2/3', `${terms.length} >= ${c.minTerms}`);
  } else {
    fail(c.id, c.id === 'engineer-advanced' ? 2 : c.id === 'marketer-none' ? 3 : '2/3', `${terms.length} terms < required ${c.minTerms}. Terms: ${JSON.stringify(terms.map(t => t.term))}`);
  }

  // Gate 4: appears_in_node_ids accuracy — no false positives
  let gate4Pass = true;
  for (const t of terms) {
    for (const nid of (t.appears_in_node_ids ?? [])) {
      const idx = nodeIds.indexOf(nid);
      if (idx === -1) {
        fail(c.id, 4, `term "${t.term}" lists nodeId "${nid}" which doesn't exist`);
        gate4Pass = false;
        continue;
      }
      const nodeText = (nodeAtomTexts[idx] ?? '').toLowerCase();
      if (!nodeText.includes(t.term.toLowerCase())) {
        fail(c.id, 4, `false positive: term "${t.term}" listed in node "${nid}" but not found in that node's atom text`);
        gate4Pass = false;
      }
    }
  }
  if (gate4Pass) pass(c.id, 4, 'no false positives in appears_in_node_ids');

  // Gate 5: no empty appears_in_node_ids
  const emptyAppears = terms.filter(t => !t.appears_in_node_ids || t.appears_in_node_ids.length === 0);
  if (emptyAppears.length === 0) {
    pass(c.id, 5, 'all terms have >= 1 node in appears_in_node_ids');
  } else {
    fail(c.id, 5, `terms with empty appears_in_node_ids: ${JSON.stringify(emptyAppears.map(t => t.term))}`);
  }

  // Gate 6: all terms are in CANONICAL_TERM_NAMES
  const canonicalSet = new Set(CANONICAL_TERM_NAMES);
  const outsideCanon = terms.filter(t => !canonicalSet.has(t.term));
  if (outsideCanon.length === 0) {
    pass(c.id, 6, 'all terms from canonical set');
  } else {
    fail(c.id, 6, `non-canonical terms found: ${JSON.stringify(outsideCanon.map(t => t.term))}`);
  }

  // Gate 7: scan ran (not fallback) — at least 1 returned term is NOT in role fallback
  // Fallback returns exactly ROLE_TERMS_FALLBACK[role] terms. Scan returns different/more.
  const termsNotInFallback = terms.filter(t => !fallbackSet.has(t.term));
  if (termsNotInFallback.length > 0) {
    pass(c.id, 7, `scan ran — ${termsNotInFallback.length} terms outside fallback set: ${JSON.stringify(termsNotInFallback.slice(0, 3).map(t => t.term))}`);
  } else {
    fail(c.id, 7, `all returned terms match fallback exactly — scan may not have run. Terms: ${JSON.stringify(terms.map(t => t.term))}`);
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

console.log('\n=== PHASE 5 TERMINOLOGY TEST ===\n');
for (const [id, lines] of Object.entries(results)) {
  console.log(`--- ${id} ---`);
  for (const line of lines) console.log(`  ${line}`);
  console.log();
}

if (allPass) {
  console.log('=== ALL GATES PASS ===');
} else {
  console.log('=== FAILURES DETECTED — see above ===');
  process.exit(1);
}
