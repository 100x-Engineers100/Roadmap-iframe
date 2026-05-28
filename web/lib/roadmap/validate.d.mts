export type ValidationSeverity = 'blocking' | 'warning';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  path?: string;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  blocking: ValidationIssue[];
  warnings: ValidationIssue[];
  issues: ValidationIssue[];
}

export type RoadmapAudience =
  | 'marketer'
  | 'designer'
  | 'sales'
  | 'founder_pm'
  | 'engineer'
  | 'student';

export const ROADMAP_AUDIENCES: RoadmapAudience[];
export const ISSUE_CODES: Record<string, string>;

export function validateRoadmap(
  roadmap: unknown,
  options?: { audience?: string }
): ValidationResult;
