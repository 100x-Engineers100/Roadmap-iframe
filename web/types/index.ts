export type RoleCategory = 'pm' | 'designer' | 'marketer' | 'sales' | 'engineer' | 'student';
export type ScoreBand = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Difficulty = 'foundational' | 'intermediate' | 'advanced';
export type TaskWeight = 'low' | 'medium' | 'high';

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

export interface SkillGapResult {
  green: CurriculumSkill[];
  red: CurriculumSkill[];
}

export interface RoadmapSubnode {
  id: string;
  title: string;
  description: string;
  outcome: string;
}

export interface RoadmapNode {
  id: string;
  name_plain: string;
  one_line_desc: string;
  what_covers: string;
  what_do_after: string;
  subnodes: RoadmapSubnode[];
  concepts_left: string[];
  concepts_right: string[];
  skill_ids: string[];
  analogy: { base: string; role_skin: string; bridge_line: string };
  depth: Difficulty;
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
    time_est: string;
  };
}

export interface Roadmap {
  step1: RoadmapStep;
  step2: RoadmapStep;
  step3: RoadmapStep;
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
  roadmap: Roadmap;
  india_adjusted: boolean;
  sector: string | null;
  created_at: string;
  email_status: string;
  brevo_contact_id: string | null;
  email_seq_started_at: string | null;
  email_seq_completed_at: string | null;
}
