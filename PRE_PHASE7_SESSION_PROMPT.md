# Pre-Phase 7 Session Prompt
## Topic: Retry Elimination + Real Semantic Quality Gate

---

## READ THESE IN ORDER BEFORE TOUCHING ANYTHING

1. `graphify-out/GRAPH_REPORT.md` — codebase dependency map
2. `ROADMAP_BUILD_DOC.md` — phases 0-6 DONE. Read TESTING LESSONS + PRE-PHASE 7 DIAGNOSTIC sections.
3. `claude web roadmap-findings-doc.md` — THIS IS THE NORTH STAR. Section 6 has the 6 standards the system must meet. Read it fully. This is the founder's actual mental model, extracted in a Socratic interview. Everything in this session is in service of meeting those 6 standards reliably.
4. `web/lib/llm/panel-copy.ts` — the SYSTEM_PROMPT and buildUserPrompt. This is where retries start and where semantic quality is controlled.
5. `web/scripts/test-pipeline-e2e.mjs` — current test script. Understand all gates before touching anything.
6. `web/scripts/test-g14-semantic.mjs` — G14 LLM-as-judge. Understand structure. You will expand this.

---

## SESSION GOALS (in priority order)

### Goal 1 — Diagnose and eliminate enrichment retries

**Current state:** 3/6 fixtures retry during `enrichBlueprintCopy`. Target = 0.

**Why it matters:** Each retry = double latency. 50% retry rate in prod = broken UX. Also: retries happen because the first-pass LLM output violates a content rule — which means the prompt is not strong enough to prevent the violation. If the prompt can't prevent a banned phrase on first pass, it's not strong enough to produce genuinely personal content either.

**Step 1 — expose the exact errors.** Add this line to `test-pipeline-e2e.mjs` right before the retry call:
```javascript
console.log(`  retry errors: ${deltaErrors.join(' | ')}`);
```
Then run: `node scripts/test-pipeline-e2e.mjs`
Read EVERY error code that triggered a retry across all 6 fixtures.

**Step 2 — classify errors into buckets:**
- `_banned_start` → LLM opened an explanation with "Learn" / "Understand"
- `_generic_phrase` → LLM used "practice this skill" etc.
- `_empty_scenario` / `_empty_steps` → LLM left required field blank
- `_empty_explanation` / `_empty_learner_action` → LLM left atom copy blank
- `node_missing` → LLM dropped an entire node from delta

**Step 3 — root cause each bucket:**

For `_banned_start`: which atom labels are triggering it? The label is what leads LLM to write educational copy. If the atom label says "OPT Framework" the LLM writes "Learn how OPT..." Fix = add explicit verb constraint to `buildUserPrompt` node summary line: `left atoms (N): [Map] OPT Framework, ...` where the verb is baked in.

For `_generic_phrase`: which nodes? Which roles? Is it always node 1 (the most abstract node)? Fix = add a per-node validation error message in the retry prompt that names the exact atom and phrase.

For `_empty_steps` / `_empty_done_when`: the schema says `array` but doesn't enforce minimum count. The LLM might return `[]`. Fix = add to system prompt: "steps must have at least 2 items. done_when must have at least 2 items. Never return an empty array."

For `node_missing`: LLM dropped an entire node ID from the delta. This is the worst failure. Fix = add to system prompt: "Every node ID listed in LOCKED NODES must appear in your output. Missing a node ID is a fatal error."

**Step 4 — fix only what the error data confirms.** Do NOT preemptively fix all buckets. Fix what the logs show. Re-run test. Verify 0 retries.

---

### Goal 2 — Real semantic quality gate (not just structure)

**Current state:** G14 tests node 1 checkpoint scenario personalization with 4 YES/NO questions. Result: 4/6 in last run (sales + engineer failed). Prompt fix applied to `panel-copy.ts`. G14 needs re-run to confirm 6/6.

**The problem with current G14:** It only tests one node, one field, with 4 generic questions. The vision doc (`claude web roadmap-findings-doc.md` Section 6) defines 6 specific standards. Current gates don't test 5 of them at all.

**The 6 standards from Section 6 (your north star):**

> 1. A non-technical person reads every main node name and immediately understands what they will be able to do — without knowing AI terminology.
> 2. The three phases feel like three distinct life stages — not three chapters of the same textbook.
> 3. Every technical term in the side panel has a matching definition in the glossary. No term appears in the glossary that doesn't appear in the roadmap content.
> 4. Every project checkpoint is specific enough that the person knows exactly what they will build, with which tools, and what done looks like.
> 5. The analogy in each side panel uses a situation from the person's actual job — not a generic everyday metaphor.
> 6. A non-technical person can read the entire roadmap, including all side panels, without needing to Google a single term.

**Map current gates to these standards:**
- Standard 1 → G2 (title is outcome statement) — structural only. Does NOT test whether a non-tech person actually understands it.
- Standard 2 → NOT TESTED AT ALL.
- Standard 3 → G9 (terms appear in atom text). Partially tested.
- Standard 4 → G6 (scenario ≥100 chars + tool name) + G14 (Q4 personalization). Partially tested.
- Standard 5 → G7 (analogy length check). Structural only. NOT semantically tested.
- Standard 6 → NOT TESTED AT ALL.

**Build an expanded semantic gate `test-g14-semantic.mjs` that covers all 6 standards:**

Replace current 4-question prompt with a proper audit. The LLM judge reads the FULL node 1 (title + scenario + analogy + 2-3 atom explanations) plus the raw_role_text and gives verdicts on all 6 standards for node 1. Node 1 is still the right focus — it's highest stakes.

New judge prompt structure:
```
You are auditing an AI-generated learning roadmap node for a non-technical professional.
Person: {raw_role_text} | Work context: {work_context}
High-priority tasks: {high_weight_tasks}

NODE 1 CONTENT:
Title: {title}
Checkpoint scenario: {scenario}
Analogy: {analogy_takeaway}
Atom 1 explanation: {left_items[0].explanation}
Atom 2 explanation: {left_items[1].explanation}

Answer these 6 questions YES or NO only, one per line:
S1. Can a non-technical person read the node title and know exactly what they will be able to DO after completing it — without knowing AI terminology?
S2. Does the checkpoint scenario name a specific situation this exact person faces — not a generic professional in this role?
S3. Does the checkpoint scenario tell the person exactly what they will BUILD and what DONE looks like?
S4. Does the analogy reference a situation from this person's actual job (not a generic everyday metaphor like "think of it like a library")?
S5. Do the atom explanations establish WHY the person needs this capability before naming what it is?
S6. Could a non-technical {role_category} read these atom explanations without Googling a single term — because everything is either plain English or explained inline?

Gate passes: 5+ of 6 YES. Node 1 is the highest-stakes node — if it fails here, users drop off.
```

**Cost:** 1 call per fixture, ~400 tokens. 6 fixtures = ~2400 tokens. Negligible.

**Pass criterion (updated):** 5/6 YES per fixture (stricter than current 3/4 — we now have 6 standards not 4 questions).

**Update cumulative check to:**
```
G14 real semantic audit (5/6 YES per fixture) — all fixtures
```

---

### Goal 3 — Confirm G14 6/6 after prompt fix

G14 currently: 4/6 (sales + engineer failed Q2/Q4 — bare job-title scenario opener).
`panel-copy.ts` SYSTEM_PROMPT was tightened last session to require `raw_role_text` detail in scenario, not bare job title.

Before building the expanded G14: re-run the enrichment for ONLY the 2 failing fixtures (sales-none, engineer-advanced) and run current G14 against them to confirm the fix worked. Do not re-run all 6.

To re-run just 2 fixtures cheaply: modify `test-pipeline-e2e.mjs` temporarily to run only those 2 case IDs, or write a one-off 2-fixture enrichment script.

---

## WHAT "GOOD OUTPUT" ACTUALLY LOOKS LIKE

From the vision doc Section 2, Principle 2 (Why before What):

> The sequence is: establish the problem → show why the obvious solution fails → make the real solution feel inevitable → only then name it.

The founder's example: he never said "RAG stands for Retrieval Augmented Generation." He said: "LLMs don't know your company's data — and if you just dump your documents in, the context window breaks." By the time he said "vector database," the sales rep already understood WHY it had to exist.

**This is the test for S5.** Current atom explanations typically open with what the technology does, not what the person's problem is. An S5 pass looks like:

BAD: "Use vector databases to store embeddings for semantic search." (names tech first)
GOOD: "Your documents don't fit in the context window — and copy-pasting is chaos at scale. Map how each piece of content gets from source to AI, so you can see exactly where it breaks." (establishes problem first, tech comes later)

**This is the hardest standard to fix** because it requires changing how `buildUserPrompt` structures the node context for the LLM — not just adding a system prompt rule.

---

## WHAT NOT TO DO

- Do NOT start Phase 7 UI work in this session. Retry elimination + semantic quality must pass first.
- Do NOT fix retries speculatively — read the actual error codes first.
- Do NOT expand G14 before confirming the current prompt fix resolved sales + engineer.
- Do NOT add new gates that are just structural variants. Every new gate must test something the vision doc's Section 6 standards require.
- Do NOT mark this session done until: 0 retries AND G14 expanded AND 5+/6 YES on all 6 fixtures.

---

## END STATE FOR THIS SESSION

- `node scripts/test-pipeline-e2e.mjs` → 0 retry messages, 6/6 gates
- `node scripts/test-g14-semantic.mjs` → 6/6 fixtures, 5+/6 YES, using new 6-question audit
- `ROADMAP_BUILD_DOC.md` → PRE-PHASE 7 DIAGNOSTIC marked DONE, retry root causes documented, semantic lessons added to TESTING LESSONS
- Ready to enter Phase 7 (UI) with confidence that the content being rendered is actually good

---

*Written: 2026-05-28 | Pre-Phase 7 session preparation*
