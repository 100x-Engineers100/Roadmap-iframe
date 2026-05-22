import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(url, key);

let passed = 0;
let failed = 0;

function pass(label: string) {
  console.log(`[PASS] ${label}`);
  passed++;
}

function fail(label: string, detail: string) {
  console.log(`[FAIL] ${label}: ${detail}`);
  failed++;
}

async function test12_rowCount() {
  const { count, error } = await supabase
    .from('curriculum_skills')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) return fail('1.2 seed row count', error.message);
  if (count !== 25) return fail('1.2 seed row count', `got ${count}, expected 25`);
  pass('1.2 seed row count (25 rows — taxonomy has 25, spec header typo says 30)');
}

async function test13_pmQuery() {
  const { data, error } = await supabase
    .from('curriculum_skills')
    .select('*')
    .eq('is_active', true)
    .contains('roles', ['pm'])
    .order('seq_order', { ascending: true });

  if (error) return fail('1.3 getSkillsByRole(pm)', error.message);
  if (!data || data.length < 8) return fail('1.3 getSkillsByRole(pm)', `got ${data?.length} skills, expected 8+`);
  const allHavePm = data.every((s: { roles: string[] }) => s.roles.includes('pm'));
  if (!allHavePm) return fail('1.3 getSkillsByRole(pm)', 'some skills missing pm in roles');
  pass(`1.3 getSkillsByRole(pm) → ${data.length} skills, all have role 'pm'`);
}

async function test14_engineerAdjacent() {
  const { data, error } = await supabase
    .from('curriculum_skills')
    .select('*')
    .eq('id', 'S2.3')
    .single();

  if (error) return fail('1.4 roles_adjacent engineer', error.message);
  if (!data) return fail('1.4 roles_adjacent engineer', 'S2.3 not found');
  if (!data.roles_adjacent.includes('engineer')) {
    return fail('1.4 roles_adjacent engineer', `S2.3 roles_adjacent = ${JSON.stringify(data.roles_adjacent)}`);
  }
  pass(`1.4 S2.3 roles_adjacent includes 'engineer'`);
}

async function test15_leadInsert() {
  const mockLead = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    soc_code: '11-3021.00',
    soc_title: 'Computer and Information Systems Managers',
    role_category: 'pm' as const,
    risk_score: 42,
    score_band: 'MODERATE' as const,
    task_weights: { task1: 'high', task2: 'low' },
    skill_gap: ['S2.4', 'S3.1'],
    skills_have: ['S2.2'],
    roadmap: { step1: {}, step2: {}, step3: {} },
    india_adjusted: false,
    sector: null,
    email_status: 'pending',
    brevo_contact_id: null,
    email_seq_started_at: null,
    email_seq_completed_at: null,
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(mockLead)
    .select()
    .single();

  if (error) return fail('1.5 insertLead', error.message);
  if (!data?.id) return fail('1.5 insertLead', 'no id returned');
  pass(`1.5 insertLead → id ${data.id}`);

  // cleanup
  await supabase.from('leads').delete().eq('id', data.id);
}

async function run() {
  console.log('\n=== PHASE 1 TEST GATE ===\n');
  await test12_rowCount();
  await test13_pmQuery();
  await test14_engineerAdjacent();
  await test15_leadInsert();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
