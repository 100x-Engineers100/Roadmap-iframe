import { z } from "npm:zod@3";

const WeekCardSchema = z.object({
  week: z.number().int().min(1).max(4),
  theme: z.string(),
  topics: z.array(z.string()).min(6).max(8),
  tools: z.array(z.string()).min(2).max(5),
  mini_project: z.string(),
  capability_checkpoint: z.string(),
});

const WeekBreakdownSchema = z.object({
  week_label: z.string(),
  topics: z.array(z.string()).min(3).max(5),
});

const MonthCardSchema = z.object({
  month: z.number().int().min(2),
  theme: z.string(),
  week_breakdowns: z.array(WeekBreakdownSchema).length(4),
  mini_project: z.string(),
});

const MilestoneMonthSchema = z.object({
  month: z.number().int().min(1),
  label: z.string(),
  milestones: z.array(z.string()).min(3).max(4),
});

export const RoadmapSchema = z.object({
  version: z.string(),
  roadmap_title: z.string(),
  generated_at: z.string(),
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
  week_cards: z.array(WeekCardSchema).length(4),
  month_cards: z.array(MonthCardSchema),
  milestone_tracker: z.array(MilestoneMonthSchema),
  coaching_note: z.string(),
  reminder_emails: z.object({
    day_3: z.object({ subject: z.string(), body: z.string() }),
    day_6: z.object({ subject: z.string(), body: z.string() }),
  }),
});

export type RoadmapJSON = z.infer<typeof RoadmapSchema>;
export type WeekCard = z.infer<typeof WeekCardSchema>;
export type MonthCard = z.infer<typeof MonthCardSchema>;
export type MilestoneMonth = z.infer<typeof MilestoneMonthSchema>;
