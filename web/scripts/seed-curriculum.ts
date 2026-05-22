import { createClient } from '@supabase/supabase-js';
import { CURRICULUM_SEED } from '../data/curriculum-seed';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('[ERROR] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
  console.log(`[*] Seeding ${CURRICULUM_SEED.length} skills...`);

  const rows = CURRICULUM_SEED.map((s) => ({
    id: s.id,
    module: s.module,
    name_display: s.name_display,
    can_do: s.can_do,
    tools: s.tools,
    roles: s.roles,
    roles_adjacent: s.roles_adjacent,
    difficulty: s.difficulty,
    seq_order: s.seq_order,
    is_active: true,
  }));

  const { error } = await supabase
    .from('curriculum_skills')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }

  console.log(`[OK] Seeded ${rows.length} skills`);
}

seed();
