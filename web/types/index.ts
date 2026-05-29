export type RoleCategory = 'pm' | 'designer' | 'marketer' | 'sales' | 'engineer' | 'student';
export type ScoreBand = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Difficulty = 'foundational' | 'intermediate' | 'advanced';
export type TaskWeight = 'low' | 'medium' | 'high';
export type AiFamiliarity = 'none' | 'basic' | 'intermediate' | 'advanced';
export type WorkContext = 'startup' | 'MNC' | 'agency' | 'freelance';
export type RoadmapNodeKind = 'concept' | 'project';
export type RoleArchetype =
  | 'product_manager'
  | 'founder'
  | 'designer'
  | 'marketer'
  | 'sales'
  | 'engineer'
  | 'student';
export type DepthLevel = 'scan' | 'practice' | 'build' | 'operate';
export type PanelAtomType = 'concept' | 'tool' | 'step' | 'risk' | 'output';
export type ProjectCheckpointType = 'mini_project' | 'final_project';

export interface SOCMatch {
  soc_code: string;
  title: string;
  confidence: number;
}

export interface OnetTask {
  id: string;
  description: string;
  importance: number;
  weight?: TaskWeight;
}

export interface CurriculumSkill {
  id: string;
  module: 'm1' | 'm2' | 'm3';
  name_display: string;
  can_do: string;
  tools: string[];
  roles: RoleCategory[];
  roles_adjacent: RoleCategory[];
  difficulty: Difficulty;
  seq_order: number;
}

export interface SkillCluster {
  id: string;
  name: string;
  can_do: string;
  skill_ids: string[];
  module: 'm1' | 'm2' | 'm3';
  roles: RoleCategory[];
  checkpoint_hint: string;
}

export interface SkillGapResult {
  green: SkillCluster[];
  red: SkillCluster[];
}

export interface WeightedWorkTask {
  id: string;
  description: string;
  weight: TaskWeight;
  importance?: number;
  source?: 'onet' | 'manual' | 'inferred';
}

export interface UserWorkProfile {
  raw_role_text: string;
  soc_title: string | null;
  soc_code: string | null;
  role_category: RoleCategory;
  role_archetype: RoleArchetype;
  industry_hints: string[];
  selected_tasks: WeightedWorkTask[];
  high_weight_tasks: WeightedWorkTask[];
  medium_weight_tasks: WeightedWorkTask[];
  low_weight_tasks: WeightedWorkTask[];
  ai_familiarity: AiFamiliarity;
  work_context: WorkContext;
  confirmed_skill_ids: string[];
  confirmed_cluster_ids: string[];
}


export interface CapabilityGap {
  id: string;
  role_category: RoleCategory;
  role_archetype: RoleArchetype;
  task_patterns: string[];
  capability: string;
  why_selected: string;
  skill_ids: string[];
  allowed_tools: string[];
  forbidden_tools: string[];
  source_task_ids: string[];
  confidence: 'low' | 'medium' | 'high';
}

export type AAAPhase = 'assisted' | 'accelerated' | 'autonomous';

export interface GapInferenceNode {
  title: string;
  aaa_phase: AAAPhase;
  skill_ids: string[];
  why_for_this_person: string;
  tools: string[];
}

export interface JourneyAnalogy {
  frame: string;
  phase_1_meaning: string;
  phase_2_meaning: string;
  phase_3_meaning: string;
}

export interface GapInferenceResult {
  nodes: GapInferenceNode[];
  journey_analogy: JourneyAnalogy;
  fallback_used: boolean;
}

export interface PanelAtom {
  id: string;
  order: number;
  label: string;
  type: PanelAtomType;
  depth_level: DepthLevel;
  depth_reason: string;
  explanation: string;
  learner_action: string;
  output: string;
  tools: string[];
}

export interface PanelExpansion {
  center_label: string;
  left_title: 'Concepts';
  right_title: 'Applied';
  left_items: PanelAtom[];
  right_items: PanelAtom[];
}

export interface PanelAnalogyMapping {
  concept: string;
  analogy_part: string;
  plain_meaning: string;
  mistake_to_avoid: string;
}

export interface PanelAnalogy {
  lens_name: string;
  lens_domain: string;
  concept_mappings: PanelAnalogyMapping[];
  takeaway: string;
}

export interface NodeCheckpoint {
  title: string;
  scenario: string;
  artifact_to_create: string;
  steps: string[];
  done_when: string[];
  tools: string[];
  confidence_check: string;
}

export interface NodePanelPayload {
  expansion: PanelExpansion;
  analogy?: PanelAnalogy; // removed from per-node in Phase 3 — now global journey_analogy
  checkpoint: NodeCheckpoint;
}

export interface TerminologyTerm {
  term: string;
  appears_in_node_ids: string[];
  plain_definition: string;
  role_example: string;
  analogy_hook: string;
  why_it_matters: string;
}

export interface TerminologyPrimer {
  terms: TerminologyTerm[];
}

export interface ProjectCheckpoint {
  id: string;
  type: ProjectCheckpointType;
  after_node_ids: string[];
  // deterministic fields
  tools: string[];
  concepts_covered: string[];
  // LLM-filled fields
  title: string;
  objective: string;
  scenario: string;
  tasks: string[];
  what_youll_learn: string[];
  core_components: string[];
  success_criteria: string[];
  deliverables: string[];
  // capstone only
  bonus_challenges?: string[];
  reflection_questions?: string[];
}

export interface RoadmapAnalogyLens {
  lens_name: string;
  lens_domain: string;
  why_this_lens: string;
}

export interface RoadmapSubnode {
  id: string;
  title: string;
  description: string;
  outcome: string;
  tools?: string[];
}

export interface RoadmapNode {
  id: string;
  node_kind: RoadmapNodeKind;
  title?: string;
  name_plain: string;
  one_line_desc: string;
  skill_ids: string[];
  depth: Difficulty;
  depth_level?: DepthLevel;
  depth_reason?: string;
  prerequisite_node_ids?: string[];
  unlocks_node_ids?: string[];
  terminology_terms?: string[];
  panel?: NodePanelPayload;
  /** @deprecated Replaced by panel.checkpoint and panel atom explanations. */
  what_covers: string;
  /** @deprecated Replaced by panel.checkpoint and panel atom outputs. */
  what_do_after: string;
  /** @deprecated Replaced by panel.expansion.left_items/right_items. */
  subnodes: RoadmapSubnode[];
  /** @deprecated Replaced by panel.expansion.left_items. */
  concepts_left: string[];
  /** @deprecated Replaced by panel.expansion.right_items. */
  concepts_right: string[];
  /** @deprecated Replaced by panel.analogy with roadmap-level analogy lens. */
  analogy: { base: string; role_skin: string };
}

export interface RoadmapBlueprintNode {
  id: string;
  aaa_phase?: AAAPhase; // set in Phase 3 rebuild for phase grouping
  node_kind: RoadmapNodeKind;
  title: string;
  one_line_desc: string;
  skill_ids: string[];
  depth: Difficulty;
  depth_level: DepthLevel;
  depth_reason: string;
  prerequisite_node_ids: string[];
  unlocks_node_ids: string[];
  terminology_terms?: string[];
  panel: NodePanelPayload;
}

export interface RoadmapBlueprintPhase {
  id: string;
  label: string;
  theme: string;
  nodes: RoadmapBlueprintNode[];
}

export interface RoadmapBlueprint {
  user_profile: UserWorkProfile;
  gap_inference_nodes: GapInferenceNode[]; // was capability_gaps: CapabilityGap[]
  journey_analogy: JourneyAnalogy;          // was analogy_lens: RoadmapAnalogyLens
  terminology_primer: TerminologyPrimer;
  phases: RoadmapBlueprintPhase[];
  project_checkpoints: ProjectCheckpoint[];
}

export interface RoadmapGlossaryTerm {
  term: string;
  definition: string;
  source_node_id?: string;
  group?: string;
}

export interface RoadmapStep {
  label: string;
  theme: string;
  nodes: RoadmapNode[];
  checkpoint: {
    title: string;
    goal: string;
    concepts: string[];
    problem_statement: string;
    done_criteria: string;
  };
}

export interface Roadmap {
  step1: RoadmapStep;
  step2: RoadmapStep;
  step3: RoadmapStep;
  journey_analogy?: JourneyAnalogy;
  analogy_lens?: RoadmapAnalogyLens;
  terminology_primer?: TerminologyPrimer;
  project_checkpoints?: ProjectCheckpoint[];
  /** @deprecated Replaced by terminology_primer. */
  glossary?: RoadmapGlossaryTerm[];
}

export interface AssessmentState {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  socMatch: SOCMatch | null;
  roleCategory: RoleCategory | null;
  tasks: OnetTask[];
  taskWeights: Record<string, TaskWeight>;
  riskScore: number | null;
  scoreBand: ScoreBand | null;
  skillGap: SkillGapResult | null;
  roadmap: Roadmap | null;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  soc_code: string;
  soc_title: string;
  role_category: RoleCategory;
  risk_score: number;
  score_band: ScoreBand;
  task_weights: Record<string, TaskWeight>;
  skill_gap: string[];
  skills_have: string[];
  roadmap: Roadmap | null;
  india_adjusted: boolean;
  sector: string | null;
  created_at: string;
  email_status: string;
  brevo_contact_id: string | null;
  email_seq_started_at: string | null;
  email_seq_completed_at: string | null;
}
