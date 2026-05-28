import { inferSkillGap } from '../lib/skill-gap/inference';

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`[PASS] ${name}`); passed++; }
  else { console.error(`[FAIL] ${name}${detail ? ' — ' + detail : ''}`); failed++; }
}

// T1: engineer, no confirmed, all medium → 6 red clusters
const r1 = inferSkillGap('engineer', [], {}, []);
assert('T1 green empty', r1.green.length === 0, `got ${r1.green.length}`);
assert('T1 red has 6 clusters', r1.red.length === 6, `got ${r1.red.map(c => c.id).join(',')}`);
assert('T1 red has C2A', r1.red.some(c => c.id === 'C2A'));
assert('T1 red has C2B', r1.red.some(c => c.id === 'C2B'));
assert('T1 red has C2C', r1.red.some(c => c.id === 'C2C'));
assert('T1 red has C2D', r1.red.some(c => c.id === 'C2D'));
assert('T1 red has C3A', r1.red.some(c => c.id === 'C3A'));
assert('T1 red has C3B', r1.red.some(c => c.id === 'C3B'));

// T2: engineer, C2B confirmed, high-weight API task → C2B in green not red
const t2Tasks = [{ id: 't1', description: 'integrate third-party APIs into products', importance: 80 }];
const r2 = inferSkillGap('engineer', ['C2B'], { t1: 'high' }, t2Tasks);
assert('T2 C2B in green', r2.green.some(c => c.id === 'C2B'));
assert('T2 C2B NOT in red', !r2.red.some(c => c.id === 'C2B'));
assert('T2 red has 5 clusters', r2.red.length === 5, `got ${r2.red.map(c => c.id).join(',')}`);
console.log('T2 red order:', r2.red.map(c => c.id).join(', '));

// T3: marketer, no confirmed → C1A + C2A + C3B, no C2D
const r3 = inferSkillGap('marketer', [], {}, []);
assert('T3 C1A in red', r3.red.some(c => c.id === 'C1A'));
assert('T3 C2A in red', r3.red.some(c => c.id === 'C2A'));
assert('T3 C3B in red', r3.red.some(c => c.id === 'C3B'));
assert('T3 C2D NOT in red', !r3.red.some(c => c.id === 'C2D'), 'C2D is engineer-only');
assert('T3 green empty', r3.green.length === 0);

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
