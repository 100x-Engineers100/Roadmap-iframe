import { supabaseAdmin } from '../supabase';
import type { Lead, Roadmap } from '../../types';

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

export async function updateLeadRoadmap(leadId: string, roadmap: Roadmap): Promise<void> {
  const { error } = await supabaseAdmin
    .from('leads')
    .update({ roadmap })
    .eq('id', leadId);

  if (error) throw new Error(`updateLeadRoadmap: ${error.message}`);
}
