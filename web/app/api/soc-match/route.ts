import { NextRequest, NextResponse } from 'next/server';
import { socMatch } from '@/lib/llm/soc-match';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
  }

  const input = (body as Record<string, unknown>)['input'];
  if (typeof input !== 'string' || !input.trim()) {
    return NextResponse.json({ error: 'Missing required field: input' }, { status: 400 });
  }

  try {
    const result = await socMatch(input);
    return NextResponse.json({ primary: result, alternatives: result.alternatives });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
