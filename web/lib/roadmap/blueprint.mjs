/**
 * Phase 3 - Deterministic Roadmap Blueprint.
 * buildRoadmapBlueprint(userProfile, gapInferenceResult?) -> RoadmapBlueprint.
 * No LLM call. All structure is deterministic.
 * Uses gap-inference nodes if provided; falls back to sliceByFamiliarity().
 */
import { sliceByFamiliarity } from './aaa-phase-map.mjs';
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
function adaptGapNode(gapNode, roleCategory, roleArchetype) {
  const allowedTools = gapNode.tools?.length > 0
    ? gapNode.tools
    : (ROLE_TOOLS[roleCategory] ?? ROLE_TOOLS.student);
  return {
    id: `gap-${roleCategory}-${gapNode.title.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`,
    role_category: roleCategory,
    role_archetype: roleArchetype ?? roleCategory,
    capability: gapNode.title,
    skill_ids: gapNode.skill_ids,
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
  const midIdx = Math.floor(n / 2);
  const mini1After = nodes.slice(0, 2).map(nd => nd.id);
  const mini2After = nodes.slice(1, midIdx + 1).map(nd => nd.id);
  const finalAfter = nodes.map(nd => nd.id);

  const tools1 = nodes[0]?.panel?.checkpoint?.tools?.slice(0, 2) ?? ['Claude'];
  const tools2 = nodes[Math.min(2, n - 1)]?.panel?.checkpoint?.tools?.slice(0, 2) ?? ['n8n', 'Claude'];
  const toolsFinal = [...new Set(nodes.flatMap(nd => nd.panel?.checkpoint?.tools ?? []))].slice(0, 4);

  return [
    {
      id: `mini-1-${roleCategory}`,
      type: 'mini_project',
      after_node_ids: mini1After,
      title: 'Assisted Phase Sprint',
      goal: 'Prove you can apply the first two capabilities to a real task without tutorial guidance.',
      description: `Use the skills from the first two nodes to complete one real work output. Not a tutorial exercise — solve an actual problem from your work context.`,
      concepts_checked: nodes.slice(0, 2).map(nd => nd.title),
      artifact_to_build: 'A real work output that uses at least one tool from each of the first two nodes.',
      steps: [
        `Pick one real task from your work that the first two nodes address.`,
        `Apply at least one skill from node 1 and one from node 2 to complete the task.`,
        `Document the tools used and time saved vs your previous manual approach.`,
      ],
      done_when: [
        'You produced a real work artifact without following a tutorial step-by-step.',
        'The artifact uses tools from both of the first two nodes.',
      ],
      tools: tools1,
      time_est: '2-3 hrs',
    },
    {
      id: `mini-2-${roleCategory}`,
      type: 'mini_project',
      after_node_ids: mini2After,
      title: 'Accelerated Phase Sprint',
      goal: 'Prove you can combine mid-roadmap capabilities into one workflow that runs with minimal manual steps.',
      description: 'Build a lightweight workflow that chains accelerated-phase skills. The workflow should run with one trigger and produce a useful output.',
      concepts_checked: nodes.slice(1, midIdx + 1).map(nd => nd.title),
      artifact_to_build: 'A working workflow combining accelerated-phase skills that runs with one manual trigger.',
      steps: [
        'Map the data flow between the accelerated-phase skills.',
        'Build the workflow in your chosen tool (n8n or equivalent).',
        'Test with 3 real inputs and document the outputs.',
      ],
      done_when: [
        'The workflow runs end-to-end with one trigger and produces a useful output.',
        'You can explain the connection between the chained capabilities to a peer.',
      ],
      tools: tools2,
      time_est: '2-3 hrs',
    },
    {
      id: `final-${roleCategory}`,
      type: 'final_project',
      after_node_ids: finalAfter,
      title: 'AI-Native Portfolio Project',
      goal: 'Prove end-to-end mastery by building a real-world project combining capabilities from all three AAA phases.',
      description: `Design and build a complete AI-native workflow that addresses a real problem from your work context. Portfolio-ready.`,
      concepts_checked: nodes.map(nd => nd.title),
      artifact_to_build: `A complete, working AI-native project combining at least ${Math.min(4, n)} of the ${n} node capabilities.`,
      steps: [
        'Define the real problem from your work that this project will solve.',
        'Map which node capabilities contribute to the solution.',
        'Build the solution step-by-step, one capability at a time.',
        'Test with real inputs from your work context.',
        'Document what each AI component does and what it replaced.',
      ],
      done_when: [
        'The project solves a real problem from your work context, not a tutorial scenario.',
        `At least ${Math.min(4, n)} capabilities from your roadmap are visible in the project.`,
        'You can demo the project to a peer and explain every component.',
      ],
      tools: toolsFinal.length > 0 ? toolsFinal : ['Claude', 'n8n'],
      time_est: '4-6 hrs',
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

  if (hasValidInference) {
    gapInferenceNodes = gapInferenceResult.nodes;
    journeyAnalogy = gapInferenceResult.journey_analogy;
    gapNodes = gapInferenceResult.nodes.map(gn => ({
      aaa_phase: gn.aaa_phase,
      gapLike: adaptGapNode(gn, role_category, role_archetype),
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
    }));
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

  const phases = phaseOrder
    .filter(p => grouped[p].length > 0)
    .map((p, i) => ({
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
