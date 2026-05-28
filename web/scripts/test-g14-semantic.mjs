/**
 * G14 — Semantic Quality Audit (LLM-as-judge, 6 standards)
 *
 * Brutal stress test. Judge reads node 1 like a real person evaluating the product.
 * Explicit PASS/FAIL criteria per standard — not vague YES/NO on intent.
 *
 * Standards from vision doc Section 6:
 *   S1: Node title = outcome a non-technical person immediately understands
 *   S2: Checkpoint scenario = this exact person, not a generic professional in their role
 *   S3: Checkpoint scenario = person knows what to BUILD and what DONE looks like
 *   S4: Analogy = from person's actual job domain, not generic everyday metaphor
 *   S5: Atom explanations = WHY before WHAT (problem first, solution second)
 *   S6: Non-technical person reads atoms without needing to Google a single term
 *
 * Pass criterion per fixture: 5+ of 6 YES.
 * Run from web/: node scripts/test-g14-semantic.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import nextEnv from '@next/env';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..');
const repoRoot = resolve(webRoot, '..');
const { loadEnvConfig } = nextEnv;
loadEnvConfig(webRoot);

const e2eDir = resolve(repoRoot, 'test output', 'pipeline-e2e');

const FIXTURE_IDS = [
  'marketer-none',
  'designer-basic',
  'sales-none',
  'founder-pm',
  'engineer-advanced',
  'student-none',
];

const JUDGE_SYSTEM = `You are a brutally honest quality reviewer for a learning platform targeting non-technical professionals.
You are NOT here to give benefit of the doubt. You are here to catch content that feels generic, educational, or written for the wrong audience.
Answer each question YES or NO only. One answer per line. No explanation. No punctuation after the answer.
Apply the exact failure criteria given in the prompt. If in doubt, answer NO.`;

function buildJudgePrompt(fixture) {
  const { rawRoleText, workContext, highWeightTasks, roleCategory, title, scenario, journeyAnalogy, atom1, atom2 } = fixture;
  const taskList = highWeightTasks.map(t => `- ${t.description}`).join('\n');
  const isNonTech = ['marketer', 'designer', 'sales', 'pm', 'student'].includes(roleCategory);

  return `PERSON BEING EVALUATED:
Role: ${rawRoleText}
Work context: ${workContext}
Their actual high-priority daily tasks:
${taskList}

NODE 1 CONTENT TO AUDIT:
Title: ${title}
Checkpoint scenario: ${scenario}
Journey analogy frame: ${journeyAnalogy}
Atom 1 explanation: ${atom1}
Atom 2 explanation: ${atom2 ?? '(none)'}

FAILURE CRITERIA — apply these exactly:

S1 FAILS if: the title contains AI-specific jargon a professional in this role would not know (OPT, RAG, MCP, LoRA, structured output, embeddings, vector, LLM, ReAct, SPAORL, naive). Tool names are also banned (FastAPI, Supabase, n8n, Midjourney, HeyGen, LangChain, LangGraph). EXCEPTION: for engineer and student roles, standard programming vocabulary (API, backend, endpoint, database, function) is acceptable — these are domain-standard terms, not AI jargon. PASSES only if the outcome is crystal clear to a professional in this specific role — they know what they will GAIN or be ABLE TO DO.

S2 FAILS if: the scenario could have been written for ANY ${roleCategory}. PASSES only if it names situation details unique to THIS person's described work, not just their job title paraphrased.

S3 FAILS if: the scenario does not explicitly name what artifact the person will create AND what done looks like. "Use Tool X to do Y" without a clear output = FAIL.

S4 FAILS if: the journey analogy frame uses a generic everyday metaphor (library, filing cabinet, assembly line, chef, recipe, etc.) OR could describe any professional transforming their work. PASSES only if it clearly comes from THIS person's actual job domain — a ${roleCategory} would read it and think "yes, that's my world."

S5 FAILS if: either atom explanation opens by naming or demonstrating the capability before establishing the problem. "Use X to do Y" = FAIL. "Build X with Tool Y" without first stating a specific pain = FAIL. PASSES only if the explanation opens with a problem or gap this person actually faces.

S6 ${isNonTech ? `FAILS if: any unexplained technical term appears in either atom explanation. Terms a non-technical ${roleCategory} would not know: RAG, embeddings, vector database, MCP, structured output, context window, token, n8n, LLM, API, LoRA, prompt engineering, ReAct, fine-tuning, inference. PASSES only if every technical concept is plain English or defined inline.` : `PASSES automatically — ${roleCategory} is a technical role expected to know technical terms.`}

Answer S1 through S6 in order, YES or NO only, one per line:`;
}

async function judgeFixture(openai, fixtureId) {
  const raw = await readFile(resolve(e2eDir, `${fixtureId}-enriched.json`), 'utf8');
  const data = JSON.parse(raw);

  const profile = data.enriched.user_profile;
  const node1 = data.enriched.phases[0].nodes[0];

  const leftItems = node1.panel?.expansion?.left_items ?? [];
  const journeyAnalogy = data.enriched.journey_analogy?.frame ?? '(no journey analogy)';

  const fixture = {
    rawRoleText: profile.raw_role_text,
    workContext: profile.work_context ?? 'startup',
    highWeightTasks: profile.high_weight_tasks ?? [],
    roleCategory: profile.role_category,
    title: node1.title,
    scenario: node1.panel.checkpoint.scenario,
    journeyAnalogy,
    atom1: leftItems[0]?.explanation ?? '(none)',
    atom2: leftItems[1]?.explanation ?? null,
  };

  const prompt = buildJudgePrompt(fixture);

  const res = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    max_tokens: 60,
    messages: [
      { role: 'system', content: JUDGE_SYSTEM },
      { role: 'user', content: prompt },
    ],
  });

  const content = res.choices[0]?.message?.content?.trim() ?? '';
  const lines = content.split('\n').map(l => l.trim().toUpperCase());
  const yesCount = lines.filter(l => l === 'YES').length;

  return {
    fixtureId,
    title: fixture.title,
    scenario: fixture.scenario,
    journeyAnalogy: fixture.journeyAnalogy,
    atom1: fixture.atom1,
    rawRoleText: fixture.rawRoleText,
    workContext: fixture.workContext,
    roleCategory: fixture.roleCategory,
    answers: lines,
    yesCount,
    pass: yesCount >= 5,
  };
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'REPLACE_ME') {
    console.error('[FATAL] OPENAI_API_KEY not set');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  console.log('\n=== G14 SEMANTIC QUALITY AUDIT — 6 STANDARDS (BRUTAL MODE) ===\n');
  console.log('Judge reads like a real person. Explicit fail criteria per standard.');
  console.log('Pass criterion: 5+ of 6 YES per fixture.\n');

  const labels = [
    'S1 (outcome title — no jargon)',
    'S2 (this exact person, not role)',
    'S3 (knows what to build + done)',
    'S4 (analogy from actual job)',
    'S5 (problem first, solution second)',
    'S6 (reads without Googling)',
  ];

  // All 6 judge calls in parallel
  const start = Date.now();
  const results = await Promise.all(FIXTURE_IDS.map(async id => {
    try {
      return await judgeFixture(openai, id);
    } catch (err) {
      return { fixtureId: id, pass: false, yesCount: 0, answers: [], error: err.message };
    }
  }));
  console.log(`  judge calls: ${((Date.now() - start) / 1000).toFixed(1)}s (parallel)\n`);

  for (const result of results) {
    console.log(`--- ${result.fixtureId} ---`);
    if (result.error) { console.log(`  [ERROR] ${result.error}`); console.log(); continue; }
    for (let i = 0; i < 6; i++) {
      const ans = result.answers[i] ?? '??';
      const icon = ans === 'YES' ? '[YES]' : '[NO] ';
      console.log(`  ${icon} ${labels[i]}`);
    }
    console.log(`  ${result.pass ? '[PASS]' : '[FAIL]'} G14: ${result.yesCount}/6 YES — "${result.title}"`);
    if (!result.pass) {
      console.log(`  Scenario:  "${result.scenario.slice(0, 140)}"`);
      console.log(`  Journey:   "${result.journeyAnalogy.slice(0, 100)}"`);
      console.log(`  Atom 1:    "${result.atom1.slice(0, 120)}"`);
    }
    console.log();
  }

  console.log('=== SUMMARY ===\n');

  const standardPass = [0, 1, 2, 3, 4, 5].map(i =>
    results.filter(r => (r.answers[i] ?? '') === 'YES').length
  );
  const standardLabels = ['S1 outcome title', 'S2 exact person', 'S3 build+done', 'S4 role analogy', 'S5 why-before-what', 'S6 no jargon'];

  console.log('  Per-standard pass rate (N/6 fixtures):');
  standardLabels.forEach((label, i) => {
    const n = standardPass[i];
    const icon = n === 6 ? '[PASS]' : n >= 4 ? '[WARN]' : '[FAIL]';
    console.log(`  ${icon} ${label}: ${n}/6`);
  });
  console.log();

  for (const r of results) {
    const icon = r.pass ? '[PASS]' : '[FAIL]';
    console.log(`  ${icon} ${r.fixtureId} — ${r.yesCount}/6 YES`);
    if (!r.pass && !r.error) {
      const labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
      const ctx = [r.title, r.scenario, r.scenario, r.journeyAnalogy, r.atom1, r.atom1];
      r.answers.forEach((a, i) => {
        if (a !== 'YES') console.log(`         ${labels[i]}: NO — "${ctx[i]?.slice(0,80)}"`);
      });
    }
  }

  const passed = results.filter(r => r.pass).length;
  const allPass = passed === results.length;
  console.log(`\n  ${passed}/${results.length} fixtures passed G14 (5+/6 YES)`);

  // Save results so we don't re-run judge calls just to read last state
  const outputDir = resolve(repoRoot, 'test output');
  await mkdir(outputDir, { recursive: true });
  const report = {
    generated_at: new Date().toISOString(),
    passed,
    total: results.length,
    allPass,
    per_standard: [0,1,2,3,4,5].map(i => ({
      standard: ['S1','S2','S3','S4','S5','S6'][i],
      pass_count: results.filter(r => (r.answers[i] ?? '') === 'YES').length,
    })),
    fixtures: results,
  };
  await writeFile(resolve(outputDir, 'g14-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`  results saved: test output/g14-results.json`);

  console.log('\n=== CUMULATIVE ===');
  console.log(`  ${allPass ? '[PASS]' : '[FAIL]'} G14 real semantic audit (5/6 YES per fixture) — all fixtures`);

  if (!allPass) {
    console.log('\n[WARN] Failing standards = content gaps that reach users.');
    process.exit(1);
  } else {
    console.log('\n=== ALL 6 STANDARDS PASS ===');
    console.log('Pipeline producing production-quality content. Ready for Phase 7 UI.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
