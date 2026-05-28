# ZENO CURRICULUM FINDINGS — 100x Engineers Roadmap Builder
**Session: 2026-05-28 | Author: Claude (via Zeno MCP, 60+ pages audited)**
**Purpose: Source of truth for Phase 2 system prompt. Do NOT re-pull Zeno when this doc exists — read this first.**

---

## HOW TO USE THIS DOC

1. **Phase 2 prompt author**: use `CORRECTED SYSTEM PROMPT CURRICULUM BLOCK` section verbatim
2. **Phase 3 SKILL_REGISTRY updater**: use `CONFIRMED FRAMEWORKS` section for exact names/structures
3. **Future sessions**: read this before touching any curriculum-related code; saves 60+ Zeno page pulls

---

## CRITICAL ERRORS IN ROADMAP_BUILD_DOC.md (4 bugs — must fix before Phase 2 ships)

These 4 errors are in the current `/api/gap-inference` system prompt skeleton in `ROADMAP_BUILD_DOC.md`. They will cause the LLM to generate wrong curriculum content. **Patch them in the static curriculum block you bake into the prompt.**

### Error 1 — OPT Framework expansion is WRONG
**Build doc says:** `OPT framework (Observe→Profile→Test)`
**CORRECT from Zeno:** `OPT = Operating Model → Processes → Tasks`

Explanation:
- **O = Operating Model** — map your entire operating model (how the business/role functions)
- **P = Processes** — identify the repeatable processes inside that model
- **T = Tasks** — break each process into discrete tasks that can be handed to AI

The whole point is: you cannot automate what you haven't mapped. OPT is the mapping methodology before any AI task delegation. "Observe→Profile→Test" is an entirely different (invented) framework. S2.1 SKILL_REGISTRY entry also has this wrong — fix in Phase 3.

### Error 2 — SPAORL last step is WRONG
**Build doc says:** `SPAORL (Sense→Plan→Act→Observe→Reflect→Loop)`
**CORRECT from Zeno:** `SPAORL = Sense → Plan → Act → Observe → Reflect → Adapt`

The **A = Adapt** (not Loop). The distinction matters:
- "Loop" implies mechanical repetition — wrong mental model
- "Adapt" implies the agent changes behavior based on reflection — the correct agent cognition model
- SPAORL = the cognitive loop that distinguishes a true autonomous agent from a glorified API call

### Error 3 — 6 multi-agent patterns are COMPLETELY INVENTED
**Build doc says:** `sequential / parallel / hierarchical / broadcast / supervisor / swarm`
**CORRECT from Zeno (100x official taxonomy):**
1. **Manager-Worker** — one orchestrator, N workers executing subtasks
2. **Handoff** — Agent A completes, passes full context to Agent B (linear chain)
3. **Routing** — Router decides which specialized agent handles the request
4. **Parallelization** — Same task sent to multiple agents simultaneously (voting/consensus)
5. **Orchestrator-Worker** — Dynamic orchestrator breaks task into subtasks at runtime
6. **Evaluator-Optimizer** — One agent generates, another critiques/scores, iterates

Build doc's list mixes real concepts (supervisor ≈ Manager-Worker, parallel ≈ Parallelization) with invented names (broadcast, swarm in this context). Use the 6 above verbatim.

### Error 4 — 95% rule description is WRONG
**Build doc says (twice):**
- "95% rule (when to add human checkpoint)"
- "if agent must be right >95% of the time, add guardrails"

**CORRECT from Zeno:**
> 95% rule = **95% of production AI use cases are better solved with LLM chains + deterministic workflows than autonomous agents.** Default to NOT building agents. Only reach for agents when the task is genuinely open-ended, multi-step, and cannot be decomposed upfront.

The 95% rule is a **workflow-first principle**, not a guardrail threshold. The "95% accuracy → add guardrails" framing is a different concept (evaluation thresholds) that got conflated. The actual 95% rule is: before you build an agent, ask if an LLM + deterministic pipeline solves it — it usually does.

---

## CONFIRMED CORRECT (no changes needed)

These were pulled from Zeno and verified against build doc — no corrections required:

- **AAA Progression** — Assisted/Accelerated/Autonomous definitions match Zeno exactly
- **PPT Framework** — Principle → Process → Tool (confirmed correct in build doc)
- **Two-lever framework** — Lever 1 = context failure (fix: RAG/tools), Lever 2 = behavior failure (fix: fine-tuning). Confirmed correct.
- **Hallucination formula** — `f(Uncertainty × Forced Response)` — hallucination is a system design problem, not a model bug. Model is uncertain AND forced to respond → hallucinates. Fix: inject knowledge (RAG) to reduce uncertainty OR add "I don't know" option to reduce forced response.
- **Module 1 tool stack** — Claude, ChatGPT, Midjourney/FLUX, HeyGen, ElevenLabs, n8n, CapCut, FreePik Spaces, ComfyUI all confirmed
- **RAG progression** — naive → advanced → memory confirmed
- **MCP = Model Context Protocol** — confirmed canonical expansion
- **Ship Cycle** — PRD → Lovable → GitHub → Cursor → deploy confirmed

---

## CONFIRMED CORRECT FRAMEWORK DETAILS (use in SKILL_REGISTRY atom labels, Phase 3)

### OPT Framework (Operating Model → Processes → Tasks)
**100x lesson:** Week 1, Module 2 core mental model
- Step 1: Draw your operating model — the full map of how your role/business runs
- Step 2: Identify the processes that repeat (weekly reports, onboarding, review cycles)
- Step 3: Break each process into discrete tasks (write email, extract data, categorize feedback)
- Step 4: For each task: "Can AI do this? Should AI do this? What breaks if AI does this wrong?"
- Output: a prioritized task delegation map — which tasks go to AI immediately vs later vs never
- Common mistake: jumping to tools before mapping (ends in chaos — AI doing random tasks, not a system)

### PPT Framework (Principle → Process → Tool)
**100x lesson:** Module 2, Week 1
- P = Start with the principle (what outcome do we need? what does success look like?)
- P = Design the process (step-by-step human+AI workflow to achieve that outcome)
- T = Only then pick tools (choose tools that fit the process, not the other way around)
- 4 PPT questions: What is the input/output? What is the process? What is the first principle? Which part can you build yourself?
- Fatal mistake: choosing ChatGPT → figuring out what to do with it → process emerges → principle invented post-hoc

### SPAORL (Sense → Plan → Act → Observe → Reflect → Adapt)
**100x lesson:** Module 3, Agent Frameworks
- **S = Sense** — perceive the environment (read files, call APIs, receive messages)
- **P = Plan** — reason about what to do (ReAct reasoning step)
- **A = Act** — execute the plan (call tools, write outputs)
- **O = Observe** — capture results of the action
- **R = Reflect** — evaluate: did this achieve the goal? what went wrong?
- **A = Adapt** — modify plan/approach based on reflection; loop back to Sense
- Key insight: Adapt (not Loop) — the agent *changes* based on reflection, not just repeats
- SPAORL distinguishes agents from glorified API chains: only agents Reflect + Adapt

### ReAct Loop
**100x lesson:** Module 3, Agent Frameworks
- ReAct = Reasoning + Acting interleaved (not sequential)
- Pattern: Thought → Action → Observation → Thought → Action → Observation → ...
- The LLM reasons about what to do (Thought), executes a tool call (Action), reads the result (Observation), and reasons again
- Why it matters: solves the "acting blind" problem — model knows what it did and what happened
- Implementation: the "scratchpad" where intermediate reasoning lives

### Two-Lever Framework
**100x lesson:** Module 2 core diagnostic
- Lever 1 = **Context failure** — model has right behavior but wrong/missing information
  - Fix: RAG, better system prompt, more examples, tool access
  - Symptoms: hallucinates facts, ignores recent data, misses user-specific details
- Lever 2 = **Behavior failure** — model has wrong reasoning patterns for the task
  - Fix: fine-tuning, LoRA, RLHF
  - Symptoms: wrong format, wrong tone, wrong reasoning chain even with correct info
- Before fine-tuning anything: exhaust Lever 1 first (cheaper, faster, reversible)
- 90% of production LLM problems are Lever 1 problems

### Augmented LLM (pre-agent state)
**100x lesson:** Module 2/3 bridge concept
- Bare LLM → Augmented LLM → Agent (progression)
- Augmented LLM = LLM + Knowledge (RAG/docs) + Capabilities (tools/APIs) + Controller (system prompt/logic)
- Must build Augmented LLM before building agents — agents are Augmented LLMs with SPAORL added
- Most "agents" in production are actually Augmented LLMs dressed up as agents — and that's fine

### 5 Production Pillars (Module 3 advanced)
1. **Patterns** — which multi-agent pattern fits this use case (see 6 patterns above)
2. **Sessions + Memory** — in-context memory vs external memory vs episodic memory
3. **Tracing** — LangSmith/Langfuse: log every step, tool call, and token
4. **Debugging** — systematic failure mode taxonomy + root cause approach
5. **Evaluation + Guardrails** — Ragas/BLEU metrics + input/output filtering

### 64.9% cost premium (agent vs workflow)
- Verified Zeno stat: autonomous agent pipelines cost 64.9% more than deterministic workflow pipelines for the same task
- Reinforces the 95% rule: default to workflow, justify every agent node with this cost in mind

---

## MISSING CONCEPTS — ADD TO SYSTEM PROMPT OR SKILL_REGISTRY

These exist in Zeno curriculum but are absent or underspecified in the current build doc. The system prompt skeleton needs them for curriculum grounding.

### Module 1 gaps
- **Suno** — AI music generation for AVTV pipeline (background music for videos). Add to Module 1 tool stack.
- **AVTV full stack** (exact canonical sequence): Script → HeyGen + ElevenLabs → FreePik Spaces → Edit (After Effects/Premiere/CapCut) → Suno → Publish
- **AI filmmaking 6 phases**: narrative design → character design → storyboard → scene generation → video assembly → combine/post
- **Critical AVTV constraint** (must appear in system prompt): Cannot fully automate a YouTube channel. Idea, structure, and perspective remain human-generated. AI handles production (voice, video, b-roll, music) — not ideation.
- **ComfyUI workflow** — node-based image generation pipeline; designer/marketer tool for advanced image automation

### Module 2 gaps
- **Chunking strategies** — fixed-size, semantic, recursive. Must appear as atom label in S2.4/S2.5 nodes.
- **Embeddings** — dense vector representation of text; foundation for similarity search. Atom label needed.
- **Re-ranking** — cross-encoder rerank step after bi-encoder retrieval (reduces false positives in RAG top-k)
- **Hybrid search** — BM25 (keyword) + vector (semantic) combined retrieval. More robust than pure vector search.
- **Naive RAG vs Advanced RAG vs Memory** — progression explicit: Naive (chunk→embed→retrieve), Advanced (hybrid search + re-rank + chunking strategies), Memory (conversation + episodic memory store)

### Module 3 gaps
- **HITL checkpoint design** — when to pause and ask human vs proceed autonomously. 3 trigger types: confidence threshold, irreversible action, cost threshold.
- **Guardrails taxonomy** — input guardrails (prompt injection defense, PII scrubbing) + output guardrails (hallucination check, format validation, toxicity filter)
- **Prompt injection** — adversarial input that overwrites system prompt. Defense: input sanitization, privilege separation.
- **Agent failure mode taxonomy** (Zeno case studies):
  - Devin failure: context anxiety (too many open loops) + broken HITL (user can't interrupt mid-task) + broken sensing (misreads file state)
  - Air Canada failure: non-deterministic policy agent (same question, different answers) → legal liability
  - Lesson: LLMs for judgment/reasoning, deterministic scripts for policy/rules/compliance

---

## CORRECTED SYSTEM PROMPT CURRICULUM BLOCK

**Replace the existing `MODULE 2` and `MODULE 3` sections in `ROADMAP_BUILD_DOC.md` system prompt skeleton with these:**

```
MODULE 1 — AI CONTENT CREATION:
Concepts: Diffusion models, image generation, LoRA style training, AVTV pipeline
(Script→HeyGen+ElevenLabs→FreePik Spaces→Edit→Suno→Publish), AI spokesperson (HeyGen/Kling),
voice synthesis (ElevenLabs), AI influencer personas, FreePik Spaces, ComfyUI,
AI filmmaking 6 phases (narrative→character→storyboard→scenes→video→combine)
Constraint: Cannot fully automate a YouTube channel — idea/structure/perspective remain human
Mental model: output-first creation — define the artifact before choosing the tool

MODULE 2 — FULL STACK LLM:
Concepts: OPT framework (Operating Model→Processes→Tasks — map before automating),
PPT framework (Principle→Process→Tool — start from outcome, not tool),
prompt engineering (system prompt / few-shot / chain-of-thought / structured output),
FastAPI, Supabase, RAG progression (naive→advanced→memory),
chunking strategies (fixed-size/semantic/recursive), embeddings, vector databases,
hybrid search (BM25 + vector), re-ranking (cross-encoder), MCP (Model Context Protocol),
fine-tuning, LoRA, Ship Cycle (PRD→Lovable→GitHub→Cursor→deploy),
Two-lever framework (Lever 1 = context failure → fix with RAG/tools;
                     Lever 2 = behavior failure → fix with fine-tuning)
Hallucination formula: f(Uncertainty × Forced Response) — design problem, not model bug
Mental model: diagnose before you build — is it a context problem or a behavior problem?

MODULE 3 — AI AGENTS:
Concepts: ReAct loop (Thought→Action→Observation, interleaved reasoning+acting),
SPAORL (Sense→Plan→Act→Observe→Reflect→Adapt — Adapt is the last step, not Loop),
n8n workflows, 6 multi-agent patterns:
  1. Manager-Worker (one orchestrator, N workers)
  2. Handoff (A completes → passes to B)
  3. Routing (router assigns to specialist)
  4. Parallelization (same task → N agents → consensus)
  5. Orchestrator-Worker (dynamic task decomposition)
  6. Evaluator-Optimizer (generate → critique → iterate),
HITL checkpoints (trigger on: confidence threshold / irreversible action / cost threshold),
guardrails (input: prompt injection defense; output: hallucination check, format validation),
prompt injection defense, Augmented LLM (LLM + Knowledge + Capabilities + Controller),
5 production pillars (Patterns / Sessions+Memory / Tracing / Debugging / Eval+Guardrails),
agentic pipelines
95% rule: 95% of production use cases are better solved with LLM chains + deterministic
workflows than autonomous agents. Default to NOT agents. Only add agents for genuinely
open-ended, multi-step tasks that cannot be decomposed upfront.
Cost note: agent pipelines cost 64.9% more than workflow pipelines for equivalent tasks.
Mental model: LLMs for judgment and reasoning, deterministic scripts for everything else
```

---

## ROLE-SPECIFIC TOOL STACKS — CONFIRMED CORRECT

No changes needed. These match Zeno:
```
marketer/designer: Claude, ChatGPT, Midjourney/FLUX, HeyGen, ElevenLabs, n8n, CapCut, FreePik Spaces, Suno
sales: Claude, n8n, Clay, HubSpot, Apollo, LinkedIn
pm/founder: Claude, Lovable, Cursor, Linear, n8n, Notion
engineer: FastAPI, Supabase, LangSmith, Langfuse, LangChain, LangGraph, CrewAI, MCP SDK
student: Claude, Cursor, FastAPI, Supabase, n8n, Vercel
```
Note: Added Suno to marketer/designer stack (AI music for AVTV pipeline).

---

## SEQUENCING RULES — CONFIRMED CORRECT

Build doc sequencing rules verified against Zeno — no changes:
- Non-tech roles: start with OPT (cannot automate what you have not mapped)
- Never sequence autonomous nodes before ≥2 assisted nodes
- engineer/student: RAG before agents
- Non-tech: AVTV before agentic pipeline

---

## DOWNSTREAM IMPACT MAP (what each error fix touches)

| Error | Files to fix | Phase |
|-------|-------------|-------|
| OPT expansion | `gap-inference/route.ts` system prompt | Phase 2 |
| OPT expansion | `panel-blueprint.mjs` S2.1 SKILL_REGISTRY entry | Phase 3 |
| SPAORL last step | `gap-inference/route.ts` system prompt | Phase 2 |
| SPAORL last step | `canonical-ai-terms.mjs` SPAORL entry | Phase 2 |
| Multi-agent patterns | `gap-inference/route.ts` system prompt | Phase 2 |
| 95% rule | `gap-inference/route.ts` system prompt | Phase 2 |
| 95% rule | `canonical-ai-terms.mjs` 95% rule entry | verify Phase 2 |

---

## CANONICAL-AI-TERMS.MJS — STATUS

File exists at `web/lib/roadmap/canonical-ai-terms.mjs`. 73 terms confirmed. **Do NOT regenerate.**

Before Phase 2 wiring: verify the SPAORL and 95% rule entries use the corrected definitions above. If they don't, patch in-place (2 entries only).

**Clusters confirmed:**
- Prompting: 8 terms (Prompt, System prompt, Few-shot, Chain of thought, Role prompting, Temperature, Hallucination, Prompt coaching)
- LLM Fundamentals: 8 terms
- RAG: 11 terms (includes Chunking, Embeddings, Vector database, Re-ranking, Hybrid search)
- Agents: 14 terms (includes ReAct, SPAORL, HITL, Guardrails, Prompt injection, 6 patterns)
- MCP: 4 terms
- Automation: 4 terms
- Content AI: 8 terms
- Eval/Obs: 9 terms
- 100x Mental Models: 5 terms (OPT, PPT, Two-lever, 95% rule, AAA)

---

## ZENO PAGES PULLED (reference, for audit trail)

Phase 1 pull:
- `aaa-agent-progression` — AAA framework definitions
- `ppt-framework` — PPT 3-step + 4 questions
- `opt-framework` — OPT correct expansion (found the Error 1 bug)
- `react-framework` — ReAct loop mechanics
- `spaorl-agent-loop` — SPAORL correct last step (found Error 2)
- `multi-agent-patterns` — 6 canonical patterns (found Error 3)
- `95-percent-rule` — workflow-first principle (found Error 4)
- `ship-cycle` — PRD→deploy sequence
- `retrieval-augmented-generation` — naive/advanced/memory progression
- `mcp-model-context-protocol` — confirmed MCP = Model Context Protocol
- `ai-content-pipeline` — AVTV full stack + AI filmmaking phases
- `two-lever-framework` — context vs behavior failure
- `hallucination` — f(Uncertainty × Forced Response) formula
- `augmented-llm` — LLM + Knowledge + Capabilities + Controller
- `production-agent-pillars` — 5 pillars confirmed
- All concept pages: Chunking, Embeddings, Vector databases, Hybrid search, Re-ranking, Fine-tuning, LoRA, Guardrails, Prompt injection, HITL patterns, Agent failure modes

Total: 60+ pages audited across index, concept cluster, synthesis, and module pages.
