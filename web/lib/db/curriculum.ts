import { supabaseAdmin } from '../supabase';
import type { CurriculumSkill, RoleCategory } from '../../types';

export async function getAllSkills(): Promise<CurriculumSkill[]> {
  const { data, error } = await supabaseAdmin
    .from('curriculum_skills')
    .select('*')
    .eq('is_active', true)
    .order('seq_order', { ascending: true });

  if (error) throw new Error(`getAllSkills: ${error.message}`);
  return data as CurriculumSkill[];
}

export async function getSkillsByRole(role: RoleCategory): Promise<CurriculumSkill[]> {
  const { data, error } = await supabaseAdmin
    .from('curriculum_skills')
    .select('*')
    .eq('is_active', true)
    .contains('roles', [role])
    .order('seq_order', { ascending: true });

  if (error) throw new Error(`getSkillsByRole: ${error.message}`);
  return data as CurriculumSkill[];
}
