/**
 * Phase 3 - Deterministic Roadmap Blueprint test gate.
 * Imports production buildRoadmapBlueprint — no production code duplicated here.
 * Run from web/: node scripts/test-blueprint.mjs
 *
 * Phase 3 completion criteria:
 *   - blueprint has gap_inference_nodes + journey_analogy (NO analogy_lens / capability_gaps)
 *   - 3 phases with AAA labels (Assisted / Accelerated / Autonomous)
 *   - Variable node count per ai_familiarity: none=8, basic=7, intermediate=7, advanced=6
 *   - Fixture2 (basic) has fewer total nodes than Fixture1 (none)
 *   - Each node has aaa_phase field matching its parent phase
 *   - Atom count = skill_ids.length × 2 + 2 per node (left = skill_ids.length+1, right = skill_ids.length+1)
 *   - Depth fields on nodes map to aaa_phase
 *   - No per-node analogy field (analogy is now global journey_analogy)
 *   - Sequential flow maintained
 *   - Terminology primer ≥ 4 terms with all required non-empty fields
 *   - 2 mini_project + 1 final_project checkpoints
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { buildRoadmapBlueprint } from '../lib/roadmap/blueprint.mjs';
import { buildUserWorkProfile } from '../lib/profile/user-work-profile.mjs';
import { NON_TECH_TOOL_BLOCKLIST } from '../lib/roadmap/aaa-phase-map.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const outputDir = resolve(repoRoot, 'test output');
const reportPath = resolve(outputDir, 'phase3-blueprints.json');

// Expected node counts per ai_familiarity from sliceByFamiliarity:
//   none=8 (3A+3AC+2AU), basic=7 (2A+3AC+2AU), intermediate=7 (1A+3AC+3AU), advanced=6 (0A+3AC+3AU)
const EXPECTED_NODE_COUNTS = { none: 8, basic: 7, intermediate: 7, advanced: 6 };

// 6 stress-test fixtures covering all roles + familiarity variants
const CASES = [
  {
    id: 'marketer-none',
    rawRoleText: 'Digital marketer at a fintech startup running campaign and content ops',
    socMatch: { soc_code: '11-2021.00', title: 'Marketing Managers', confidence: 0.92 },
    roleCategory: 'marketer',
    aiFamiliarity: 'none', // expect 8 nodes
    confirmedClusterIds: ['C1A'],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'low' },
    tasks: [
      { id: 't1', description: 'Plan campaign calendar', importance: 92 },
      { id: 't2', description: 'Draft content briefs', importance: 88 },
      { id: 't3', description: 'Review campaign performance', importance: 76 },
      { id: 't4', description: 'Coordinate creative approvals', importance: 60 },
    ],
  },
  {
    id: 'designer-basic',
    rawRoleText: 'Brand designer creating visual systems for a SaaS team',
    socMatch: { soc_code: '27-1024.00', title: 'Graphic Designers', confidence: 0.9 },
    roleCategory: 'designer',
    aiFamiliarity: 'basic', // expect 7 nodes — MUST be fewer than marketer-none (8)
    confirmedClusterIds: ['C1A'],
    taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
    tasks: [
      { id: 't1', description: 'Create visual concepts', importance: 90 },
      { id: 't2', description: 'Adapt brand assets', importance: 74 },
      { id: 't3', description: 'Prepare presentation boards', importance: 83 },
    ],
  },
  {
    id: 'sales-none',
    rawRoleText: 'Sales rep doing outbound research, CRM notes, and deal prep',
    socMatch: { soc_code: '41-3091.00', title: 'Sales Representatives', confidence: 0.89 },
    roleCategory: 'sales',
    aiFamiliarity: 'none', // expect 8 nodes
    confirmedClusterIds: [],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
    tasks: [
      { id: 't1', description: 'Research prospects', importance: 90 },
      { id: 't2', description: 'Personalize outbound emails', importance: 86 },
      { id: 't3', description: 'Prepare call followups', importance: 72 },
    ],
  },
  {
    id: 'founder-pm-intermediate',
    rawRoleText: 'Founder PM at a healthcare startup handling launch ops and discovery',
    socMatch: { soc_code: '11-1021.00', title: 'Chief Executives', confidence: 0.86 },
    roleCategory: 'pm',
    aiFamiliarity: 'intermediate', // expect 7 nodes
    confirmedClusterIds: ['C2A'],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
    tasks: [
      { id: 't1', description: 'Synthesize customer calls', importance: 94 },
      { id: 't2', description: 'Prioritize launch scope', importance: 89 },
      { id: 't3', description: 'Write product briefs', importance: 75 },
    ],
  },
  {
    id: 'engineer-advanced',
    rawRoleText: 'Backend engineer building API integrations and agent systems',
    socMatch: { soc_code: '15-1252.00', title: 'Software Developers', confidence: 0.94 },
    roleCategory: 'engineer',
    aiFamiliarity: 'advanced', // expect 6 nodes — fewest of all
    confirmedClusterIds: ['C2B'],
    taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
    tasks: [
      { id: 't1', description: 'Integrate APIs', importance: 92 },
      { id: 't2', description: 'Design backend services', importance: 80 },
      { id: 't3', description: 'Debug multi-step agent workflows', importance: 85 },
    ],
  },
  {
    id: 'student-none',
    rawRoleText: 'Student learning AI through projects and portfolio work',
    socMatch: { soc_code: '25-3099.00', title: 'Student Learners', confidence: 0.78 },
    roleCategory: 'student',
    aiFamiliarity: 'none', // expect 8 nodes
    confirmedClusterIds: [],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
    tasks: [
      { id: 't1', description: 'Study new concepts', importance: 88 },
      { id: 't2', description: 'Build small projects', importance: 84 },
      { id: 't3', description: 'Document portfolio work', importance: 70 },
    ],
  },
];

const VALID_AAA_PHASES = new Set(['assisted', 'accelerated', 'autonomous']);
const NON_TECH_ROLES = new Set(['marketer', 'designer', 'sales']);
// Maps AAA keyword in phase label → aaa_phase value nodes must have
const LABEL_KEYWORD_TO_PHASE = { 'Assisted': 'assisted', 'Accelerated': 'accelerated', 'Autonomous': 'autonomous' };
const AAA_DEPTH = {
  assisted:    { depth: 'foundational', depth_level: 'scan' },
  accelerated: { depth: 'intermediate', depth_level: 'practice' },
  autonomous:  { depth: 'advanced',     depth_level: 'build' },
};
const REQUIRED_TERM_FIELDS = ['term', 'plain_definition', 'role_example', 'analogy_hook', 'why_it_matters', 'appears_in_node_ids'];
const REQUIRED_CHECKPOINT_FIELDS = ['id', 'type', 'after_node_ids', 'title', 'goal', 'description', 'concepts_checked', 'artifact_to_build', 'steps', 'done_when', 'tools', 'time_est'];

function flattenNodes(blueprint) {
  const nodes = [];
  for (const phase of (blueprint.phases ?? [])) {
    for (const node of (phase.nodes ?? [])) nodes.push(node);
  }
  return nodes;
}

function validateBlueprint(caseDef, blueprint, userProfile) {
  const failures = [];

  // ── Top-level structure ──────────────────────────────────────────────────────
  if (!blueprint.phases || !Array.isArray(blueprint.phases)) {
    failures.push('blueprint_missing_phases_array');
    return failures;
  }
  // gap_inference_nodes must exist (array)
  if (!Array.isArray(blueprint.gap_inference_nodes)) {
    failures.push('blueprint_missing_gap_inference_nodes');
  }

  // journey_analogy must exist with required fields
  const ja = blueprint.journey_analogy;
  if (!ja) {
    failures.push('blueprint_missing_journey_analogy');
  } else {
    for (const f of ['frame', 'phase_1_meaning', 'phase_2_meaning', 'phase_3_meaning']) {
      if (!ja[f] || String(ja[f]).trim().length === 0) {
        failures.push(`journey_analogy_missing_or_empty_${f}`);
      }
    }
  }

  // analogy_lens and capability_gaps must NOT exist
  if (blueprint.analogy_lens !== undefined && blueprint.analogy_lens !== null) {
    failures.push('blueprint_has_forbidden_analogy_lens_field');
  }
  if (blueprint.capability_gaps !== undefined && blueprint.capability_gaps !== null) {
    failures.push('blueprint_has_forbidden_capability_gaps_field');
  }

  // ── Phases: 2-3 phases, all non-empty, labels in AAA order ─────────────────
  const phaseCount = blueprint.phases.length;
  if (phaseCount < 2 || phaseCount > 3) {
    failures.push(`phases_count_must_be_2_or_3_got_${phaseCount}`);
  }
  const aaaOrder = ['Assisted', 'Accelerated', 'Autonomous'];
  let lastAAAIndex = -1;
  for (let pi = 0; pi < blueprint.phases.length; pi++) {
    const phase = blueprint.phases[pi];
    // Label must contain an AAA keyword in increasing order
    const aaaIdx = aaaOrder.findIndex(k => phase.label?.includes(k));
    if (aaaIdx === -1) {
      failures.push(`phase_${pi + 1}_label_must_contain_an_aaa_keyword_got_${phase.label}`);
    } else if (aaaIdx <= lastAAAIndex) {
      failures.push(`phase_${pi + 1}_aaa_label_out_of_order_${phase.label}`);
    } else {
      lastAAAIndex = aaaIdx;
    }
    if (!Array.isArray(phase.nodes) || phase.nodes.length === 0) {
      failures.push(`phase_${pi + 1}_must_have_gte_1_node`);
    }
  }

  // ── Phase-node aaa_phase consistency ─────────────────────────────────────────
  for (let pi = 0; pi < blueprint.phases.length; pi++) {
    const phase = blueprint.phases[pi];
    const expectedPhaseType = Object.entries(LABEL_KEYWORD_TO_PHASE)
      .find(([kw]) => phase.label?.includes(kw))?.[1];
    if (expectedPhaseType) {
      for (const node of (phase.nodes ?? [])) {
        if (node.aaa_phase !== expectedPhaseType) {
          failures.push(`phase_${pi + 1}_node_${node.id}_aaa_phase_expected_${expectedPhaseType}_got_${node.aaa_phase}`);
        }
      }
    }
  }

  // ── Node count matches ai_familiarity ────────────────────────────────────────
  const allNodes = flattenNodes(blueprint);
  const expectedCount = EXPECTED_NODE_COUNTS[caseDef.aiFamiliarity] ?? 8;
  if (allNodes.length !== expectedCount) {
    failures.push(`node_count_expected_${expectedCount}_for_${caseDef.aiFamiliarity}_got_${allNodes.length}`);
  }

  const nodeIds = allNodes.map(n => n.id);

  // ── Per-node validations ─────────────────────────────────────────────────────
  for (let ni = 0; ni < allNodes.length; ni++) {
    const node = allNodes[ni];
    const prefix = `node_${ni + 1}[${node.id}]`;

    if (!node.id) failures.push(`${prefix}_missing_id`);
    if (!node.title || node.title.trim().length === 0) failures.push(`${prefix}_missing_title`);
    if (!node.node_kind) failures.push(`${prefix}_missing_node_kind`);

    // aaa_phase field required and valid
    if (!VALID_AAA_PHASES.has(node.aaa_phase)) {
      failures.push(`${prefix}_invalid_aaa_phase_got_${node.aaa_phase}`);
    }

    // No per-node analogy (removed in Phase 3)
    if (node.panel?.analogy !== undefined && node.panel?.analogy !== null) {
      failures.push(`${prefix}_panel_must_not_have_analogy_field`);
    }

    // Depth fields map to aaa_phase
    const expectedDepth = AAA_DEPTH[node.aaa_phase];
    if (expectedDepth) {
      if (node.depth !== expectedDepth.depth) {
        failures.push(`${prefix}_depth_expected_${expectedDepth.depth}_for_${node.aaa_phase}_got_${node.depth}`);
      }
      if (node.depth_level !== expectedDepth.depth_level) {
        failures.push(`${prefix}_depth_level_expected_${expectedDepth.depth_level}_for_${node.aaa_phase}_got_${node.depth_level}`);
      }
    }
    if (!node.depth_reason || node.depth_reason.trim().length === 0) {
      failures.push(`${prefix}_missing_depth_reason`);
    }

    if (!Array.isArray(node.skill_ids) || node.skill_ids.length === 0) {
      failures.push(`${prefix}_empty_skill_ids`);
      continue;
    }

    // Sequential flow
    if (ni === 0) {
      if (!Array.isArray(node.prerequisite_node_ids) || node.prerequisite_node_ids.length !== 0) {
        failures.push(`${prefix}_first_node_must_have_empty_prerequisites`);
      }
      if (!Array.isArray(node.unlocks_node_ids) || node.unlocks_node_ids[0] !== nodeIds[1]) {
        failures.push(`${prefix}_first_node_must_unlock_node2_expected_${nodeIds[1]}`);
      }
    } else if (ni === allNodes.length - 1) {
      if (!Array.isArray(node.unlocks_node_ids) || node.unlocks_node_ids.length !== 0) {
        failures.push(`${prefix}_last_node_must_have_empty_unlocks`);
      }
      if (!Array.isArray(node.prerequisite_node_ids) || node.prerequisite_node_ids[0] !== nodeIds[ni - 1]) {
        failures.push(`${prefix}_last_node_prerequisite_expected_${nodeIds[ni - 1]}`);
      }
    } else {
      if (!Array.isArray(node.prerequisite_node_ids) || node.prerequisite_node_ids[0] !== nodeIds[ni - 1]) {
        failures.push(`${prefix}_prerequisite_expected_${nodeIds[ni - 1]}_got_${node.prerequisite_node_ids}`);
      }
      if (!Array.isArray(node.unlocks_node_ids) || node.unlocks_node_ids[0] !== nodeIds[ni + 1]) {
        failures.push(`${prefix}_unlocks_expected_${nodeIds[ni + 1]}_got_${node.unlocks_node_ids}`);
      }
    }

    // Panel
    if (!node.panel) { failures.push(`${prefix}_missing_panel`); continue; }
    const exp = node.panel.expansion;
    if (!exp) { failures.push(`${prefix}_panel_missing_expansion`); continue; }
    if (!Array.isArray(exp.left_items) || !Array.isArray(exp.right_items)) {
      failures.push(`${prefix}_panel_expansion_items_not_arrays`); continue;
    }

    // Variable atom count: left = skill_ids.length+1, right = skill_ids.length+1
    const expectedLeft = node.skill_ids.length + 1;
    const expectedRight = node.skill_ids.length + 1;
    if (exp.left_items.length !== expectedLeft) {
      failures.push(`${prefix}_left_atoms_expected_${expectedLeft}_got_${exp.left_items.length}`);
    }
    if (exp.right_items.length !== expectedRight) {
      failures.push(`${prefix}_right_atoms_expected_${expectedRight}_got_${exp.right_items.length}`);
    }

    // Atom order sequence: left = 1..n+1, right = n+2..2n+2
    const n = node.skill_ids.length;
    for (let i = 0; i < exp.left_items.length; i++) {
      const expected = i + 1;
      if (exp.left_items[i].order !== expected) {
        failures.push(`${prefix}_left_atom_${i + 1}_order_expected_${expected}_got_${exp.left_items[i].order}`);
      }
    }
    for (let i = 0; i < exp.right_items.length; i++) {
      const expected = n + 2 + i;
      if (exp.right_items[i].order !== expected) {
        failures.push(`${prefix}_right_atom_${i + 1}_order_expected_${expected}_got_${exp.right_items[i].order}`);
      }
    }

    // Atom field completeness + non-tech tool filter
    const allAtoms = [...exp.left_items, ...exp.right_items];
    const isNonTech = NON_TECH_ROLES.has(userProfile.role_category);
    for (const atom of allAtoms) {
      const aPrefix = `${prefix}_atom_${atom.id ?? atom.order}`;
      for (const f of ['id', 'order', 'label', 'type', 'depth_level', 'depth_reason', 'explanation', 'learner_action', 'output', 'tools', 'time_est']) {
        const val = atom[f];
        if (val === undefined || val === null) {
          failures.push(`${aPrefix}_missing_${f}`);
        } else if (typeof val === 'string' && val.trim().length === 0) {
          failures.push(`${aPrefix}_empty_${f}`);
        } else if (Array.isArray(val) && val.length === 0) {
          failures.push(`${aPrefix}_empty_array_${f}`);
        }
      }
      // Non-tech roles must not receive code/API/server tools
      if (isNonTech && Array.isArray(atom.tools)) {
        for (const tool of atom.tools) {
          if (NON_TECH_TOOL_BLOCKLIST.includes(tool)) {
            failures.push(`${prefix}_non_tech_forbidden_tool_${tool}_in_atom_${atom.id}`);
          }
        }
      }
    }

    // Checkpoint
    const ckpt = node.panel.checkpoint;
    if (!ckpt) {
      failures.push(`${prefix}_panel_missing_checkpoint`);
    } else {
      for (const f of ['title', 'scenario', 'artifact_to_create', 'steps', 'done_when', 'tools', 'time_est', 'confidence_check']) {
        const val = ckpt[f];
        if (val === undefined || val === null) {
          failures.push(`${prefix}_checkpoint_missing_${f}`);
        } else if (typeof val === 'string' && val.trim().length === 0) {
          failures.push(`${prefix}_checkpoint_empty_${f}`);
        } else if (Array.isArray(val) && val.length === 0) {
          failures.push(`${prefix}_checkpoint_empty_array_${f}`);
        }
      }
    }
  }

  // ── Terminology primer ───────────────────────────────────────────────────────
  const terms = blueprint.terminology_primer?.terms;
  if (!Array.isArray(terms)) {
    failures.push('terminology_primer_terms_not_array');
  } else {
    if (terms.length < 4) {
      failures.push(`terminology_primer_must_have_gte_4_terms_got_${terms.length}`);
    }
    for (let ti = 0; ti < terms.length; ti++) {
      const term = terms[ti];
      for (const f of REQUIRED_TERM_FIELDS) {
        const val = term[f];
        if (val === undefined || val === null) {
          failures.push(`term_${ti + 1}_missing_${f}`);
        } else if (typeof val === 'string' && val.trim().length === 0) {
          failures.push(`term_${ti + 1}_empty_${f}`);
        } else if (Array.isArray(val) && val.length === 0) {
          failures.push(`term_${ti + 1}_empty_array_${f}`);
        }
      }
    }
  }

  // ── Project checkpoints ──────────────────────────────────────────────────────
  const checkpoints = blueprint.project_checkpoints;
  if (!Array.isArray(checkpoints)) {
    failures.push('blueprint_missing_project_checkpoints');
  } else {
    if (checkpoints.length !== 3) {
      failures.push(`project_checkpoints_expected_3_got_${checkpoints.length}`);
    }
    const minis = checkpoints.filter(c => c.type === 'mini_project');
    const finals = checkpoints.filter(c => c.type === 'final_project');
    if (minis.length !== 2) failures.push(`expected_2_mini_projects_got_${minis.length}`);
    if (finals.length !== 1) failures.push(`expected_1_final_project_got_${finals.length}`);

    for (const cp of checkpoints) {
      for (const f of REQUIRED_CHECKPOINT_FIELDS) {
        const val = cp[f];
        if (val === undefined || val === null) {
          failures.push(`checkpoint_${cp.id ?? cp.type}_missing_${f}`);
        } else if (Array.isArray(val) && val.length === 0 && f !== 'tools') {
          failures.push(`checkpoint_${cp.id ?? cp.type}_empty_array_${f}`);
        }
      }
      // after_node_ids must reference real node IDs
      for (const nid of (cp.after_node_ids ?? [])) {
        if (!nodeIds.includes(nid)) {
          failures.push(`checkpoint_${cp.id}_after_node_id_${nid}_not_in_nodes`);
        }
      }
    }
  }

  return failures;
}

async function main() {
  const results = CASES.map(caseDef => {
    const userProfile = buildUserWorkProfile({
      rawRoleText: caseDef.rawRoleText,
      socMatch: caseDef.socMatch,
      roleCategory: caseDef.roleCategory,
      tasks: caseDef.tasks,
      taskWeights: caseDef.taskWeights,
      aiFamiliarity: caseDef.aiFamiliarity,
      confirmedClusterIds: caseDef.confirmedClusterIds,
    });

    let blueprint = null;
    let buildError = null;
    try {
      blueprint = buildRoadmapBlueprint(userProfile);
    } catch (err) {
      buildError = err.message ?? String(err);
    }

    if (buildError || !blueprint) {
      return {
        id: caseDef.id,
        valid: false,
        failures: [`build_threw_error: ${buildError}`],
        blueprint: null,
        user_profile: userProfile,
      };
    }

    const failures = validateBlueprint(caseDef, blueprint, userProfile);
    const allNodes = flattenNodes(blueprint);
    const aaaCounts = { assisted: 0, accelerated: 0, autonomous: 0 };
    for (const n of allNodes) aaaCounts[n.aaa_phase] = (aaaCounts[n.aaa_phase] ?? 0) + 1;

    return {
      id: caseDef.id,
      valid: failures.length === 0,
      failures,
      summary: {
        role_category: userProfile.role_category,
        role_archetype: userProfile.role_archetype,
        ai_familiarity: caseDef.aiFamiliarity,
        total_nodes: allNodes.length,
        aaa_counts: aaaCounts,
        total_atoms: allNodes.reduce((s, n) => {
          const exp = n.panel?.expansion;
          return s + (exp ? (exp.left_items?.length ?? 0) + (exp.right_items?.length ?? 0) : 0);
        }, 0),
        terminology_terms: blueprint.terminology_primer?.terms?.length ?? 0,
        journey_frame: blueprint.journey_analogy?.frame,
        project_checkpoints: blueprint.project_checkpoints?.length ?? 0,
        node_aaa_phases: allNodes.map(n => n.aaa_phase),
        node_ids: allNodes.map(n => n.id),
      },
      blueprint,
      user_profile: userProfile,
    };
  });

  const passed = results.filter(r => r.valid).length;
  const [r0, r1, r2, r3, r4, r5] = results;

  // ── Completion gate ──────────────────────────────────────────────────────────
  const completionGate = {
    all_six_fixtures_valid: passed === CASES.length,
    fixture2_basic_has_fewer_nodes_than_fixture1_none: (r1?.summary?.total_nodes ?? 0) < (r0?.summary?.total_nodes ?? 0),
    fixture5_advanced_has_fewest_nodes: results.every((r, i) => i === 4 || (r4?.summary?.total_nodes ?? 0) <= (r?.summary?.total_nodes ?? Infinity)),
    all_blueprints_have_journey_analogy: results.every(r => !!r.blueprint?.journey_analogy?.frame),
    no_analogy_lens_field: results.every(r => r.blueprint?.analogy_lens === undefined || r.blueprint?.analogy_lens === null),
    no_capability_gaps_field: results.every(r => r.blueprint?.capability_gaps === undefined || r.blueprint?.capability_gaps === null),
    all_phases_have_aaa_labels: results.every(r => {
      if (!r.blueprint) return false;
      // Each phase label must include an AAA keyword, in order (Assisted before Accelerated before Autonomous)
      const aaaOrder = ['Assisted', 'Accelerated', 'Autonomous'];
      let lastIdx = -1;
      for (const phase of r.blueprint.phases) {
        const idx = aaaOrder.findIndex(k => phase.label?.includes(k));
        if (idx === -1 || idx <= lastIdx) return false;
        lastIdx = idx;
      }
      return true;
    }),
    all_nodes_have_aaa_phase: results.every(r => {
      if (!r.blueprint) return false;
      return flattenNodes(r.blueprint).every(n => VALID_AAA_PHASES.has(n.aaa_phase));
    }),
    all_nodes_have_no_per_node_analogy: results.every(r => {
      if (!r.blueprint) return false;
      return flattenNodes(r.blueprint).every(n => n.panel?.analogy === undefined || n.panel?.analogy === null);
    }),
    variable_atom_count_correct: results.every(r => {
      if (!r.blueprint) return false;
      return flattenNodes(r.blueprint).every(n => {
        const exp = n.panel?.expansion;
        if (!exp) return false;
        const expectedPerSide = n.skill_ids.length + 1;
        return exp.left_items.length === expectedPerSide && exp.right_items.length === expectedPerSide;
      });
    }),
    sequential_flow_valid: results.every(r => {
      if (!r.blueprint) return false;
      const nodes = flattenNodes(r.blueprint);
      if (nodes.length === 0) return false;
      if (nodes[0].prerequisite_node_ids?.length !== 0) return false;
      if (nodes[nodes.length - 1].unlocks_node_ids?.length !== 0) return false;
      for (let i = 1; i < nodes.length - 1; i++) {
        if (nodes[i].prerequisite_node_ids?.[0] !== nodes[i - 1].id) return false;
        if (nodes[i].unlocks_node_ids?.[0] !== nodes[i + 1].id) return false;
      }
      return true;
    }),
    terminology_primer_gte_4_terms: results.every(r => (r.blueprint?.terminology_primer?.terms?.length ?? 0) >= 4),
    project_checkpoints_2_mini_plus_1_final: results.every(r => {
      const cps = r.blueprint?.project_checkpoints ?? [];
      return cps.filter(c => c.type === 'mini_project').length === 2 &&
             cps.filter(c => c.type === 'final_project').length === 1;
    }),
    atom_orders_correct: results.every(r => {
      if (!r.blueprint) return false;
      return flattenNodes(r.blueprint).every(node => {
        const exp = node.panel?.expansion;
        if (!exp) return false;
        const n = node.skill_ids.length;
        return exp.left_items.every((a, i) => a.order === i + 1) &&
               exp.right_items.every((a, i) => a.order === n + 2 + i);
      });
    }),
    phase_nodes_match_phase_aaa_type: results.every(r => {
      if (!r.blueprint) return false;
      for (const phase of r.blueprint.phases) {
        const expectedType = Object.entries(LABEL_KEYWORD_TO_PHASE)
          .find(([kw]) => phase.label?.includes(kw))?.[1];
        if (!expectedType) return false;
        if (!(phase.nodes ?? []).every(n => n.aaa_phase === expectedType)) return false;
      }
      return true;
    }),
    non_tech_roles_have_no_forbidden_tools: results.every(r => {
      if (!r.blueprint) return false;
      const rc = r.user_profile?.role_category;
      if (!NON_TECH_ROLES.has(rc)) return true;
      return flattenNodes(r.blueprint).every(node => {
        const atoms = [...(node.panel?.expansion?.left_items ?? []), ...(node.panel?.expansion?.right_items ?? [])];
        return atoms.every(atom =>
          (atom.tools ?? []).every(t => !NON_TECH_TOOL_BLOCKLIST.includes(t))
        );
      });
    }),
  };

  const allGatesPassed = Object.values(completionGate).every(Boolean);

  const report = {
    phase: 'phase3-blueprint',
    generated_at: new Date().toISOString(),
    production_modules: [
      'web/lib/roadmap/blueprint.mjs',
      'web/lib/roadmap/panel-blueprint.mjs',
      'web/lib/roadmap/aaa-phase-map.mjs',
    ],
    completion_gate: completionGate,
    all_gates_passed: allGatesPassed,
    summary: results.map(r => ({
      id: r.id,
      valid: r.valid,
      failures: r.failures,
      ...r.summary,
    })),
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log('\n[PHASE 3] Deterministic Roadmap Blueprint');
  console.log(`  valid fixtures: ${passed}/${CASES.length}`);
  for (const r of results) {
    const status = r.valid ? '[OK]' : '[FAIL]';
    const s = r.summary;
    if (s) {
      console.log(`  ${status} ${r.id} (${s.role_category}/${s.ai_familiarity}) — ${s.total_nodes} nodes [${Object.entries(s.aaa_counts).map(([k,v]) => `${k[0].toUpperCase()}:${v}`).join(' ')}] ${s.total_atoms} atoms ${s.terminology_terms} terms frame:${s.journey_frame}`);
    } else {
      console.log(`  ${status} ${r.id}`);
    }
    for (const f of r.failures) console.log(`    [ERROR] ${f}`);
  }
  console.log('\n  completion gate:');
  for (const [key, val] of Object.entries(completionGate)) {
    console.log(`    ${val ? '[OK]' : '[FAIL]'} ${key}`);
  }
  console.log(`\n  report saved: ${reportPath}`);

  if (!allGatesPassed) {
    console.error('\n[PHASE 3] FAILED completion gate');
    process.exit(1);
  }

  console.log('\n[PHASE 3] ALL GATES PASSED');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
