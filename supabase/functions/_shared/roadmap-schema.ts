import { z } from "npm:zod@3";

const SubBranchSchema = z.object({
  title: z.string(),
  topics: z.array(z.string()).min(2).max(5),
});

const SpineNodeSchema = z.object({
  order: z.number().int().min(1),
  title: z.string(),
  left_cluster: z.object({
    label: z.string(),
    topics: z.array(z.string()).min(3).max(6),
  }),
  right_cluster: z.object({
    label: z.string(),
    topics: z.array(z.string()).min(3).max(6),
  }),
  sub_branches: z.array(SubBranchSchema).optional(),
  checkpoint: z.string(),
});

export const RoadmapSchema = z.object({
  version: z.literal("4.0"),
  roadmap_title: z.string(),
  generated_at: z.string(),
  user_profile: z.object({
    name: z.string(),
    goal: z.string(),
    background_role: z.string(),
    experience_years: z.string(),
    weak_areas: z.array(z.string()),
    hours_per_week: z.string(),
    learning_style: z.string(),
    timeframe_months: z.number(),
  }),
  summary: z.string(),
  target_outcome: z.string(),
  spine_nodes: z.array(SpineNodeSchema).min(5).max(10),
  coaching_note: z.string(),
  reminder_emails: z.object({
    day_3: z.object({ subject: z.string(), body: z.string() }),
    day_6: z.object({ subject: z.string(), body: z.string() }),
  }),
});

export type RoadmapJSON = z.infer<typeof RoadmapSchema>;
export type SpineNode = z.infer<typeof SpineNodeSchema>;
export type SubBranch = z.infer<typeof SubBranchSchema>;
