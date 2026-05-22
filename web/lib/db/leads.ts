import { supabaseAdmin } from '../supabase';
import type { Lead } from '../../types';

export async function insertLead(
  lead: Omit<Lead, 'id' | 'created_at'>
): Promise<Lead> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) throw new Error(`insertLead: ${error.message}`);
  return data as Lead;
}
