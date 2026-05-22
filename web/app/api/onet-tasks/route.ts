import { NextRequest, NextResponse } from 'next/server';
import { getTasksForSOC } from '@/lib/api/onet';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const soc = req.nextUrl.searchParams.get('soc');
  if (!soc || !soc.trim()) {
    return NextResponse.json({ error: 'Missing soc parameter' }, { status: 400 });
  }

  try {
    const tasks = await getTasksForSOC(soc);
    return NextResponse.json({ tasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
