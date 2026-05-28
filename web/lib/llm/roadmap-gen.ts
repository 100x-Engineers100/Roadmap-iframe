import { buildRoadmapBlueprint } from '@/lib/roadmap/blueprint.mjs';
import { validateRoadmap } from '@/lib/roadmap/validate.mjs';
import { buildTerminologyPrimerFromContent } from '@/lib/roadmap/canonical-ai-terms.mjs';
import { enrichBlueprintCopy, isGenerationFailed } from './panel-copy';
import type {
  GapInferenceResult,
  PanelAtom,
  ProjectCheckpoint,
  Roadmap,
  RoadmapBlueprint,
  RoadmapBlueprintNode,
  RoadmapBlueprintPhase,
  RoadmapNode,
  RoadmapStep,
  TerminologyTerm,
  UserWorkProfile,
} from '@/types';

export class RoadmapGenerationError extends Error {
  readonly code = 'generation_failed';

  constructor(message: string) {
    super(message);
    this.name = 'RoadmapGenerationError';
  }
}

function allPanelAtoms(node: RoadmapBlueprintNode) {
  return [
    ...node.panel.expansion.left_items,
    ...node.panel.expansion.right_items,
  ].sort((a, b) => a.order - b.order);
}

function toRoadmapNode(node: RoadmapBlueprintNode): RoadmapNode {
  const atoms = allPanelAtoms(node);
  const mappings = node.panel.analogy?.concept_mappings ?? [];

  return {
    id: node.id,
    node_kind: node.node_kind,
    title: node.title,
    name_plain: node.title,
    one_line_desc: node.one_line_desc,
    skill_ids: node.skill_ids,
    depth: node.depth,
    depth_level: node.depth_level,
    depth_reason: node.depth_reason,
    prerequisite_node_ids: node.prerequisite_node_ids,
    unlocks_node_ids: node.unlocks_node_ids,
    terminology_terms: node.terminology_terms,
    panel: node.panel,
    what_covers: node.panel.checkpoint.scenario || node.one_line_desc,
    what_do_after: node.panel.checkpoint.artifact_to_create,
    subnodes: atoms.map(atom => ({
      id: atom.id,
      title: atom.label,
      description: atom.explanation,
      outcome: atom.output,
      tools: atom.tools,
      time_est: atom.time_est,
    })),
    concepts_left: node.panel.expansion.left_items.map(atom => atom.label),
    concepts_right: node.panel.expansion.right_items.map(atom => atom.label),
    analogy: {
      base: node.panel.analogy ? `${node.panel.analogy.lens_name}: ${mappings[0]?.analogy_part ?? node.title}` : node.title,
      role_skin: mappings[0]?.plain_meaning ?? node.one_line_desc,
      bridge_line: node.panel.analogy?.takeaway ?? '',
    },
  };
}

function checkpointForPhase(
  phaseNodes: RoadmapBlueprintNode[],
  projects: ProjectCheckpoint[],
  defaultTitle: string
): RoadmapStep['checkpoint'] {
  const phaseNodeIds = phaseNodes.map(node => node.id);
  const project = projects.find(candidate =>
    candidate.after_node_ids.length > 0
    && candidate.after_node_ids.every(id => phaseNodeIds.includes(id))
  ) ?? projects.find(candidate => candidate.type === 'final_project');

  return {
    title: project?.title ?? defaultTitle,
    goal: project?.goal ?? `Prove the capabilities in ${defaultTitle}.`,
    concepts: project?.concepts_checked ?? phaseNodes.map(node => node.title),
    problem_statement: project?.description ?? phaseNodes.map(node => node.one_line_desc).join(' '),
    done_criteria: project?.done_when?.join(' ') ?? 'You can explain and demonstrate the phase output.',
    time_est: project?.time_est ?? '2-3 hrs',
  };
}

function blueprintToRoadmap(blueprint: RoadmapBlueprint): Roadmap {
  const [phase1, phase2, phase3] = blueprint.phases;

  const stepFromPhase = (phase: typeof blueprint.phases[number], index: number): RoadmapStep => ({
    label: phase.label,
    theme: phase.theme,
    nodes: phase.nodes.map(toRoadmapNode),
    checkpoint: checkpointForPhase(
      phase.nodes,
      blueprint.project_checkpoints,
      `Phase ${index + 1} checkpoint`
    ),
  });

  return {
    step1: stepFromPhase(phase1, 0),
    step2: stepFromPhase(phase2, 1),
    step3: stepFromPhase(phase3, 2),
    terminology_primer: blueprint.terminology_primer,
    project_checkpoints: blueprint.project_checkpoints,
    glossary: blueprint.terminology_primer.terms.map(term => ({
      term: term.term,
      definition: term.plain_definition,
      source_node_id: term.appears_in_node_ids[0],
      group: 'terminology_primer',
    })),
  };
}

export async function generateRoadmap(
  userProfile: UserWorkProfile,
  gapInferenceResult?: GapInferenceResult
): Promise<Roadmap> {
  const profile = userProfile;

  const blueprint = buildRoadmapBlueprint(profile, gapInferenceResult ?? null) as RoadmapBlueprint;
  const enriched = await enrichBlueprintCopy(blueprint);

  if (isGenerationFailed(enriched)) {
    throw new RoadmapGenerationError(enriched.reason);
  }

  const enrichedNodes = enriched.phases.flatMap((p: RoadmapBlueprintPhase) => p.nodes);
  const nodeIds = enrichedNodes.map((n: RoadmapBlueprintNode) => n.id);
  const nodeAtomTexts = enrichedNodes.map((n: RoadmapBlueprintNode) => {
    const atoms = [
      ...(n.panel?.expansion?.left_items ?? []),
      ...(n.panel?.expansion?.right_items ?? []),
    ];
    return [
      n.one_line_desc ?? '',
      atoms.map((a: PanelAtom) => [
        a.explanation ?? '',
        a.learner_action ?? '',
        a.label ?? '',
        a.output ?? '',
        a.depth_reason ?? '',
        Array.isArray(a.tools) ? a.tools.join(' ') : (a.tools ?? ''),
      ].join(' ')).join(' '),
    ].join(' ');
  });
  const enrichedTerms = buildTerminologyPrimerFromContent(
    profile.role_category,
    nodeAtomTexts,
    nodeIds
  ) as TerminologyTerm[];
  enriched.terminology_primer = { terms: enrichedTerms };

  const roadmap = blueprintToRoadmap(enriched);
  const validationAudience =
    profile.role_archetype === 'founder' ? 'founder_pm' : profile.role_category;
  const validation = validateRoadmap(roadmap, { audience: validationAudience });

  if ((validation.warnings?.length ?? 0) > 0) {
    console.warn(`validateRoadmap warnings [${validationAudience}]: ${validation.warnings.map(i => i.code).join(', ')}`);
  }

  if (!validation.valid) {
    throw new RoadmapGenerationError(
      `Validation failed: ${validation.blocking.slice(0, 3).map(issue => issue.code).join(', ')}`
    );
  }

  return roadmap;
}
