import { randomBytes } from 'crypto';
import { supabaseAdmin } from '../supabase';
import type { Lead, Roadmap } from '../../types';

function generateShareToken(): string {
  return randomBytes(16).toString('base64url').slice(0, 21);
}

export async function insertLead(
  lead: Omit<Lead, 'id' | 'created_at' | 'share_token'>
): Promise<Lead> {
  const share_token = generateShareToken();
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({ ...lead, share_token })
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
