export interface ZenoContext {
  overview: string;
  index: string;
  evidence: Array<{
    key: string;
    title: string;
    excerpt: string;
    matched_terms: string[];
  }>;
  meta: { queries: string[]; result_count: number };
}

export async function fetchZenoContext(params: {
  goal: string;
  background: string;
  weak_areas: string[];
  timeframe_months: number;
}): Promise<ZenoContext> {
  const url = Deno.env.get("ZENO_MCP_URL") ?? "";
  const secret = Deno.env.get("ZENO_INTERNAL_SECRET") ?? "";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Zeno fetch failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<ZenoContext>;
}
