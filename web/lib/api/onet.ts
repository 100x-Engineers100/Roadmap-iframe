import type { OnetTask } from '@/types';

const ONET_BASE_URL = 'https://api-v2.onetcenter.org/online';

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
  task?: Array<{
    id: string;
    title: string;
    importance: number;
    category: string;
  }>;
}

export async function getTasksForSOC(socCode: string): Promise<OnetTask[]> {
  const url = `${ONET_BASE_URL}/occupations/${encodeURIComponent(socCode)}/details/tasks`;
  const res = await fetch(url, { headers: onetHeaders() });

  if (!res.ok) {
    throw new Error(`O*NET tasks request failed: ${res.status} ${res.statusText} for SOC ${socCode}`);
  }

  const data: OnetTasksResponse = await res.json();

  if (!data.task || data.task.length === 0) {
    throw new Error(`No tasks returned from O*NET for SOC ${socCode}`);
  }

  return data.task.map((t) => ({
    id: t.id,
    description: t.title,
    importance: t.importance,
  }));
}

export async function validateSOCCode(socCode: string): Promise<boolean> {
  const url = `${ONET_BASE_URL}/occupations/${encodeURIComponent(socCode)}`;
  const res = await fetch(url, { headers: onetHeaders() });
  return res.ok;
}
