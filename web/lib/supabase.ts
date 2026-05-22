import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (full access) — use in API routes + scripts only
export const supabaseAdmin = createClient(url, serviceKey);

// Client-side safe client
export const supabase = createClient(url, anonKey);
