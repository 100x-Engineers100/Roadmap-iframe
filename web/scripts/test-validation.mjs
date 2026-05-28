/**
 * Phase 1 + 2 validation reports.
 * Pure JS, no LLM calls. Run from web/: node scripts/test-validation.mjs
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { ISSUE_CODES, ROADMAP_AUDIENCES, validateRoadmap } from '../lib/roadmap/validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const outputDir = resolve(repoRoot, 'test output');
const phase1ReportPath = resolve(outputDir, 'phase1-validation-report.json');
const phase2ReportPath = resolve(outputDir, 'phase2-schema-fixtures.json');

const NEGATIVE_FIXTURES = [
  {
    id: 'tues-roadmap-engineer',
    audience: 'engineer',
    path: 'test output/tues- roadmap-engineer-.json',
    expectedIssueCodes: [
      ISSUE_CODES.EMPTY_SKILL_IDS,
      ISSUE_CODES.GENERIC_NODE_TITLE,
      ISSUE_CODES.TERMINOLOGY_PRIMER_MISSING,
      ISSUE_CODES.MISSING_PANEL,
      ISSUE_CODES.MISSING_FLOW_FIELDS,
      ISSUE_CODES.MISSING_DEPTH_FIELDS,
      ISSUE_CODES.PROJECT_CADENCE_INVALID,
    ],
  },
  {
    id: 'marketer-after-fix',
    audience: 'marketer',
    path: 'test output/marketer - after fix.json',
    expectedIssueCodes: [
      ISSUE_CODES.EMPTY_SKILL_IDS,
      ISSUE_CODES.DUPLICATE_NODE_ID,
      ISSUE_CODES.DUPLICATE_NODE_TITLE,
      ISSUE_CODES.NON_TECH_CODE_TOOL,
      ISSUE_CODES.TERMINOLOGY_PRIMER_MISSING,
      ISSUE_CODES.MISSING_PANEL,
      ISSUE_CODES.PROJECT_CADENCE_INVALID,
    ],
  },
  {
    id: 'test3-marketer-repaired',
    audience: 'marketer',
    path: 'test output/test3.json',
    expectedIssueCodes: [
      ISSUE_CODES.EMPTY_SKILL_IDS,
      ISSUE_CODES.DUPLICATE_NODE_ID,
      ISSUE_CODES.GENERIC_NODE_TITLE,
      ISSUE_CODES.FALLBACK_OR_REPAIR_MARKER,
      ISSUE_CODES.TERMINOLOGY_PRIMER_MISSING,
      ISSUE_CODES.MISSING_PANEL,
      ISSUE_CODES.PROJECT_CADENCE_INVALID,
    ],
  },
];

const POSITIVE_PERSONA_INPUTS = [
  {
    id: 'marketer-campaign-content-ops',
    audience: 'marketer',
    raw_role_text: 'I run campaign planning, content ops, launch copy, and reporting. I do not code.',
    ai_familiarity: 'none',
    high_weight_tasks: ['Plan campaign calendar', 'Draft content briefs', 'Review campaign performance'],
    expected_status: 'pending_until_blueprint_exists',
  },
  {
    id: 'designer-brand-visual-workflow',
    audience: 'designer',
    raw_role_text: 'Brand designer handling visual systems, creative variants, and stakeholder review.',
    ai_familiarity: 'casual',
    high_weight_tasks: ['Create visual concepts', 'Adapt brand assets', 'Prepare presentation boards'],
    expected_status: 'pending_until_blueprint_exists',
  },
  {
    id: 'sales-outbound-crm-deal-prep',
    audience: 'sales',
    raw_role_text: 'Sales rep doing outbound research, CRM notes, followups, and deal prep.',
    ai_familiarity: 'none',
    high_weight_tasks: ['Research prospects', 'Personalize outbound emails', 'Prepare call followups'],
    expected_status: 'pending_until_blueprint_exists',
  },
  {
    id: 'founder-pm-launch-ops-discovery',
    audience: 'founder_pm',
    raw_role_text: 'Founder PM working on launch ops, customer discovery, prioritization, and team handoffs.',
    ai_familiarity: 'casual',
    high_weight_tasks: ['Synthesize customer calls', 'Prioritize launch scope', 'Write product briefs'],
    expected_status: 'pending_until_blueprint_exists',
  },
  {
    id: 'engineer-api-backend-agent-system',
    audience: 'engineer',
    raw_role_text: 'Backend engineer building API integrations, internal automations, and agent systems.',
    ai_familiarity: 'building',
    high_weight_tasks: ['Integrate APIs', 'Design backend services', 'Debug multi-step agent workflows'],
    expected_status: 'pending_until_blueprint_exists',
  },
  {
    id: 'student-learning-projects-portfolio',
    audience: 'student',
    raw_role_text: 'Student learning AI through projects and portfolio work before internships.',
    ai_familiarity: 'none',
    high_weight_tasks: ['Study new concepts', 'Build small projects', 'Document portfolio work'],
    expected_status: 'pending_until_blueprint_exists',
  },
];

const PERSONA_CASES = [
  {
    id: 'marketer-campaign-content-ops',
    audience: 'marketer',
    role_category: 'marketer',
    role_archetype: 'marketer',
    role_label: 'Campaign Marketer',
    tools: ['ChatGPT', 'Canva AI', 'Zapier'],
    skill_ids: ['C1A', 'C2A', 'C3B'],
    tasks: ['Plan campaign calendar', 'Draft content briefs', 'Review campaign performance'],
  },
  {
    id: 'designer-brand-visual-workflow',
    audience: 'designer',
    role_category: 'designer',
    role_archetype: 'designer',
    role_label: 'Brand Designer',
    tools: ['Figma AI', 'Canva AI', 'Adobe Firefly'],
    skill_ids: ['C1A', 'C2A', 'C3B'],
    tasks: ['Create visual concepts', 'Adapt brand assets', 'Prepare presentation boards'],
  },
  {
    id: 'sales-outbound-crm-deal-prep',
    audience: 'sales',
    role_category: 'sales',
    role_archetype: 'sales',
    role_label: 'Sales Rep',
    tools: ['ChatGPT', 'Clay', 'HubSpot AI'],
    skill_ids: ['C2A', 'C3B', 'C1A'],
    tasks: ['Research prospects', 'Personalize outbound emails', 'Prepare call followups'],
  },
  {
    id: 'founder-pm-launch-ops-discovery',
    audience: 'founder_pm',
    role_category: 'pm',
    role_archetype: 'founder',
    role_label: 'Founder PM',
    tools: ['Claude', 'Notion AI', 'Linear AI'],
    skill_ids: ['C2A', 'C1A', 'C3B'],
    tasks: ['Synthesize customer calls', 'Prioritize launch scope', 'Write product briefs'],
  },
  {
    id: 'engineer-api-backend-agent-system',
    audience: 'engineer',
    role_category: 'engineer',
    role_archetype: 'engineer',
    role_label: 'Backend Engineer',
    tools: ['FastAPI', 'Claude API', 'Supabase'],
    skill_ids: ['C2B', 'C2C', 'C3A'],
    tasks: ['Integrate APIs', 'Design backend services', 'Debug multi-step agent workflows'],
  },
  {
    id: 'student-learning-projects-portfolio',
    audience: 'student',
    role_category: 'student',
    role_archetype: 'student',
    role_label: 'AI Student',
    tools: ['ChatGPT', 'Claude', 'Notion AI'],
    skill_ids: ['C1A', 'C2A', 'C3B'],
    tasks: ['Study new concepts', 'Build small projects', 'Document portfolio work'],
  },
];

const NODE_TITLES = [
  'Prompt Control',
  'Context Setup',
  'Output Review',
  'Workflow Trigger',
  'Agent Handoff',
  'Work Proof',
];

const DEPTH_LEVELS = ['scan', 'practice', 'practice', 'build', 'operate', 'build'];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function termListFor(caseDef) {
  return caseDef.audience === 'engineer'
    ? ['Prompt', 'AI agent', 'automation trigger', 'context window', 'API']
    : ['Prompt', 'AI agent', 'automation trigger', 'context window', 'model'];
}

function makeProfile(caseDef) {
  const weightedTasks = caseDef.tasks.map((description, index) => ({
    id: `${caseDef.id}-task-${index + 1}`,
    description,
    weight: index === 2 ? 'medium' : 'high',
    source: 'manual',
  }));

  return {
    raw_role_text: `${caseDef.role_label}: ${caseDef.tasks.join('; ')}`,
    soc_title: caseDef.role_label,
    soc_code: null,
    role_category: caseDef.role_category,
    role_archetype: caseDef.role_archetype,
    industry_hints: [],
    selected_tasks: weightedTasks,
    high_weight_tasks: weightedTasks.filter(task => task.weight === 'high'),
    medium_weight_tasks: weightedTasks.filter(task => task.weight === 'medium'),
    low_weight_tasks: [],
    ai_familiarity: caseDef.audience === 'engineer' ? 'building' : 'none',
    confirmed_skill_ids: [],
    confirmed_cluster_ids: [],
  };
}

function makeAtom(caseDef, nodeId, order, side) {
  const termByOrder = termListFor(caseDef);
  const term = termByOrder[(order - 1) % termByOrder.length];
  const tool = caseDef.tools[(order - 1) % caseDef.tools.length];
  const depth = order <= 2 ? 'scan' : order <= 6 ? 'practice' : order <= 8 ? 'build' : 'operate';

  return {
    id: `${nodeId}-atom-${order}`,
    order,
    label: `${term} ${side === 'left' ? 'concept' : 'applied'}`,
    type: side === 'left' ? 'concept' : order % 2 === 0 ? 'step' : 'output',
    depth_level: depth,
    depth_reason: `${caseDef.role_label} needs to ${depth} this before using it in real work.`,
    explanation: `${term} shows how this ${caseDef.role_label} keeps AI work clear, bounded, and reviewable.`,
    learner_action: `Use ${tool} on one real task and write down the decision you made.`,
    output: `A saved ${caseDef.role_label.toLowerCase()} work sample for ${term}.`,
    tools: [tool],
    time_est: order <= 5 ? '30 min' : '45 min',
  };
}

function makePanel(caseDef, nodeId, title, nodeIndex) {
  return {
    expansion: {
      center_label: title,
      left_title: 'Concepts',
      right_title: 'Applied',
      left_items: Array.from({ length: 5 }, (_, index) => makeAtom(caseDef, nodeId, index + 1, 'left')),
      right_items: Array.from({ length: 5 }, (_, index) => makeAtom(caseDef, nodeId, index + 6, 'right')),
    },
    analogy: {
      lens_name: `${caseDef.role_label} operating room`,
      lens_domain: caseDef.role_label,
      concept_mappings: [
        {
          concept: 'Prompt',
          analogy_part: 'brief',
          plain_meaning: 'The instruction that shapes the work.',
          mistake_to_avoid: 'Starting with vague asks.',
        },
        {
          concept: 'AI agent',
          analogy_part: 'assistant',
          plain_meaning: 'A helper that can carry a sequence forward.',
          mistake_to_avoid: 'Letting it run without review.',
        },
        {
          concept: caseDef.audience === 'engineer' ? 'API' : 'automation trigger',
          analogy_part: 'handoff point',
          plain_meaning: 'The moment work moves from one step to the next.',
          mistake_to_avoid: 'Skipping the quality gate.',
        },
      ],
      takeaway: `${title} matters because the learner can see the work move from input to usable output.`,
    },
    checkpoint: {
      title: `${title} checkpoint`,
      scenario: `A real ${caseDef.role_label} task needs AI support without losing quality.`,
      artifact_to_create: `${title} work sample`,
      steps: ['Choose one task', 'Run the AI-assisted workflow', 'Review the output'],
      done_when: ['The artifact exists', 'The review notes are written', 'The next action is clear'],
      tools: caseDef.tools.slice(0, 2),
      time_est: '1 hr',
      confidence_check: 'Explain what changed and what still needed human judgment.',
    },
  };
}

function makeNode(caseDef, index) {
  const id = `${caseDef.audience}-node-${index + 1}`;
  const title = `${caseDef.role_label} ${NODE_TITLES[index]}`;
  const depthLevel = DEPTH_LEVELS[index];

  return {
    id,
    node_kind: index === 5 ? 'project' : 'concept',
    title,
    name_plain: title,
    one_line_desc: `Use AI to improve ${caseDef.tasks[index % caseDef.tasks.length].toLowerCase()}.`,
    skill_ids: [caseDef.skill_ids[index % caseDef.skill_ids.length]],
    depth: index < 2 ? 'foundational' : index < 4 ? 'intermediate' : 'advanced',
    depth_level: depthLevel,
    depth_reason: `${caseDef.role_label} should ${depthLevel} this skill at this point in the sequence.`,
    prerequisite_node_ids: [],
    unlocks_node_ids: [],
    panel: makePanel(caseDef, id, title, index),
    what_covers: `${title} covers the workflow, review bar, and proof artifact.`,
    what_do_after: `Apply ${title} to one live task.`,
    subnodes: [],
    concepts_left: [],
    concepts_right: [],
    analogy: {
      base: `${caseDef.role_label} workroom`,
      role_skin: `Daily ${caseDef.role_label} decisions`,
      bridge_line: 'The workflow is useful only when the learner can repeat it.',
    },
  };
}

function withSequentialFlow(nodes) {
  return nodes.map((node, index) => ({
    ...node,
    prerequisite_node_ids: index === 0 ? [] : [nodes[index - 1].id],
    unlocks_node_ids: index === nodes.length - 1 ? [] : [nodes[index + 1].id],
  }));
}

function makeTerminologyPrimer(caseDef, nodeIds) {
  return {
    terms: termListFor(caseDef).map((term, index) => ({
      term,
      appears_in_node_ids: [nodeIds[index % nodeIds.length]],
      plain_definition: `${term} in this roadmap is explained through ${caseDef.role_label} work, not abstract theory.`,
      role_example: `${caseDef.role_label} uses ${term} while completing ${caseDef.tasks[index % caseDef.tasks.length].toLowerCase()}.`,
      analogy_hook: `${term} is the ${index + 1}th part of the shared workroom lens.`,
      why_it_matters: `${term} appears before the roadmap so the learner recognizes it inside the nodes.`,
    })),
  };
}

function makeProjectCheckpoints(caseDef, nodeIds) {
  return [
    {
      id: `${caseDef.audience}-mini-1`,
      type: 'mini_project',
      after_node_ids: nodeIds.slice(0, 2),
      title: `${caseDef.role_label} mini project 1`,
      goal: 'Prove the first two concepts through one small artifact.',
      description: `Apply the early ${caseDef.role_label} workflow to a real task.`,
      concepts_checked: ['Prompt', 'context window'],
      artifact_to_build: 'A reviewed work sample',
      steps: ['Pick task', 'Build artifact', 'Review output'],
      done_when: ['Artifact saved', 'Review note written'],
      tools: caseDef.tools.slice(0, 2),
      time_est: '90 min',
    },
    {
      id: `${caseDef.audience}-mini-2`,
      type: 'mini_project',
      after_node_ids: nodeIds.slice(2, 4),
      title: `${caseDef.role_label} mini project 2`,
      goal: 'Prove the middle workflow can run end to end.',
      description: `Use the sequence to move ${caseDef.role_label} work from input to output.`,
      concepts_checked: ['AI agent', 'automation trigger'],
      artifact_to_build: 'A repeatable workflow note',
      steps: ['Set trigger', 'Run workflow', 'Check result'],
      done_when: ['Workflow runs', 'Failure note exists'],
      tools: caseDef.tools.slice(0, 2),
      time_est: '2 hrs',
    },
    {
      id: `${caseDef.audience}-final`,
      type: 'final_project',
      after_node_ids: nodeIds,
      title: `${caseDef.role_label} final project`,
      goal: 'Combine the full roadmap into one portfolio-grade proof.',
      description: `Package the complete ${caseDef.role_label} AI workflow into a clear artifact.`,
      concepts_checked: termListFor(caseDef),
      artifact_to_build: 'A final project case study',
      steps: ['Choose final task', 'Run full workflow', 'Package proof'],
      done_when: ['Case study complete', 'Output is reviewable', 'Next improvement is named'],
      tools: caseDef.tools,
      time_est: '4 hrs',
    },
  ];
}

function makeSchemaRoadmap(caseDef) {
  const nodes = withSequentialFlow(Array.from({ length: 6 }, (_, index) => makeNode(caseDef, index)));
  const nodeIds = nodes.map(node => node.id);

  return {
    user_profile: makeProfile(caseDef),
    analogy_lens: {
      lens_name: `${caseDef.role_label} operating room`,
      lens_domain: caseDef.role_label,
      why_this_lens: 'It keeps abstract AI terms tied to visible work decisions.',
    },
    terminology_primer: makeTerminologyPrimer(caseDef, nodeIds),
    project_checkpoints: makeProjectCheckpoints(caseDef, nodeIds),
    step1: {
      label: 'STEP 1 - DAYS 1-30',
      theme: 'Foundation',
      nodes: nodes.slice(0, 2),
      checkpoint: {
        title: `${caseDef.role_label} foundation checkpoint`,
        goal: 'Prove early control of AI output.',
        concepts: ['Prompt', 'context window'],
        problem_statement: 'The learner needs one repeatable AI-assisted work pattern.',
        done_criteria: 'A reviewed artifact and a written workflow note.',
        time_est: '2 hrs',
      },
    },
    step2: {
      label: 'STEP 2 - DAYS 31-60',
      theme: 'Applied Flow',
      nodes: nodes.slice(2, 4),
      checkpoint: {
        title: `${caseDef.role_label} flow checkpoint`,
        goal: 'Prove the workflow can run with review gates.',
        concepts: ['AI agent', 'automation trigger'],
        problem_statement: 'The learner needs a workflow that moves from input to usable output.',
        done_criteria: 'A repeatable sequence with review notes.',
        time_est: '2 hrs',
      },
    },
    step3: {
      label: 'STEP 3 - DAYS 61-90',
      theme: 'Proof',
      nodes: nodes.slice(4, 6),
      checkpoint: {
        title: `${caseDef.role_label} proof checkpoint`,
        goal: 'Prove the full roadmap through a final artifact.',
        concepts: termListFor(caseDef),
        problem_statement: 'The learner needs one complete proof of AI-native work.',
        done_criteria: 'A final project case study with the artifact attached.',
        time_est: '4 hrs',
      },
    },
    glossary: [],
  };
}

async function readJsonFixture(relativePath) {
  const absolutePath = resolve(repoRoot, relativePath);
  const raw = await readFile(absolutePath, 'utf8');
  return JSON.parse(raw);
}

function summarizeFixture(fixture, validation) {
  const issueCodes = [...new Set(validation.issues.map(issue => issue.code))];
  const missingExpectedCodes = fixture.expectedIssueCodes.filter(code => !issueCodes.includes(code));
  return {
    id: fixture.id,
    path: fixture.path,
    audience: fixture.audience,
    rejected: validation.valid === false,
    issue_count: validation.issues.length,
    issue_codes: issueCodes,
    expected_issue_codes: fixture.expectedIssueCodes,
    missing_expected_codes: missingExpectedCodes,
    sample_issues: validation.issues.slice(0, 12),
  };
}

export async function main() {
  const negativeResults = [];

  for (const fixture of NEGATIVE_FIXTURES) {
    const roadmap = await readJsonFixture(fixture.path);
    const validation = validateRoadmap(roadmap, { audience: fixture.audience });
    negativeResults.push(summarizeFixture(fixture, validation));
  }

  const rejectedBadFixtures = negativeResults.filter(result => result.rejected).length;
  const missingExpected = negativeResults.flatMap(result =>
    result.missing_expected_codes.map(code => ({ fixture: result.id, code }))
  );

  const phase1Report = {
    phase: 'phase1-baseline-audit-and-test-fixtures',
    generated_at: new Date().toISOString(),
    validator: 'web/lib/roadmap/validate.mjs',
    negative_fixture_count: NEGATIVE_FIXTURES.length,
    rejected_bad_fixture_count: rejectedBadFixtures,
    pending_positive_case_count: POSITIVE_PERSONA_INPUTS.length,
    completion_gate: {
      all_bad_fixtures_rejected: rejectedBadFixtures === NEGATIVE_FIXTURES.length,
      all_expected_issue_codes_present: missingExpected.length === 0,
      production_prompt_copied_in_test: false,
    },
    negative_fixtures: negativeResults,
    pending_positive_persona_inputs: POSITIVE_PERSONA_INPUTS,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(phase1ReportPath, `${JSON.stringify(phase1Report, null, 2)}\n`);

  console.log(`[PHASE 1] rejected bad fixtures: ${rejectedBadFixtures}/${NEGATIVE_FIXTURES.length}`);
  console.log(`[PHASE 1] pending positive persona cases: ${POSITIVE_PERSONA_INPUTS.length}`);
  console.log(`[PHASE 1] report: ${phase1ReportPath}`);

  if (!phase1Report.completion_gate.all_bad_fixtures_rejected || !phase1Report.completion_gate.all_expected_issue_codes_present) {
    console.error('[PHASE 1] validation report failed completion gate.');
    if (missingExpected.length > 0) console.error(JSON.stringify({ missingExpected }, null, 2));
    process.exit(1);
  }

  const schemaFixtures = PERSONA_CASES.map(caseDef => {
    const roadmap = makeSchemaRoadmap(caseDef);
    const validation = validateRoadmap(roadmap, { audience: caseDef.audience });
    return {
      id: caseDef.id,
      audience: caseDef.audience,
      role_category: caseDef.role_category,
      role_archetype: caseDef.role_archetype,
      valid: validation.valid,
      issue_codes: [...new Set(validation.issues.map(issue => issue.code))],
      node_count: [roadmap.step1, roadmap.step2, roadmap.step3].flatMap(step => step.nodes).length,
      first_node_atom_count: roadmap.step1.nodes[0].panel.expansion.left_items.length + roadmap.step1.nodes[0].panel.expansion.right_items.length,
      mini_project_count: roadmap.project_checkpoints.filter(project => project.type === 'mini_project').length,
      final_project_count: roadmap.project_checkpoints.filter(project => project.type === 'final_project').length,
      roadmap,
    };
  });

  const baseCase = PERSONA_CASES[0];
  const baseRoadmap = makeSchemaRoadmap(baseCase);
  const unitCases = [
    {
      id: 'exact-10-panel-atoms',
      expectedIssueCode: ISSUE_CODES.PANEL_ATOM_COUNT_INVALID,
      mutate: roadmap => roadmap.step1.nodes[0].panel.expansion.left_items.pop(),
    },
    {
      id: 'panel-atom-order',
      expectedIssueCode: ISSUE_CODES.PANEL_ATOM_ORDER_INVALID,
      mutate: roadmap => { roadmap.step1.nodes[0].panel.expansion.right_items[0].order = 5; },
    },
    {
      id: 'terminology-primer-count',
      expectedIssueCode: ISSUE_CODES.TERMINOLOGY_TERM_COUNT_LOW,
      mutate: roadmap => { roadmap.terminology_primer.terms = roadmap.terminology_primer.terms.slice(0, 4); },
    },
    {
      id: 'flow-order',
      expectedIssueCode: ISSUE_CODES.FLOW_ORDER_INVALID,
      mutate: roadmap => { roadmap.step1.nodes[0].unlocks_node_ids = ['wrong-next']; },
    },
    {
      id: 'node-depth-fields',
      expectedIssueCode: ISSUE_CODES.MISSING_DEPTH_FIELDS,
      mutate: roadmap => { delete roadmap.step1.nodes[0].depth_reason; },
    },
    {
      id: 'atom-depth-fields',
      expectedIssueCode: ISSUE_CODES.PANEL_ATOM_MISSING_FIELD,
      mutate: roadmap => { delete roadmap.step1.nodes[0].panel.expansion.left_items[0].depth_reason; },
    },
    {
      id: 'mini-project-cadence',
      expectedIssueCode: ISSUE_CODES.PROJECT_CADENCE_INVALID,
      mutate: roadmap => { roadmap.project_checkpoints = roadmap.project_checkpoints.filter(project => project.type !== 'mini_project'); },
    },
  ].map(testCase => {
    const roadmap = clone(baseRoadmap);
    testCase.mutate(roadmap);
    const validation = validateRoadmap(roadmap, { audience: baseCase.audience });
    const issueCodes = [...new Set(validation.issues.map(issue => issue.code))];
    return {
      id: testCase.id,
      expected_issue_code: testCase.expectedIssueCode,
      rejected: validation.valid === false,
      expected_issue_present: issueCodes.includes(testCase.expectedIssueCode),
      issue_codes: issueCodes,
      sample_issues: validation.issues.slice(0, 6),
    };
  });

  const requiredOldFixtureIssueCodes = [
    ISSUE_CODES.MISSING_PANEL,
    ISSUE_CODES.TERMINOLOGY_PRIMER_MISSING,
    ISSUE_CODES.MISSING_FLOW_FIELDS,
    ISSUE_CODES.MISSING_DEPTH_FIELDS,
    ISSUE_CODES.PROJECT_CADENCE_INVALID,
  ];
  const negativeSchemaGate = negativeResults.map(result => ({
    id: result.id,
    rejected: result.rejected,
    required_issue_codes: requiredOldFixtureIssueCodes,
    missing_required_issue_codes: requiredOldFixtureIssueCodes.filter(code => !result.issue_codes.includes(code)),
  }));

  const validAudienceFixtures = schemaFixtures.filter(fixture => fixture.valid).length;
  const passedUnitCases = unitCases.filter(testCase => testCase.rejected && testCase.expected_issue_present).length;
  const phase2Report = {
    phase: 'phase2-types-and-schema-contract',
    generated_at: new Date().toISOString(),
    validator: 'web/lib/roadmap/validate.mjs',
    schema_source: 'web/types/index.ts',
    audiences: ROADMAP_AUDIENCES,
    completion_gate: {
      all_six_audience_fixtures_valid: validAudienceFixtures === PERSONA_CASES.length,
      all_schema_unit_cases_rejected: passedUnitCases === unitCases.length,
      old_bad_outputs_fail_missing_panel_primer_flow_depth_projects: negativeSchemaGate.every(result => result.missing_required_issue_codes.length === 0),
    },
    audience_fixture_summary: schemaFixtures.map(({ roadmap, ...summary }) => summary),
    schema_unit_tests: unitCases,
    old_bad_fixture_schema_gate: negativeSchemaGate,
    fixtures: schemaFixtures.map(fixture => ({
      id: fixture.id,
      audience: fixture.audience,
      role_category: fixture.role_category,
      role_archetype: fixture.role_archetype,
      roadmap: fixture.roadmap,
    })),
  };

  await writeFile(phase2ReportPath, `${JSON.stringify(phase2Report, null, 2)}\n`);

  console.log(`[PHASE 2] valid audience fixtures: ${validAudienceFixtures}/${PERSONA_CASES.length}`);
  console.log(`[PHASE 2] schema unit tests passed: ${passedUnitCases}/${unitCases.length}`);
  console.log(`[PHASE 2] report: ${phase2ReportPath}`);

  if (
    !phase2Report.completion_gate.all_six_audience_fixtures_valid
    || !phase2Report.completion_gate.all_schema_unit_cases_rejected
    || !phase2Report.completion_gate.old_bad_outputs_fail_missing_panel_primer_flow_depth_projects
  ) {
    console.error('[PHASE 2] schema report failed completion gate.');
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
