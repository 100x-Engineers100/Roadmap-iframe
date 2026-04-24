import { z } from "npm:zod@3";

const ResourceSchema = z.object({
  title: z.string(),
  source: z.enum(["zeno", "model_knowledge"]),
  key: z.string().optional(),
});

const MilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["concept", "project", "skill"]),
  priority: z.enum(["high", "medium", "low"]),
  done: z.boolean().default(false),
  resources: z.array(ResourceSchema).max(2),
});

const PhaseSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  weeks: z.string(),
  focus: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  milestones: z.array(MilestoneSchema).max(4),
  weekly_schedule: z.array(z.object({
    week: z.number(),
    focus: z.string(),
    estimated_hours: z.number(),
  })),
  weekly_actions: z.array(z.string()),
});

const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_level: z.number(),
  target_level: z.number(),
  category: z.enum(["foundation", "ai", "deployment", "product"]),
  unlocks: z.array(z.string()),
  source: z.enum(["zeno", "model_knowledge"]),
});

export const RoadmapSchema = z.object({
  version: z.string(),
  roadmap_title: z.string(),
  generated_at: z.string(),
  source_strategy: z.object({
    domain_mapping: z.string(),
    zeno_usage: z.string(),
    zeno_confidence: z.enum(["high", "low"]),
    fallback_allowed: z.boolean(),
  }),
  user_profile: z.object({
    name: z.string(),
    goal: z.string(),
    target_role: z.string(),
    background_role: z.string(),
    experience_years: z.string(),
    weak_areas: z.array(z.string()),
    hours_per_week: z.string(),
    learning_style: z.string(),
    timeframe_months: z.number(),
  }),
  summary: z.string(),
  target_outcome: z.string(),
  success_metrics: z.array(z.string()).min(2).max(3),
  risks: z.array(z.string()).min(2).max(3),
  assumptions: z.array(z.string()),
  phases: z.array(PhaseSchema),
  next_7_days: z.array(z.string()).length(3),
  skill_tree: z.array(SkillSchema).max(8),
  evidence_used: z.array(z.object({ key: z.string(), title: z.string() })),
  coaching_note: z.string(),
  reminder_emails: z.object({
    day_3: z.object({ subject: z.string(), body: z.string() }),
    day_6: z.object({ subject: z.string(), body: z.string() }),
  }),
  download_metadata: z.object({
    theme: z.string(),
    width: z.number(),
    height: z.number(),
    generated_at: z.string(),
  }),
});

export type RoadmapJSON = z.infer<typeof RoadmapSchema>;
