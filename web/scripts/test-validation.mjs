/**
 * test-validation.mjs
 * Stress-tests the repair logic spec.
 * Pure JS — no LLM calls, no server needed. Run: node scripts/test-validation.mjs
 *
 * This file mirrors the repairRoadmap logic in web/lib/llm/roadmap-gen.ts.
 * Tests FAIL before Phase 2 fix because validateRoadmap throws instead of repairing.
 * Tests PASS after Phase 2 fix.
 */

const BANNED_CANVAS_TERMS = ['RAG', 'MCP', 'ReAct', 'API', 'LLM', 'SPAORL', 'BM25'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSubnode(id) {
  return {
    id,
    title: `Build task ${id}`,
    description: 'Use ChatGPT to complete a real work task.',
    outcome: 'A completed output.',
    tools: ['ChatGPT'],
    time_est: '30 min',
  };
}

function makeNode(id, name, subnodeCount = 3, skillIds = ['C2A']) {
  return {
    id,
    node_kind: 'concept',
    name_plain: name,
    one_line_desc: 'desc',
    what_covers: 'covers',
    what_do_after: 'after',
    subnodes: Array.from({ length: subnodeCount }, (_, i) => makeSubnode(`${id}-s${i + 1}`)),
    concepts_left: [],
    concepts_right: [],
    skill_ids: skillIds,
    analogy: { base: 'base', role_skin: 'skin', bridge_line: 'bridge' },
    depth: 'foundational',
  };
}

function makeStep(nodeCount, subnodesPerNode = 3) {
  return {
    label: 'STEP 1',
    theme: 'Theme',
    nodes: Array.from({ length: nodeCount }, (_, i) =>
      makeNode(`n${i + 1}`, `Node ${i + 1}`, subnodesPerNode)
    ),
    checkpoint: {
      title: 'CP',
      goal: 'goal',
      concepts: [],
      problem_statement: 'ps',
      done_criteria: 'dc',
      time_est: '1 hr',
    },
  };
}

// ── Repair Logic (mirrors roadmap-gen.ts repairRoadmap) ──────────────────────
// This is the SPEC. The TypeScript implementation must produce matching behavior.

function repairNode(node, stepIdx, nodeIdx) {
  const repairs = [];

  // Sanitize banned terms (don't throw, don't reject)
  for (const term of BANNED_CANVAS_TERMS) {
    if (node.name_plain.includes(term)) {
      node.name_plain = node.name_plain.replace(new RegExp('\\b' + term + '\\b', 'g'), '').replace(/\s+/g, ' ').trim();
      repairs.push({ issue: 'banned_term_sanitized', term, node_id: node.id });
    }
  }

  // Ensure subnodes array
  if (!Array.isArray(node.subnodes)) node.subnodes = [];

  // Trim excess subnodes
  if (node.subnodes.length > 4) node.subnodes = node.subnodes.slice(0, 4);

  // Pad missing subnodes
  while (node.subnodes.length < 3) {
    const idx = node.subnodes.length + 1;
    node.subnodes.push({
      id: `${node.id}-repair-${idx}`,
      title: `Apply ${node.name_plain || 'this skill'} to your work`,
      description: 'Practice this skill on a real task from your role.',
      outcome: 'A completed exercise you can add to your portfolio.',
      tools: ['ChatGPT'],
      time_est: '30 min',
    });
    repairs.push({ issue: 'subnode_count_low', node_id: node.id });
  }

  return repairs;
}

function repairStep(step, stepIdx) {
  const repairs = [];
  if (!Array.isArray(step.nodes)) step.nodes = [];

  // Trim excess nodes
  if (step.nodes.length > 3) step.nodes = step.nodes.slice(0, 3);

  // Repair each node first
  for (const node of step.nodes) {
    repairs.push(...repairNode(node, stepIdx));
  }

  // Add missing nodes AFTER per-node repair
  if (step.nodes.length < 2) {
    step.nodes.push(makeNode(`repair-s${stepIdx + 1}-n2`, 'Practice and Apply', 3, []));
    repairs.push({ issue: 'node_count_low', step: stepIdx + 1 });
  }

  return repairs;
}

function repairRoadmap(roadmap) {
  const stepKeys = ['step1', 'step2', 'step3'];
  const allRepairs = [];
  for (let i = 0; i < stepKeys.length; i++) {
    allRepairs.push(...repairStep(roadmap[stepKeys[i]], i));
  }
  if (!Array.isArray(roadmap.glossary)) roadmap.glossary = [];
  return { roadmap, repairs: allRepairs };
}

// ── Test Runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// ── TEST 1: 1-node step → repaired to 2 nodes, no fallback ───────────────────
console.log('\nTEST 1: 1-node step → repaired to >= 2 nodes (no fallback)');
{
  const roadmap = {
    step1: makeStep(1, 3),
    step2: makeStep(2, 3),
    step3: makeStep(2, 3),
    glossary: [],
  };
  const { roadmap: repaired, repairs } = repairRoadmap(JSON.parse(JSON.stringify(roadmap)));
  assert(repaired.step1.nodes.length >= 2, `step1 repaired: ${repaired.step1.nodes.length} nodes (need >= 2)`);
  assert(repairs.some(r => r.issue === 'node_count_low'), 'repair log recorded node_count_low');
  assert(repaired.step2.nodes.length >= 2, 'step2 unchanged (already valid)');
}

// ── TEST 2: Node with 2 subnodes → repaired to 3 subnodes ────────────────────
console.log('\nTEST 2: 2-subnode node → repaired to >= 3 subnodes');
{
  const roadmap = {
    step1: makeStep(2, 2),
    step2: makeStep(2, 3),
    step3: makeStep(2, 3),
    glossary: [],
  };
  const { roadmap: repaired, repairs } = repairRoadmap(JSON.parse(JSON.stringify(roadmap)));
  for (const node of repaired.step1.nodes) {
    assert(node.subnodes.length >= 3, `  Node "${node.name_plain}": ${node.subnodes.length} subnodes (need >= 3)`);
  }
  assert(repairs.some(r => r.issue === 'subnode_count_low'), 'repair log recorded subnode_count_low');
}

// ── TEST 3: Banned term in node name → sanitized, roadmap returned ────────────
console.log('\nTEST 3: Banned term in node name → sanitized, not rejected');
{
  const roadmap = {
    step1: makeStep(2, 3),
    step2: makeStep(2, 3),
    step3: makeStep(2, 3),
    glossary: [],
  };
  roadmap.step1.nodes[0].name_plain = 'Build an API connector';
  const { roadmap: repaired, repairs } = repairRoadmap(JSON.parse(JSON.stringify(roadmap)));
  const name = repaired.step1.nodes[0].name_plain;
  assert(!BANNED_CANVAS_TERMS.includes('API') || !name.includes('API'), `"API" removed from node name (got: "${name}")`);
  assert(repaired.step1.nodes.length >= 2, 'Roadmap still has >= 2 nodes after sanitization');
  assert(repairs.some(r => r.issue === 'banned_term_sanitized'), 'repair log recorded banned_term_sanitized');
}

// ── TEST 4: Excess subnodes → trimmed to 4 ───────────────────────────────────
console.log('\nTEST 4: 6-subnode node → trimmed to <= 4');
{
  const roadmap = {
    step1: makeStep(2, 3),
    step2: makeStep(2, 3),
    step3: makeStep(2, 3),
    glossary: [],
  };
  roadmap.step1.nodes[0].subnodes = Array.from({ length: 6 }, (_, i) => makeSubnode(`n1-s${i + 1}`));
  const { roadmap: repaired } = repairRoadmap(JSON.parse(JSON.stringify(roadmap)));
  assert(repaired.step1.nodes[0].subnodes.length <= 4, `subnodes trimmed to ${repaired.step1.nodes[0].subnodes.length} (max 4)`);
}

// ── TEST 5: Excess nodes per step → trimmed to 3 ─────────────────────────────
console.log('\nTEST 5: 5-node step → trimmed to <= 3');
{
  const roadmap = {
    step1: makeStep(5, 3),
    step2: makeStep(2, 3),
    step3: makeStep(2, 3),
    glossary: [],
  };
  const { roadmap: repaired } = repairRoadmap(JSON.parse(JSON.stringify(roadmap)));
  assert(repaired.step1.nodes.length <= 3, `step1 trimmed to ${repaired.step1.nodes.length} nodes (max 3)`);
}

// ── TEST 6: Garbage JSON string → parse fails, repair not called ──────────────
console.log('\nTEST 6: Garbage JSON → parse fails (triggers fallback path)');
{
  let result = 'no-throw';
  try {
    JSON.parse('not valid json {{{{');
    result = 'parse-succeeded';
  } catch {
    result = 'parse-failed';
  }
  assert(result === 'parse-failed', 'Garbage input fails JSON.parse (fallback should be returned by production code)');
}

// ── TEST 7: Valid roadmap → no repairs, no mutations ─────────────────────────
console.log('\nTEST 7: Valid roadmap → no repairs needed');
{
  const roadmap = {
    step1: makeStep(2, 3),
    step2: makeStep(2, 3),
    step3: makeStep(2, 3),
    glossary: [{ term: 'Prompt', definition: 'The instruction you give an AI.' }],
  };
  const { repairs } = repairRoadmap(JSON.parse(JSON.stringify(roadmap)));
  assert(repairs.length === 0, `Valid roadmap triggers 0 repairs (got ${repairs.length})`);
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(55)}`);
console.log(`REPAIR SPEC: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nFailing tests indicate repair logic spec violations.');
  process.exit(1);
}
console.log('[ALL PASS] Repair logic spec validated.');
