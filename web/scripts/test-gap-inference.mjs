/**
 * Phase 2 test gate — /api/gap-inference
 * Runs all 6 stress-test fixtures from ROADMAP_BUILD_DOC.md.
 * Server must be running: pnpm dev (default http://localhost:3000)
 *
 * Usage: node web/scripts/test-gap-inference.mjs
 */

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

const VALID_SKILL_IDS = new Set([
  'S1.1','S1.2','S1.3','S1.4','S1.5','S1.6','S1.7','S1.8',
  'S2.1','S2.2','S2.3','S2.4','S2.5','S2.6','S2.7','S2.8','S2.9','S2.10','S2.11',
  'S3.1','S3.2','S3.3','S3.4','S3.5','S3.6',
]);

const FAMILIARITY_SLICES = {
  none:         { assisted: 3, accelerated: 3, autonomous: 2 },
  basic:        { assisted: 2, accelerated: 3, autonomous: 2 },
  intermediate: { assisted: 1, accelerated: 3, autonomous: 3 },
  advanced:     { assisted: 0, accelerated: 3, autonomous: 3 },
};

// ── 6 Fixtures from ROADMAP_BUILD_DOC.md ──────────────────────────────────────

const FIXTURES = [
  {
    name: 'F1 — marketer, none, startup',
    body: {
      raw_role_text: 'growth marketer at B2B SaaS startup, content and outreach',
      role_category: 'marketer',
      work_context: 'startup',
      ai_familiarity: 'none',
      confirmed_cluster_ids: [],
      tasks: [
        { id: 't1', description: 'Develop content calendars', importance: 90 },
        { id: 't2', description: 'Create video and written campaigns', importance: 85 },
        { id: 't3', description: 'Analyse campaign KPIs', importance: 70 },
        { id: 't4', description: 'Research competitors', importance: 65 },
        { id: 't5', description: 'Coordinate with design', importance: 40 },
      ],
      task_weights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'medium', t5: 'low' },
    },
  },
  {
    name: 'F2 — marketer, intermediate, MNC (confirmed C1A+C2A)',
    body: {
      raw_role_text: 'senior brand manager at FMCG company, managing agency relationships',
      role_category: 'marketer',
      work_context: 'MNC',
      ai_familiarity: 'intermediate',
      confirmed_cluster_ids: ['C1A', 'C2A'],
      tasks: [
        { id: 't1', description: 'Develop content calendars', importance: 90 },
        { id: 't2', description: 'Create video and written campaigns', importance: 85 },
        { id: 't3', description: 'Analyse campaign KPIs', importance: 70 },
        { id: 't4', description: 'Research competitors', importance: 65 },
        { id: 't5', description: 'Coordinate with design', importance: 40 },
      ],
      task_weights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'medium', t5: 'low' },
    },
  },
  {
    name: 'F3 — sales, none, agency',
    body: {
      raw_role_text: 'account executive at B2B software agency, cold outbound focus',
      role_category: 'sales',
      work_context: 'agency',
      ai_familiarity: 'none',
      confirmed_cluster_ids: [],
      tasks: [
        { id: 't1', description: 'Prospect and qualify leads', importance: 90 },
        { id: 't2', description: 'Write outreach emails', importance: 85 },
        { id: 't3', description: 'Run demos', importance: 80 },
        { id: 't4', description: 'Update CRM after calls', importance: 70 },
        { id: 't5', description: 'Prepare proposals', importance: 65 },
      ],
      task_weights: { t1: 'high', t2: 'high', t3: 'high', t4: 'medium', t5: 'medium' },
    },
  },
  {
    name: 'F4 — pm/founder, basic, startup',
    body: {
      raw_role_text: 'solo founder at pre-seed B2B SaaS, doing product and some engineering',
      role_category: 'pm',
      work_context: 'startup',
      ai_familiarity: 'basic',
      confirmed_cluster_ids: ['C2A'],
      tasks: [
        { id: 't1', description: 'Define roadmap', importance: 90 },
        { id: 't2', description: 'Conduct user interviews', importance: 85 },
        { id: 't3', description: 'Manage sprints', importance: 70 },
        { id: 't4', description: 'Write engineering specs', importance: 65 },
        { id: 't5', description: 'Analyse metrics', importance: 50 },
      ],
      task_weights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'medium', t5: 'low' },
    },
  },
  {
    name: 'F5 — engineer, intermediate, startup',
    body: {
      raw_role_text: 'full-stack engineer at Series A startup building AI features',
      role_category: 'engineer',
      work_context: 'startup',
      ai_familiarity: 'intermediate',
      confirmed_cluster_ids: ['C2A', 'C2B'],
      tasks: [
        { id: 't1', description: 'Build and maintain API endpoints', importance: 90 },
        { id: 't2', description: 'Integrate LLM APIs', importance: 85 },
        { id: 't3', description: 'Write tests', importance: 70 },
        { id: 't4', description: 'Debug production issues', importance: 65 },
        { id: 't5', description: 'Optimise database queries', importance: 50 },
      ],
      task_weights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'medium', t5: 'low' },
    },
  },
  {
    name: 'F6 — student, none, freelance',
    body: {
      raw_role_text: 'CS student building AI projects for portfolio',
      role_category: 'student',
      work_context: 'freelance',
      ai_familiarity: 'none',
      confirmed_cluster_ids: [],
      tasks: [
        { id: 't1', description: 'Study new concepts', importance: 90 },
        { id: 't2', description: 'Build portfolio projects', importance: 85 },
        { id: 't3', description: 'Complete assignments', importance: 70 },
        { id: 't4', description: 'Research career paths', importance: 50 },
        { id: 't5', description: 'Practice coding', importance: 40 },
      ],
      task_weights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'low', t5: 'low' },
    },
  },
];

// ── Validators ─────────────────────────────────────────────────────────────────

function validateResult(result, fixture) {
  const fails = [];
  const { nodes, journey_analogy, fallback_used } = result;

  if (!Array.isArray(nodes)) { fails.push('nodes is not an array'); return fails; }

  // 1. Node count 5-9
  if (nodes.length < 5 || nodes.length > 9)
    fails.push(`node count = ${nodes.length} (expected 5-9)`);

  // 2. All titles are outcome statements (not capability labels)
  // Flag titles that are capability labels not outcome statements
  // "Build your X" is fine (outcome). Flagging: bare tech acronyms as title start, or "Learn/Understand/Master"
  const GENERIC_PATTERNS = /^(AI [A-Z]|LLM [A-Z]|RAG [A-Z]|MCP [A-Z]|Prompt [A-Z]|Agent [A-Z]|Learn |Understand |Master |Introduction to )/i;
  for (const n of nodes) {
    if (!n.title) { fails.push(`node missing title`); continue; }
    if (GENERIC_PATTERNS.test(n.title))
      fails.push(`title looks like capability label, not outcome: "${n.title}"`);
  }

  // 3. No duplicate skill_ids within a node
  for (const n of nodes) {
    const dupes = (n.skill_ids ?? []).filter((id, i) => n.skill_ids.indexOf(id) !== i);
    if (dupes.length) fails.push(`duplicate skill_ids [${dupes}] in "${n.title}"`);
  }

  // 4. All skill_ids valid
  for (const n of nodes) {
    const invalid = (n.skill_ids ?? []).filter(id => !VALID_SKILL_IDS.has(id));
    if (invalid.length) fails.push(`invalid skill_ids [${invalid}] in "${n.title}"`);
  }

  // 5. AAA distribution matches ai_familiarity
  const expected = FAMILIARITY_SLICES[fixture.body.ai_familiarity];
  const counts = { assisted: 0, accelerated: 0, autonomous: 0 };
  for (const n of nodes) {
    if (counts[n.aaa_phase] !== undefined) counts[n.aaa_phase]++;
    else fails.push(`unknown aaa_phase "${n.aaa_phase}" in "${n.title}"`);
  }
  if (counts.assisted !== expected.assisted || counts.accelerated !== expected.accelerated || counts.autonomous !== expected.autonomous)
    fails.push(`AAA distribution ${JSON.stringify(counts)} ≠ expected ${JSON.stringify(expected)} for familiarity="${fixture.body.ai_familiarity}"`);

  // 6. journey_analogy has all 4 fields
  if (!journey_analogy || !journey_analogy.frame || !journey_analogy.phase_1_meaning || !journey_analogy.phase_2_meaning || !journey_analogy.phase_3_meaning)
    fails.push('journey_analogy missing or has empty fields');

  // 7. journey_analogy not generic
  if (journey_analogy?.frame) {
    const GENERIC_ANALOGY = /^(Think of|Like a library|Like going to school|The journey of)/i;
    if (GENERIC_ANALOGY.test(journey_analogy.frame))
      fails.push(`journey_analogy.frame looks generic: "${journey_analogy.frame}"`);
  }

  // 8. why_for_this_person present on all nodes
  for (const n of nodes) {
    if (!n.why_for_this_person || n.why_for_this_person.trim().length < 10)
      fails.push(`why_for_this_person missing/too short on "${n.title}"`);
  }

  if (fallback_used) fails.push('[WARN] fallback_used=true — LLM failed, using AAA_PHASE_MAP');

  return fails;
}

// ── Runner ─────────────────────────────────────────────────────────────────────

async function runFixture(fixture) {
  const res = await fetch(`${BASE_URL}/api/gap-inference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fixture.body),
  });

  if (!res.ok) {
    return { fixture: fixture.name, pass: false, errors: [`HTTP ${res.status}: ${await res.text()}`], result: null };
  }

  const result = await res.json();
  const errors = validateResult(result, fixture);
  return { fixture: fixture.name, pass: errors.length === 0, errors, result };
}

async function main() {
  console.log(`\n=== Phase 2 Test Gate — /api/gap-inference ===`);
  console.log(`Target: ${BASE_URL}\n`);

  const results = [];
  for (const fixture of FIXTURES) {
    process.stdout.write(`Running ${fixture.name}... `);
    try {
      const r = await runFixture(fixture);
      results.push(r);
      console.log(r.pass ? '[PASS]' : `[FAIL] ${r.errors.length} issue(s)`);
      if (!r.pass) {
        for (const e of r.errors) console.log(`  ✗ ${e}`);
      }
      if (r.result?.nodes) {
        const titles = r.result.nodes.map((n, i) => `  ${i + 1}. [${n.aaa_phase.toUpperCase().slice(0,2)}] ${n.title}`).join('\n');
        console.log(`  Nodes (${r.result.nodes.length}):\n${titles}`);
        console.log(`  Analogy frame: "${r.result.journey_analogy?.frame ?? 'MISSING'}"`);
        console.log(`  fallback_used: ${r.result.fallback_used}`);
      }
      console.log('');
    } catch (err) {
      results.push({ fixture: fixture.name, pass: false, errors: [String(err)], result: null });
      console.log(`[ERROR] ${err}`);
    }
  }

  // F1 vs F2 cross-check: F2 (intermediate+confirmed) should have fewer Assisted than F1 (none)
  const f1 = results[0]?.result;
  const f2 = results[1]?.result;
  if (f1?.nodes && f2?.nodes) {
    const f1Assisted = f1.nodes.filter(n => n.aaa_phase === 'assisted').length;
    const f2Assisted = f2.nodes.filter(n => n.aaa_phase === 'assisted').length;
    const crossPass = f2Assisted < f1Assisted;
    console.log(`Cross-check F1 vs F2 Assisted nodes: F1=${f1Assisted} F2=${f2Assisted} → ${crossPass ? '[PASS]' : '[FAIL] F2 should have fewer Assisted'}`);
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== SUMMARY: ${passed}/${FIXTURES.length} passed, ${failed} failed ===`);

  if (failed > 0) {
    console.log('\n[STOP] Phase 2 test gate NOT passed. Do not proceed to Phase 3.');
    process.exit(1);
  } else {
    console.log('\n[OK] All fixtures pass. Phase 2 test gate cleared.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
