import { promises as fs } from 'fs';
import path from 'path';
import { RoadmapView } from '@/components/screens/RoadmapView';
import type {
  ProjectCheckpoint,
  Roadmap,
  RoadmapBlueprint,
  RoadmapBlueprintNode,
  RoadmapNode,
  RoadmapStep,
  RoleCategory,
} from '@/types';

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
    subnodes: atoms.map((atom) => ({
      id: atom.id,
      title: atom.label,
      description: atom.explanation,
      outcome: atom.output,
      tools: atom.tools,
      time_est: atom.time_est,
    })),
    concepts_left: node.panel.expansion.left_items.map((atom) => atom.label),
    concepts_right: node.panel.expansion.right_items.map((atom) => atom.label),
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
  const phaseNodeIds = phaseNodes.map((node) => node.id);
  const project = projects.find((candidate) =>
    candidate.after_node_ids.length > 0
    && candidate.after_node_ids.every((id) => phaseNodeIds.includes(id))
  ) ?? projects.find((candidate) => candidate.type === 'final_project');

  return {
    title: project?.title ?? defaultTitle,
    goal: project?.goal ?? `Prove the capabilities in ${defaultTitle}.`,
    concepts: project?.concepts_checked ?? phaseNodes.map((node) => node.title),
    problem_statement: project?.description ?? phaseNodes.map((node) => node.one_line_desc).join(' '),
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
    checkpoint: checkpointForPhase(phase.nodes, blueprint.project_checkpoints, `Phase ${index + 1} checkpoint`),
  });

  return {
    step1: stepFromPhase(phase1, 0),
    step2: stepFromPhase(phase2, 1),
    step3: stepFromPhase(phase3, 2),
    journey_analogy: blueprint.journey_analogy,
    terminology_primer: blueprint.terminology_primer,
    project_checkpoints: blueprint.project_checkpoints,
    glossary: blueprint.terminology_primer.terms.map((term) => ({
      term: term.term,
      definition: term.plain_definition,
      source_node_id: term.appears_in_node_ids[0],
      group: 'terminology_primer',
    })),
  };
}

// pipeline-e2e fixtures use {role}-{familiarity} naming with key `enriched`
const E2E_FIXTURE: Record<string, string> = {
  marketer:   'marketer-none',
  engineer:   'engineer-advanced',
  designer:   'designer-basic',
  sales:      'sales-none',
  student:    'student-none',
  founder_pm: 'founder-pm',
  pm:         'founder-pm',
};

async function loadPreviewRoadmap(role: string) {
  const fixtureSlug = E2E_FIXTURE[role] ?? E2E_FIXTURE.marketer;
  const filePath = path.resolve(process.cwd(), `../test output/pipeline-e2e/${fixtureSlug}-enriched.json`);
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as { enriched: RoadmapBlueprint };
  return blueprintToRoadmap(parsed.enriched);
}

export default async function DevRoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = params.role ?? 'marketer';
  const roadmap = await loadPreviewRoadmap(role);
  const roleCategory: RoleCategory = role === 'founder_pm' ? 'pm' : (role as RoleCategory);
  const socTitle = roleCategory === 'engineer' ? 'Software Developers' : 'Marketing Managers';
  return (
    <RoadmapView
      roadmap={roadmap}
      roleCategory={roleCategory}
      socTitle={socTitle}
    />
  );
}
