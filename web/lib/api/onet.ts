import type { OnetTask } from '@/types';
import { collectOnetTasks, getNextWindow } from './onet-utils.mjs';

const ONET_BASE_URL = 'https://api-v2.onetcenter.org/online';
const TASK_PAGE_SIZE = 25;
const MAX_TASK_PAGES = 8;

function getApiKey(): string {
  const key = process.env.ONET_API_KEY;
  if (!key) throw new Error('ONET_API_KEY env var not set');
  return key;
}

function onetHeaders(): HeadersInit {
  return {
    'X-API-Key': getApiKey(),
    'Accept': 'application/json',
  };
}

interface OnetTasksResponse {
  start?: number;
  end?: number;
  total?: number;
  prev?: string;
  next?: string;
  task?: Array<{
    id: string;
    title: string;
    importance: number;
    category: string;
  }>;
}

export async function getTasksForSOC(socCode: string): Promise<OnetTask[]> {
  const responses: OnetTasksResponse[] = [];
  let start = 1;
  let end = TASK_PAGE_SIZE;

  for (let page = 0; page < MAX_TASK_PAGES; page += 1) {
    const url = `${ONET_BASE_URL}/occupations/${encodeURIComponent(socCode)}/details/tasks?sort=importance&start=${start}&end=${end}`;
    const res = await fetch(url, { headers: onetHeaders() });

    if (!res.ok) {
      throw new Error(`O*NET tasks request failed: ${res.status} ${res.statusText} for SOC ${socCode}`);
    }

    const data: OnetTasksResponse = await res.json();
    responses.push(data);

    const nextWindow = getNextWindow(data, start, TASK_PAGE_SIZE);
    if (!nextWindow) break;

    start = nextWindow.start;
    end = nextWindow.end;
  }

  const tasks = collectOnetTasks(responses) as OnetTask[];
  if (tasks.length === 0) {
    throw new Error(`No tasks returned from O*NET for SOC ${socCode}`);
  }

  return tasks;
}

export async function validateSOCCode(socCode: string): Promise<boolean> {
  const url = `${ONET_BASE_URL}/occupations/${encodeURIComponent(socCode)}`;
  const res = await fetch(url, { headers: onetHeaders() });
  return res.ok;
}
