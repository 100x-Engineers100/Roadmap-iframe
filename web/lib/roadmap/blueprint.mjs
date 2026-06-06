/**
 * Phase 3 - Deterministic Roadmap Blueprint.
 * buildRoadmapBlueprint(userProfile, gapInferenceResult?) -> RoadmapBlueprint.
 * No LLM call. All structure is deterministic.
 * Uses gap-inference nodes if provided; falls back to sliceByFamiliarity().
 */
import { sliceByFamiliarity, AAA_PHASE_MAP } from './aaa-phase-map.mjs';
import { buildNodePanel } from './panel-blueprint.mjs';
import {
  buildTerminologyPrimerFromContent,
  ROLE_TERMS_FALLBACK,
  CANONICAL_AI_TERMS,
} from './canonical-ai-terms.mjs';

// AAA phase → RoadmapBlueprintPhase label
const AAA_PHASE_LABELS = {
  assisted:    'Assisted — AI helps you, you trigger every time (Days 1–30)',
  accelerated: 'Accelerated — you set it up, you decide when it runs (Days 31–60)',
  autonomous:  'Autonomous — a system triggers it, you review the output (Days 61–90)',
};

// AAA phase → depth fields
const AAA_DEPTH = {
  assisted:    { depth: 'foundational', depth_level: 'scan' },
  accelerated: { depth: 'intermediate', depth_level: 'practice' },
  autonomous:  { depth: 'advanced',     depth_level: 'build' },
};

// Fallback journey analogies per role — used when gapInferenceResult is absent
const FALLBACK_ANALOGIES = {
  marketer: {
    frame: 'Film Production',
    phase_1_meaning: 'Pre-production: scripting, casting, and planning before a single frame rolls',
    phase_2_meaning: 'Principal photography: executing the production with speed and precision',
    phase_3_meaning: 'Post-production distribution: the release schedule runs itself',
  },
  designer: {
    frame: 'Architectural Drafting',
    phase_1_meaning: 'Concept sketches: rough ideas refined into clear design intent',
    phase_2_meaning: 'Technical drawings: converting intent into buildable, precise deliverables',
    phase_3_meaning: 'Construction supervision: the system builds from your blueprints autonomously',
  },
  sales: {
    frame: 'Expedition Planning',
    phase_1_meaning: 'Reconnaissance: mapping the terrain and identifying the route before you move',
    phase_2_meaning: 'Base camp operations: executing the ascent with systematic checkpoints',
    phase_3_meaning: 'Autonomous routing: the expedition finds and adapts the route without you',
  },
  pm: {
    frame: 'Product Launch Runway',
    phase_1_meaning: 'Taxiing: gathering speed through discovery, briefs, and sprint setup',
    phase_2_meaning: 'Acceleration: the product sprint gains momentum toward ship',
    phase_3_meaning: 'Takeoff: every go/no-go gate runs without you needing to trigger it',
  },
  engineer: {
    frame: 'Infrastructure Construction',
    phase_1_meaning: 'Foundation: laying the structural base that everything else builds on',
    phase_2_meaning: 'Framework and systems: connecting the structure to working infrastructure',
    phase_3_meaning: 'Commissioning: the infrastructure self-monitors and self-optimizes',
  },
  student: {
    frame: 'Apprenticeship Journey',
    phase_1_meaning: 'Observe and assist: learning by watching and doing under guidance',
    phase_2_meaning: 'Independent practice: executing with increasing autonomy and feedback',
    phase_3_meaning: 'Demonstrate mastery: completing complex work without supervision',
  },
};

// Non-tech roles' allowed tools (used for fallback gap-like objects)
const ROLE_TOOLS = {
  marketer:  ['Claude', 'Midjourney', 'HeyGen', 'n8n', 'ElevenLabs', 'Suno'],
  designer:  ['Midjourney', 'FLUX', 'Claude', 'Kling', 'FreePik Spaces', 'Suno'],
  sales:     ['Claude', 'n8n', 'HubSpot', 'Apollo', 'ChatGPT'],
  pm:        ['Claude', 'Lovable', 'Cursor', 'n8n', 'ChatGPT'],
  engineer:  ['FastAPI', 'LangChain', 'LlamaIndex', 'Pinecone', 'n8n', 'CrewAI', 'LangSmith'],
  student:   ['Claude', 'LlamaIndex', 'n8n', 'FastAPI', 'CrewAI'],
};

function buildNodeId(roleCategory, idx) {
  return `node-${roleCategory}-${idx + 1}`;
}

/**
 * Convert a GapInferenceNode → gap-like object that buildNodePanel accepts.
 */
function adaptGapNode(gapNode, roleCategory, roleArchetype, usedSkillIds = new Set()) {
  let skill_ids = gapNode.skill_ids ?? [];
  // When gap inference assigns fewer than 3 skill_ids, merge the nearest AAA_PHASE_MAP
  // cluster — but only if that cluster has skills not already consumed by a prior node.
  // Without this guard, all single-skill nodes in the same cluster collapse to identical
  // skill_id sets, producing duplicate node content.
  if (skill_ids.length < 3) {
    const roleMap = AAA_PHASE_MAP[roleCategory] ?? [];
    const match = roleMap.find(entry =>
      entry.skill_ids.some(s => skill_ids.includes(s)) &&
      entry.skill_ids.some(s => !usedSkillIds.has(s))
    );
    if (match && match.skill_ids.length > skill_ids.length) {
      skill_ids = [...new Set([...skill_ids, ...match.skill_ids])];
    }
  }
  skill_ids.forEach(s => usedSkillIds.add(s));
  const allowedTools = gapNode.tools?.length > 0
    ? gapNode.tools
    : (ROLE_TOOLS[roleCategory] ?? ROLE_TOOLS.student);
  return {
    id: `gap-${roleCategory}-${gapNode.title.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`,
    role_category: roleCategory,
    role_archetype: roleArchetype ?? roleCategory,
    capability: gapNode.title,
    skill_ids,
    why_selected: gapNode.why_for_this_person ?? '',
    allowed_tools: allowedTools,
    forbidden_tools: [],
    task_patterns: [],
    source_task_ids: [],
    confidence: 'high',
  };
}

/**
 * Convert an AAA_PHASE_MAP entry → gap-like object that buildNodePanel accepts.
 */
function buildFallbackGapNode(phaseNode, roleCategory, roleArchetype) {
  const allowedTools = ROLE_TOOLS[roleCategory] ?? ROLE_TOOLS.student;
  return {
    id: `gap-${roleCategory}-${phaseNode.phase}-${phaseNode.skill_ids.join('')}`,
    role_category: roleCategory,
    role_archetype: roleArchetype ?? roleCategory,
    capability: phaseNode.title,
    skill_ids: phaseNode.skill_ids,
    why_selected: `This capability moves ${roleCategory}s from ${phaseNode.phase} AI use to real workflow impact.`,
    allowed_tools: allowedTools,
    forbidden_tools: [],
    task_patterns: [],
    source_task_ids: [],
    confidence: 'medium',
  };
}

function buildNodeFromGap(gapLike, idx, allIds, aaa_phase) {
  const nodeId = allIds[idx];
  const prevId = idx > 0 ? allIds[idx - 1] : null;
  const nextId = idx < allIds.length - 1 ? allIds[idx + 1] : null;
  const depthFields = AAA_DEPTH[aaa_phase] ?? AAA_DEPTH.accelerated;
  const phaseLabel = aaa_phase.charAt(0).toUpperCase() + aaa_phase.slice(1);

  return {
    id: nodeId,
    aaa_phase,
    node_kind: 'concept',
    title: gapLike.capability,
    one_line_desc: gapLike.capability.split('(')[0].trim(),
    skill_ids: gapLike.skill_ids,
    depth: depthFields.depth,
    depth_level: depthFields.depth_level,
    depth_reason: `${phaseLabel} phase: ${gapLike.why_selected || 'develop this capability through direct application.'}`,
    prerequisite_node_ids: prevId ? [prevId] : [],
    unlocks_node_ids: nextId ? [nextId] : [],
    panel: buildNodePanel(gapLike, nodeId, aaa_phase),
  };
}

function buildProjectCheckpoints(nodes, roleCategory) {
  const n = nodes.length;
  // Mini1 after index 1 (≤6 nodes) or index 2 (>6 nodes)
  const mini1Idx = n <= 6 ? 1 : 2;
  // Mini2 always 2 nodes after Mini1, capped so Capstone has room
  const mini2Idx = Math.min(mini1Idx + 2, n - 2);

  const getTools = (upToIdx) =>
    [...new Set(nodes.slice(0, upToIdx + 1).flatMap(nd => nd.panel?.checkpoint?.tools ?? []))].slice(0, 4);

  const emptyStub = () => ({
    title: '',
    objective: '',
    scenario: '',
    tasks: [],
    what_youll_learn: [],
    core_components: [],
    success_criteria: [],
    deliverables: [],
  });

  return [
    {
      id: `mini-1-${roleCategory}`,
      type: 'mini_project',
      after_node_ids: nodes.slice(0, mini1Idx + 1).map(nd => nd.id),
      tools: getTools(mini1Idx),
      concepts_covered: nodes.slice(0, mini1Idx + 1).map(nd => nd.title),
      ...emptyStub(),
    },
    {
      id: `mini-2-${roleCategory}`,
      type: 'mini_project',
      after_node_ids: nodes.slice(0, mini2Idx + 1).map(nd => nd.id),
      tools: getTools(mini2Idx),
      concepts_covered: nodes.slice(mini1Idx + 1, mini2Idx + 1).map(nd => nd.title),
      ...emptyStub(),
    },
    {
      id: `capstone-${roleCategory}`,
      type: 'final_project',
      after_node_ids: nodes.map(nd => nd.id),
      tools: getTools(n - 1),
      concepts_covered: nodes.map(nd => nd.title),
      ...emptyStub(),
      bonus_challenges: [],
      reflection_questions: [],
    },
  ];
}

function extractAtomText(node) {
  const atoms = [
    ...(node.panel?.expansion?.left_items ?? []),
    ...(node.panel?.expansion?.right_items ?? []),
  ];
  return atoms.map(a => `${a.explanation ?? ''} ${a.learner_action ?? ''}`).join(' ');
}

function buildTerminologyPrimer(roleCategory, nodes) {
  const nodeIds = nodes.map(nd => nd.id);
  const nodeAtomTexts = nodes.map(nd => extractAtomText(nd));
  const terms = buildTerminologyPrimerFromContent(roleCategory, nodeAtomTexts, nodeIds);
  return { terms };
}

function attachTerminologyTags(nodes, roleCategory) {
  const termNames = ROLE_TERMS_FALLBACK[roleCategory] ?? ROLE_TERMS_FALLBACK.student;
  return nodes.map(node => ({ ...node, terminology_terms: termNames }));
}

/**
 * Build a full deterministic RoadmapBlueprint.
 * @param {object} userProfile - UserWorkProfile
 * @param {object|null} gapInferenceResult - GapInferenceResult from /api/gap-inference (optional)
 *   Phase 4 TODO: wire gapInferenceResult through /api/lead so this arg is always populated.
 * @returns {object} RoadmapBlueprint
 */
export function buildRoadmapBlueprint(userProfile, gapInferenceResult) {
  const { role_category, role_archetype, ai_familiarity } = userProfile;

  // ── Source gap nodes ────────────────────────────────────────────────────────
  // Use gap-inference result if provided (≥5 nodes), else fall back to AAA_PHASE_MAP slice.
  let gapNodes; // Array<{ aaa_phase, gapLike }>
  let journeyAnalogy;
  let gapInferenceNodes; // raw GapInferenceNode[] for blueprint.gap_inference_nodes field

  const hasValidInference = gapInferenceResult?.nodes?.length >= 5;

  const usedSkillIds = new Set();

  if (hasValidInference) {
    gapInferenceNodes = gapInferenceResult.nodes;
    journeyAnalogy = gapInferenceResult.journey_analogy;
    gapNodes = gapInferenceResult.nodes.map(gn => ({
      aaa_phase: gn.aaa_phase,
      gapLike: adaptGapNode(gn, role_category, role_archetype, usedSkillIds),
    }));
  } else {
    const phaseNodes = sliceByFamiliarity(role_category, ai_familiarity ?? 'none');
    gapInferenceNodes = phaseNodes.map(pn => ({
      title: pn.title,
      aaa_phase: pn.phase,
      skill_ids: pn.skill_ids,
      why_for_this_person: `Core ${pn.phase} capability for ${role_category}s building AI fluency.`,
      tools: ROLE_TOOLS[role_category] ?? ROLE_TOOLS.student,
    }));
    journeyAnalogy = FALLBACK_ANALOGIES[role_category] ?? FALLBACK_ANALOGIES.student;
    gapNodes = phaseNodes.map(pn => ({
      aaa_phase: pn.phase,
      gapLike: buildFallbackGapNode(pn, role_category, role_archetype),
      // Fallback nodes come from AAA_PHASE_MAP directly — already distinct by construction.
      // Register their skill_ids so any later adaptGapNode calls see them as used.
    }));
    gapNodes.forEach(({ gapLike }) => gapLike.skill_ids.forEach(s => usedSkillIds.add(s)));
  }

  // ── Build nodes ─────────────────────────────────────────────────────────────
  const allIds = gapNodes.map((_, i) => buildNodeId(role_category, i));

  const rawNodes = gapNodes.map(({ aaa_phase, gapLike }, i) =>
    buildNodeFromGap(gapLike, i, allIds, aaa_phase)
  );

  const allNodes = attachTerminologyTags(rawNodes, role_category);

  // ── Group into 3 AAA phases ─────────────────────────────────────────────────
  const phaseOrder = ['assisted', 'accelerated', 'autonomous'];
  const grouped = { assisted: [], accelerated: [], autonomous: [] };
  for (const node of allNodes) {
    const key = node.aaa_phase ?? 'accelerated';
    (grouped[key] ?? grouped.accelerated).push(node);
  }

  // Guarantee ≥1 node per phase — gap inference LLM sometimes assigns all nodes
  // to only 2 phases, causing blueprintToRoadmap to throw "expected 3 phases".
  for (let i = 1; i < phaseOrder.length; i++) {
    if (grouped[phaseOrder[i]].length === 0) {
      for (let j = i - 1; j >= 0; j--) {
        if (grouped[phaseOrder[j]].length > 1) {
          grouped[phaseOrder[i]].unshift(grouped[phaseOrder[j]].pop());
          break;
        }
      }
    }
  }

  const phases = phaseOrder.map((p, i) => ({
    id: `phase-${i + 1}-${role_category}`,
    label: AAA_PHASE_LABELS[p],
    theme: p.charAt(0).toUpperCase() + p.slice(1),
    nodes: grouped[p],
  }));

  return {
    user_profile: userProfile,
    gap_inference_nodes: gapInferenceNodes,
    journey_analogy: journeyAnalogy,
    terminology_primer: buildTerminologyPrimer(role_category, allNodes),
    phases,
    project_checkpoints: buildProjectCheckpoints(allNodes, role_category),
  };
}
