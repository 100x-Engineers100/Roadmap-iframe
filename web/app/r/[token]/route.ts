import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateOfflineHTML } from '@/lib/export/generateOfflineHTML';
import type { RoleCategory } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<Response> {
  const { token } = await params;

  if (!token || token.length > 64) {
    return notFound();
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('roadmap, role_category, soc_title, share_token')
    .eq('share_token', token)
    .single();

  if (error || !lead?.roadmap) {
    return notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://100x-roadmap.vercel.app';

  const html = generateOfflineHTML(
    lead.roadmap,
    lead.role_category as RoleCategory,
    lead.soc_title as string,
    { shareToken: token, baseUrl }
  );

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

function notFound(): Response {
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Not found</title></head><body style="font-family:sans-serif;padding:48px;text-align:center"><h1>Roadmap not found</h1><p>This link may be invalid or the roadmap has not been generated yet.</p></body></html>',
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
