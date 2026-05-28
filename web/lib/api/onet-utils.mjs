const CORE_CATEGORY_RANK = {
  Core: 0,
  core: 0,
  Supplemental: 1,
  supplemental: 1,
};

function categoryRank(category) {
  return CORE_CATEGORY_RANK[category ?? ''] ?? 2;
}

export function sortTasksByImportance(tasks) {
  return [...(tasks ?? [])].sort((left, right) => {
    const importanceDelta = Number(right.importance ?? 0) - Number(left.importance ?? 0);
    if (importanceDelta !== 0) return importanceDelta;

    const categoryDelta = categoryRank(left.category) - categoryRank(right.category);
    if (categoryDelta !== 0) return categoryDelta;

    return String(left.description ?? '').localeCompare(String(right.description ?? ''));
  });
}

export function dedupeTasks(tasks) {
  const byId = new Map();
  for (const task of tasks ?? []) {
    if (!task?.id) continue;
    if (!byId.has(task.id)) byId.set(task.id, task);
  }
  return [...byId.values()];
}

export function normalizeOnetTask(task) {
  return {
    id: String(task.id),
    description: String(task.title ?? ''),
    importance: Number(task.importance ?? 0),
    category: task.category ?? undefined,
  };
}

export function collectOnetTasks(responses) {
  const normalized = (responses ?? []).flatMap(response =>
    (response?.task ?? []).map(normalizeOnetTask)
  );
  return sortTasksByImportance(dedupeTasks(normalized));
}

export function getDisplayTasks(tasks, limit = 4) {
  const sorted = sortTasksByImportance(tasks);
  if (sorted.every(task => Number(task.importance ?? 0) === 0)) return sorted.slice(0, limit);
  return sorted.slice(0, limit);
}

export function getNextWindow(response, fallbackStart, pageSize) {
  if (response?.total && response?.end && Number(response.end) < Number(response.total)) {
    const start = Number(response.end) + 1;
    return { start, end: start + pageSize - 1 };
  }

  if (response?.next) {
    const nextUrl = new URL(response.next, 'https://api-v2.onetcenter.org');
    const start = Number(nextUrl.searchParams.get('start') ?? fallbackStart + pageSize);
    const end = Number(nextUrl.searchParams.get('end') ?? start + pageSize - 1);
    return { start, end };
  }

  return null;
}
