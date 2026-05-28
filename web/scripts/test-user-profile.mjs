/**
 * Phase 3 user profile simulation.
 * Pure JS, no server. Run from web/: node scripts/test-user-profile.mjs
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { buildUserWorkProfile } from '../lib/profile/user-work-profile.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const outputDir = resolve(repoRoot, 'test output');
const reportPath = resolve(outputDir, 'phase3-user-profile-samples.json');

const CASES = [
  {
    id: 'marketer',
    rawRoleText: 'Digital marketer at a fintech startup running campaign and content ops',
    socMatch: { soc_code: '11-2021.00', title: 'Marketing Managers', confidence: 0.92 },
    roleCategory: 'marketer',
    aiFamiliarity: 'none',
    confirmedClusterIds: ['C1A'],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'low' },
    tasks: [
      { id: 't1', description: 'Plan campaign calendar', importance: 92 },
      { id: 't2', description: 'Draft content briefs', importance: 88 },
      { id: 't3', description: 'Review campaign performance', importance: 76 },
      { id: 't4', description: 'Coordinate creative approvals', importance: 60 },
    ],
  },
  {
    id: 'designer',
    rawRoleText: 'Brand designer creating visual systems for a SaaS team',
    socMatch: { soc_code: '27-1024.00', title: 'Graphic Designers', confidence: 0.9 },
    roleCategory: 'designer',
    aiFamiliarity: 'casual',
    confirmedClusterIds: ['C1A'],
    taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
    tasks: [
      { id: 't1', description: 'Create visual concepts', importance: 90 },
      { id: 't2', description: 'Adapt brand assets', importance: 74 },
      { id: 't3', description: 'Prepare presentation boards', importance: 83 },
    ],
  },
  {
    id: 'sales',
    rawRoleText: 'Sales rep doing outbound research, CRM notes, and deal prep',
    socMatch: { soc_code: '41-3091.00', title: 'Sales Representatives', confidence: 0.89 },
    roleCategory: 'sales',
    aiFamiliarity: 'none',
    confirmedClusterIds: [],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
    tasks: [
      { id: 't1', description: 'Research prospects', importance: 90 },
      { id: 't2', description: 'Personalize outbound emails', importance: 86 },
      { id: 't3', description: 'Prepare call followups', importance: 72 },
    ],
  },
  {
    id: 'founder_pm',
    rawRoleText: 'Founder PM at a healthcare startup handling launch ops and discovery',
    socMatch: { soc_code: '11-1021.00', title: 'Chief Executives', confidence: 0.86 },
    roleCategory: 'pm',
    aiFamiliarity: 'casual',
    confirmedClusterIds: ['C2A'],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
    tasks: [
      { id: 't1', description: 'Synthesize customer calls', importance: 94 },
      { id: 't2', description: 'Prioritize launch scope', importance: 89 },
      { id: 't3', description: 'Write product briefs', importance: 75 },
    ],
  },
  {
    id: 'engineer',
    rawRoleText: 'Backend engineer building API integrations and agent systems',
    socMatch: { soc_code: '15-1252.00', title: 'Software Developers', confidence: 0.94 },
    roleCategory: 'engineer',
    aiFamiliarity: 'building',
    confirmedClusterIds: ['C2B'],
    taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
    tasks: [
      { id: 't1', description: 'Integrate APIs', importance: 92 },
      { id: 't2', description: 'Design backend services', importance: 80 },
      { id: 't3', description: 'Debug multi-step agent workflows', importance: 85 },
    ],
  },
  {
    id: 'student',
    rawRoleText: 'Student learning AI through projects and portfolio work',
    socMatch: { soc_code: '25-3099.00', title: 'Student Learners', confidence: 0.78 },
    roleCategory: 'student',
    aiFamiliarity: 'none',
    confirmedClusterIds: [],
    taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
    tasks: [
      { id: 't1', description: 'Study new concepts', importance: 88 },
      { id: 't2', description: 'Build small projects', importance: 84 },
      { id: 't3', description: 'Document portfolio work', importance: 70 },
    ],
  },
];

function makeScoreBody(caseDef, userProfile) {
  return {
    soc_code: caseDef.socMatch.soc_code,
    tasks: caseDef.tasks,
    task_weights: caseDef.taskWeights,
    role_category: userProfile.role_category,
    user_profile: userProfile,
    confirmed_cluster_ids: caseDef.confirmedClusterIds,
    ai_familiarity: caseDef.aiFamiliarity,
  };
}

function makeLeadBody(caseDef, userProfile) {
  return {
    name: 'Test User',
    email: `${caseDef.id}@example.com`,
    soc_code: caseDef.socMatch.soc_code,
    soc_title: caseDef.socMatch.title,
    role_category: userProfile.role_category,
    risk_score: 50,
    score_band: 'MODERATE',
    task_weights: caseDef.taskWeights,
    user_profile: userProfile,
    skill_gap: [],
    skills_have: [],
    top_tasks: userProfile.high_weight_tasks.map(task => task.description),
    ai_familiarity: userProfile.ai_familiarity,
  };
}

function validateSample(caseDef, scoreBody, leadBody) {
  const profile = leadBody.user_profile;
  const failures = [];

  if (profile.raw_role_text !== caseDef.rawRoleText) failures.push('raw_role_text_not_preserved');
  if (!profile.role_category) failures.push('role_category_missing');
  if (!profile.role_archetype) failures.push('role_archetype_missing');
  if (!Array.isArray(profile.selected_tasks) || profile.selected_tasks.length === 0) failures.push('selected_tasks_missing');
  if (!Array.isArray(profile.high_weight_tasks) || profile.high_weight_tasks.length === 0) failures.push('high_weight_tasks_missing');
  if (!Array.isArray(profile.medium_weight_tasks)) failures.push('medium_weight_tasks_missing');
  if (!Array.isArray(profile.low_weight_tasks)) failures.push('low_weight_tasks_missing');
  if (profile.ai_familiarity !== caseDef.aiFamiliarity) failures.push('ai_familiarity_not_preserved');
  if (!Array.isArray(profile.confirmed_cluster_ids)) failures.push('confirmed_clusters_missing');
  if (scoreBody.user_profile !== profile) failures.push('score_body_missing_profile_reference');
  if (leadBody.user_profile !== profile) failures.push('lead_body_missing_profile_reference');
  if (caseDef.id === 'founder_pm' && (profile.role_category !== 'pm' || profile.role_archetype !== 'founder')) {
    failures.push('founder_not_normalized_to_pm_founder');
  }

  return failures;
}

async function main() {
  const samples = CASES.map(caseDef => {
    const userProfile = buildUserWorkProfile({
      rawRoleText: caseDef.rawRoleText,
      socMatch: caseDef.socMatch,
      roleCategory: caseDef.roleCategory,
      tasks: caseDef.tasks,
      taskWeights: caseDef.taskWeights,
      aiFamiliarity: caseDef.aiFamiliarity,
      confirmedClusterIds: caseDef.confirmedClusterIds,
    });
    const score_request_body = makeScoreBody(caseDef, userProfile);
    const lead_request_body = makeLeadBody(caseDef, userProfile);
    const failures = validateSample(caseDef, score_request_body, lead_request_body);

    return {
      id: caseDef.id,
      valid: failures.length === 0,
      failures,
      score_request_body,
      lead_request_body,
      user_profile: userProfile,
    };
  });

  const passed = samples.filter(sample => sample.valid).length;
  const report = {
    phase: 'phase3-preserve-full-user-context',
    generated_at: new Date().toISOString(),
    production_profile_builder: 'web/lib/profile/user-work-profile.mjs',
    completion_gate: {
      all_six_profiles_valid: passed === CASES.length,
      all_lead_bodies_include_full_profile: samples.every(sample => Boolean(sample.lead_request_body.user_profile)),
      founder_is_pm_with_founder_archetype: samples.find(sample => sample.id === 'founder_pm')?.user_profile.role_category === 'pm'
        && samples.find(sample => sample.id === 'founder_pm')?.user_profile.role_archetype === 'founder',
    },
    summary: samples.map(sample => ({
      id: sample.id,
      valid: sample.valid,
      failures: sample.failures,
      role_category: sample.user_profile.role_category,
      role_archetype: sample.user_profile.role_archetype,
      selected_task_count: sample.user_profile.selected_tasks.length,
      high_weight_task_count: sample.user_profile.high_weight_tasks.length,
      confirmed_cluster_ids: sample.user_profile.confirmed_cluster_ids,
    })),
    samples,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`[PHASE 3] valid profiles: ${passed}/${CASES.length}`);
  console.log(`[PHASE 3] lead bodies include profile: ${report.completion_gate.all_lead_bodies_include_full_profile}`);
  console.log(`[PHASE 3] report: ${reportPath}`);

  if (!report.completion_gate.all_six_profiles_valid || !report.completion_gate.all_lead_bodies_include_full_profile) {
    console.error('[PHASE 3] user profile simulation failed completion gate.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
