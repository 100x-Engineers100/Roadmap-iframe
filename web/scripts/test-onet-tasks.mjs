/**
 * Phase 4 O*NET pagination + ordering simulation.
 * Pure JS, no network. Run from web/: node scripts/test-onet-tasks.mjs
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { buildUserWorkProfile } from '../lib/profile/user-work-profile.mjs';
import { collectOnetTasks, getDisplayTasks, getNextWindow } from '../lib/api/onet-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const outputDir = resolve(repoRoot, 'test output');
const reportPath = resolve(outputDir, 'phase4-onet-task-samples.json');

const pagedResponses = [
  {
    start: 1,
    end: 3,
    total: 7,
    next: '/online/occupations/15-1252.00/details/tasks?sort=importance&start=4&end=6',
    task: [
      { id: 't2', title: 'Review and debug distributed services', importance: 74, category: 'Supplemental' },
      { id: 't1', title: 'Integrate third-party APIs into internal systems', importance: 92, category: 'Core' },
      { id: 't3', title: 'Design backend data contracts', importance: 83, category: 'Core' },
    ],
  },
  {
    start: 4,
    end: 6,
    total: 7,
    next: '/online/occupations/15-1252.00/details/tasks?sort=importance&start=7&end=9',
    task: [
      { id: 't5', title: 'Maintain CI pipelines', importance: 62, category: 'Supplemental' },
      { id: 't4', title: 'Profile API latency and failures', importance: 88, category: 'Core' },
      { id: 't6', title: 'Document service handoffs', importance: 58, category: 'Supplemental' },
    ],
  },
  {
    start: 7,
    end: 7,
    total: 7,
    task: [
      { id: 't7', title: 'Coordinate release notes', importance: 51, category: 'Supplemental' },
    ],
  },
];

function buildProfileFromTasks(tasks) {
  const displayTasks = getDisplayTasks(tasks);
  const taskWeights = Object.fromEntries(tasks.map((task, index) => [task.id, index < 2 ? 'high' : index < 4 ? 'medium' : 'low']));

  return {
    displayTasks,
    taskWeights,
    userProfile: buildUserWorkProfile({
      rawRoleText: 'Backend engineer building APIs and internal tooling',
      socMatch: { soc_code: '15-1252.00', title: 'Software Developers' },
      roleCategory: 'engineer',
      tasks,
      taskWeights,
      aiFamiliarity: 'building',
      confirmedClusterIds: ['C2B'],
    }),
  };
}

async function main() {
  const collectedTasks = collectOnetTasks(pagedResponses);
  const windows = pagedResponses.slice(0, 2).map((response, index) =>
    getNextWindow(response, index === 0 ? 1 : 4, 3)
  );
  const { displayTasks, taskWeights, userProfile } = buildProfileFromTasks(collectedTasks);

  const expectedTopTaskIds = ['t1', 't4', 't3', 't2'];
  const actualTopTaskIds = displayTasks.map(task => task.id);
  const selectedTaskIds = userProfile.selected_tasks.map(task => task.id);

  const report = {
    phase: 'phase4-onet-intake-fix',
    generated_at: new Date().toISOString(),
    production_helpers: [
      'web/lib/api/onet-utils.mjs',
      'web/lib/profile/user-work-profile.mjs',
    ],
    completion_gate: {
      pagination_windows_advance: windows[0]?.start === 4 && windows[1]?.start === 7,
      highest_importance_tasks_sorted: JSON.stringify(actualTopTaskIds) === JSON.stringify(expectedTopTaskIds),
      highest_importance_tasks_survive_into_profile: JSON.stringify(selectedTaskIds) === JSON.stringify(expectedTopTaskIds),
    },
    sample: {
      collected_task_ids: collectedTasks.map(task => task.id),
      display_task_ids: actualTopTaskIds,
      selected_task_ids: selectedTaskIds,
      task_weights: taskWeights,
      user_profile: userProfile,
    },
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`[PHASE 4] pagination windows advance: ${report.completion_gate.pagination_windows_advance}`);
  console.log(`[PHASE 4] top tasks sorted: ${report.completion_gate.highest_importance_tasks_sorted}`);
  console.log(`[PHASE 4] top tasks survive into profile: ${report.completion_gate.highest_importance_tasks_survive_into_profile}`);
  console.log(`[PHASE 4] report: ${reportPath}`);

  if (!Object.values(report.completion_gate).every(Boolean)) {
    console.error('[PHASE 4] O*NET task simulation failed completion gate.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
