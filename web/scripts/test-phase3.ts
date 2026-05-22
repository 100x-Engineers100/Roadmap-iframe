/**
 * Phase 3 test gate — run with:
 *   npx tsx --env-file=.env.local scripts/test-phase3.ts
 */

import { socMatch } from '../lib/llm/soc-match';
import { validateSOCCode } from '../lib/api/onet';
import { inferSkillGap } from '../lib/skill-gap/inference';
import { getAllSkills } from '../lib/db/curriculum';

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

const SOC_FORMAT = /^\d{2}-\d{4}\.\d{2}$/;

async function run() {
  console.log('=== Phase 3 Test Gate ===\n');

  // ── TEST 3.1 ─────────────────────────────────────────────────────────────
  // socMatch returns valid primary SOC for known PM input
  console.log('TEST 3.1 — PM SOC match');
  try {
    const result = await socMatch('Product Manager at a fintech startup in Mumbai');
    assert('3.1 primary.soc_code format', SOC_FORMAT.test(result.soc_code), result.soc_code);
    assert(
      '3.1 primary.title contains Manager or Product',
      /Manager|Product/i.test(result.title),
      result.title
    );
    assert('3.1 primary.confidence >= 0.7', result.confidence >= 0.7, String(result.confidence));
  } catch (err) {
    console.error(`[FAIL] TEST 3.1 threw: ${err instanceof Error ? err.message : err}`);
    failed += 3;
  }

  // ── TEST 3.2 ─────────────────────────────────────────────────────────────
  // Ambiguous input still returns alternatives
  console.log('\nTEST 3.2 — Ambiguous banking input returns alternatives');
  try {
    const result = await socMatch('I work in a bank');
    assert('3.2 does not throw', true);
    assert(
      '3.2 at least 1 alternative returned',
      result.alternatives.length >= 1,
      `alternatives: ${result.alternatives.length}`
    );
    assert(
      '3.2 primary soc_code non-empty',
      result.soc_code.length > 0
    );
  } catch (err) {
    console.error(`[FAIL] TEST 3.2 threw: ${err instanceof Error ? err.message : err}`);
    failed += 3;
  }

  // ── TEST 3.3 ─────────────────────────────────────────────────────────────
  // All returned SOC codes pass O*NET validation (invalid ones silently dropped)
  console.log('\nTEST 3.3 — All returned SOC codes are valid O*NET codes');
  try {
    const result = await socMatch('Software engineer at a startup');
    const allCodes = [result.soc_code, ...result.alternatives.map((a) => a.soc_code)];

    let allValid = true;
    for (const code of allCodes) {
      const valid = await validateSOCCode(code);
      if (!valid) {
        allValid = false;
        console.error(`  [INVALID SOC leaked through] ${code}`);
      }
    }
    assert(
      '3.3 all returned SOC codes pass O*NET validation',
      allValid,
      `checked ${allCodes.length} codes`
    );
  } catch (err) {
    console.error(`[FAIL] TEST 3.3 threw: ${err instanceof Error ? err.message : err}`);
    failed++;
  }

  // ── TEST 3.4 ─────────────────────────────────────────────────────────────
  // inferSkillGap('engineer') — S2.3 green, S2.2 red, 6-8 total
  console.log('\nTEST 3.4 — inferSkillGap for engineer');
  try {
    const allSkills = await getAllSkills();
    const gap = inferSkillGap('engineer', allSkills);

    const total = gap.green.length + gap.red.length;
    assert(
      '3.4 total skills 6-8',
      total >= 6 && total <= 8,
      `total: ${total}`
    );

    const s23InGreen = gap.green.some((s) => s.id === 'S2.3');
    assert('3.4 S2.3 appears in green', s23InGreen, `green ids: ${gap.green.map((s) => s.id).join(', ')}`);

    // S2.2: roles includes engineer, roles_adjacent: [] → RED
    const s22InRed = gap.red.some((s) => s.id === 'S2.2');
    assert('3.4 S2.2 appears in red (roles has engineer, roles_adjacent does not)', s22InRed, `red ids: ${gap.red.map((s) => s.id).join(', ')}`);

    const allGreenAdjacent = gap.green.every((s) => s.roles_adjacent.includes('engineer'));
    assert('3.4 all green skills have roles_adjacent includes engineer', allGreenAdjacent);
  } catch (err) {
    console.error(`[FAIL] TEST 3.4 threw: ${err instanceof Error ? err.message : err}`);
    failed += 4;
  }

  // ── TEST 3.5 ─────────────────────────────────────────────────────────────
  // API route responds correctly
  console.log('\nTEST 3.5 — POST /api/soc-match (requires dev server on :3000)');
  try {
    const start = Date.now();
    const res = await fetch('http://localhost:3000/api/soc-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Designer at an ad agency' }),
    });
    const elapsed = Date.now() - start;

    assert('3.5 status 200', res.status === 200, `status: ${res.status}`);
    assert('3.5 response time < 5000ms', elapsed < 5000, `${elapsed}ms`);

    const body = await res.json() as Record<string, unknown>;
    assert('3.5 body has primary', typeof body['primary'] === 'object' && body['primary'] !== null);
    assert('3.5 body has alternatives array', Array.isArray(body['alternatives']));

    const primary = body['primary'] as Record<string, unknown>;
    assert(
      '3.5 primary.soc_code valid format',
      typeof primary['soc_code'] === 'string' && SOC_FORMAT.test(primary['soc_code'] as string),
      String(primary['soc_code'])
    );
  } catch (err) {
    if (err instanceof TypeError && (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed'))) {
      console.warn('[SKIP] TEST 3.5 — dev server not running on :3000. Start with: npm run dev');
    } else {
      console.error(`[FAIL] TEST 3.5 threw: ${err instanceof Error ? err.message : err}`);
      failed += 5;
    }
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
