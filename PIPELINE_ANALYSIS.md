# Roadmap Pipeline Analysis
**Date:** 2026-05-27
**Status:** Post-Codex rebuild analysis. Documents why output is still generic despite 10-phase rebuild.

---

## Pipeline Overview

```
User types role
    → O*NET API (SOC match + tasks)
    → TaskSliders (user rates weights)
    → /api/score (risk score + skill_gap + skills_have)
    → Score/Gap screens (display only)
    → EmailGate → /api/lead
        → generateRoadmap()
            → buildRoadmapBlueprint()   [NO LLM - pure code]
            → enrichBlueprintCopy()     [1-2 OpenAI calls]
            → validateRoadmap()         [NO LLM - shape check only]
        → insertLead() + Brevo
    → RoadmapView render
```

---

## Step-by-Step Trace

### Step 1 — Role Input (browser)
User types job title. Browser calls O*NET to match SOC code and fetch tasks.

**API calls:** 1-2 (O*NET)
**Status:** Works correctly.

---

### Step 2 — Task Sliders (browser)
User adjusts task weights (high/medium/low). On submit, `buildUserWorkProfile()` runs in browser.

Produces `UserWorkProfile`:
- `raw_role_text`: typed role
- `soc_code`, `soc_title`: from O*NET match
- `role_category`, `role_archetype`: normalized
- `high_weight_tasks`, `medium_weight_tasks`, `low_weight_tasks`: split by weight
- `selected_tasks`: all tasks
- `ai_familiarity`: from UI input
- `confirmed_cluster_ids`: from skill confirmation screen

**API calls:** 0 (browser-only)
**Status:** Profile built correctly. Problem is what happens to it downstream.

---

### Step 3 — Score API (/api/score)
Computes `risk_score`, `score_band`, `skill_gap` (gaps to fill), `skills_have` (already confirmed).

Example output for real test user:
- `risk_score: 47`, `score_band: "MODERATE"`
- `skill_gap: ["C3B"]` — only 1 gap cluster
- `skills_have: ["C1A", "C2A"]` — user already has 2 clusters

**API calls:** 1 POST to /api/score
**Status:** Score computed correctly. Problem: these outputs are almost entirely ignored during roadmap generation (see Step 4b).

---

### Step 4a — buildRoadmapBlueprint (NO LLM)
**File:** `web/lib/roadmap/blueprint.mjs`

Called by `generateRoadmap()` in `roadmap-gen.ts`.

**What it does:**
1. Calls `inferCapabilityGaps(userProfile)` — keyword matches task descriptions against CAPABILITY_MATRIX
2. Sorts gaps by confidence (high/medium/low) then priority (1-4)
3. Takes top 5 gaps. If fewer than 5, duplicates last gap with `-ext` suffix
4. Builds 6 nodes: 5 from gaps + 1 hardcoded integration node
5. Each node gets 5 left + 5 right atoms from SKILL_REGISTRY

**API calls:** 0

#### Critical Bug #1 — skill_gap and skills_have are never used

In `roadmap-gen.ts` line 190:
```typescript
const profile = userProfile ?? buildProfileFromLegacyArgs(...)
```

Since `userProfile` is always passed from `/api/lead`, the legacy fallback never runs.
`buildRoadmapBlueprint(profile)` is called with only the `UserWorkProfile`.

`inferCapabilityGaps()` reads:
- `userProfile.high_weight_tasks`
- `userProfile.medium_weight_tasks`
- `userProfile.selected_tasks`

It does NOT read `skill_gap` or `skills_have` at all. These were computed by the scoring system, passed to `generateRoadmap` as separate args, and silently discarded.

**Result:** User with `skills_have=["C1A","C2A"]` gets same roadmap structure as user with zero skills. User with `skill_gap=["C3B"]` (one gap) gets same 6-node roadmap as user with 6 gaps. The scored risk assessment has no influence on what is generated.

#### Critical Bug #2 — Marketer matrix has 4 rows, needs 5 nodes

CAPABILITY_MATRIX has exactly 4 marketer rows:
- `cap-marketer-content-creation` (triggers: campaign, content, copy, social, ...)
- `cap-marketer-pipeline` (triggers: pipeline, automate, workflow, ...)
- `cap-marketer-research` (triggers: research, analyze, insight, ...)
- `cap-marketer-influencer` (triggers: influencer, ugc, persona, ...)

Marketing Manager task descriptions match all 4. So all 4 return with high/medium confidence.
Blueprint needs 5, only has 4 → duplicates gap[3] (`cap-marketer-influencer`) with `-ext` suffix.

**Result:** Node 4 = "AI Influencer and UGC Campaigns", Node 5 = "AI Influencer and UGC Campaigns Applied System".
- Same `skill_ids: ["S1.5", "S2.2"]`
- Same tools
- Same atom structure
- `one_line_desc` is identical
- Node 5 atom L1 says "First exposure: understand..." — but user already did node 4

#### Critical Bug #3 — Duplicate atom labels from underpopulated skill_ids

`cap-marketer-influencer` has only 2 skill_ids: `["S1.5", "S2.2"]`.

`buildConceptAtoms()` loops `skillIds = gap.skill_ids.slice(0, 4)`.
When `skillId` is `undefined` (positions 2 and 3), label becomes:
```
`${gap.capability.split(' ').slice(0, 3).join(' ')} Overview`
```
= `"Build AI influencer Overview"` for BOTH L3 and L4.

Similarly, `buildAppliedAtoms()` fallback label = `"Apply to Your Role"` for BOTH R3 and R4.

**Result:** Every capability with fewer than 4 skill_ids produces duplicate labels. Affects nodes 4, 5, and partially node 3.

#### Critical Bug #4 — Terminology terms are static per role

`attachTerminologyTags()` assigns the same 6 terms to every node:
```javascript
const terms = ROLE_TERMS[roleCategory] ?? ROLE_TERMS.student;
return nodes.map(node => ({ ...node, terminology_terms: terms }));
```

`appears_in_node_ids` is then set to all 6 node IDs for every term.

**Result:** "Structured output" listed as appearing in all 6 nodes including AI Influencer Persona building. "Few-shot prompting" listed for AVTV pipeline. Terms that actually appear in content (AVTV, n8n, Agentic Pipeline, HeyGen) are not in the primer at all.

---

### Step 4b — enrichBlueprintCopy (1-2 OpenAI calls)
**File:** `web/lib/llm/panel-copy.ts`

**What LLM receives:**
- Profile: role, category, top 3 high-weight task descriptions, analogy lens
- 6 node summaries with locked labels and tools
- 6 terminology terms
- 3 project checkpoints
- JSON schema to fill

**What LLM writes:**
- Per atom: `explanation`, `learner_action`, `output`
- Per checkpoint: `scenario`, `artifact_to_create`, `steps`, `done_when`, `confidence_check`
- Per analogy: `plain_meaning`, `mistake_to_avoid`, `takeaway`
- Per term: `role_example`, `analogy_hook`, `why_it_matters`

**What LLM CANNOT change (locked):**
- Node titles, skill_ids, node_kind
- Atom labels, types, orders, tools arrays, depth fields, time_est
- Analogy lens_name, lens_domain, concept, analogy_part
- Term name, plain_definition, appears_in_node_ids

**API calls:** 1 OpenAI (2 if first delta fails validation)

#### Critical Bug #5 — learner_action tool mismatch

Atom `tools` array is locked. LLM writes `learner_action` as free text. System prompt says "checkpoint steps must name specific tools from node's allowed_tools" but says nothing about matching learner_action to the atom's specific locked tool.

LLM pulls tool names from the general profile context and uses them freely in learner_action text:
- atom.tools=["Midjourney"] but learner_action says "with Claude"
- atom.tools=["Kling"] but learner_action says "using ChatGPT"
- atom.tools=["HeyGen"] but learner_action says "with Gemini"

**Result:** User is told to do action with tool X but the atom officially lists tool Y. Confusing and inconsistent.

#### Critical Bug #6 — "startup marketer" hallucination

Profile context passed to LLM:
```
Role: Marketing Managers
Category: marketer / marketer
AI familiarity: none
Top daily tasks: [O*NET task descriptions]
```

Nothing says "startup." LLM defaults to the most common 100x user persona it was trained on.
All checkpoint scenarios say "As a startup marketer..." regardless of actual user context.

#### Critical Bug #7 — L5 label/content mismatch (cannot be fixed by LLM)

In `buildConceptAtoms()`, L5 is always:
```javascript
{ label: 'Common Mistakes to Avoid', type: 'risk', ... }
```

LLM rewrites `explanation` for this atom. But the explanation field gets written as an action/application ("Apply AI insights to...") not as a risk list, because the LLM is writing in the flow of the surrounding atoms and the system prompt doesn't enforce that type='risk' atoms must list risks specifically.

---

### Step 4c — validateRoadmap (NO LLM)
**File:** `web/lib/roadmap/validate.mjs`

**What it checks:**
- 5 left + 5 right atoms per node ✓
- Atom orders sequential ✓
- Terminology primer has ≥5 terms ✓
- Project checkpoints present (2 mini + 1 final) ✓
- No empty skill_ids ✓
- No banned generic node titles ✓

**What it does NOT check:**
- Duplicate labels within same panel left_items or right_items
- learner_action referencing tool not in atom's tools array
- skills_have or skill_gap having any influence on output
- terminology terms substantively appearing in content (only checks they list node_ids)
- Node N+1 depth_reason saying "first exposure" when node N covered same capability

**Result:** Structurally valid roadmap passes validation despite semantic bugs.

---

### Step 4d — DB + Brevo
Saves roadmap to Supabase. Creates Brevo marketing contact.

**API calls:** 1 Supabase + 1 Brevo

---

## Total API Calls Per User Journey

| Step | Call | Count |
|---|---|---|
| Step 1 | O*NET SOC match + tasks | 1-2 |
| Step 3 | /api/score | 1 |
| Step 4b | OpenAI (enrichBlueprintCopy) | 1-2 |
| Step 4d | Supabase insert | 1 |
| Step 4d | Brevo | 1 |
| **Total** | | **5-7** |

---

## Root Cause Summary

### The scoring system and the roadmap system are disconnected

The scoring system computes `skill_gap` and `skills_have` (what the user is missing vs. what they know). These are displayed to the user as the "gap analysis" screen. But they **never enter the roadmap blueprint**. The blueprint runs its own keyword matching against tasks and ignores the scored gap entirely.

A user who scored `skill_gap=["C3B"]` (one gap, moderate risk) gets the same 6-node roadmap structure as a user with 6 gaps. A user with `skills_have=["C1A","C2A"]` is taught foundational content they already confirmed knowing.

### The blueprint generates a role-template, not a user-specific roadmap

- Every Marketing Manager gets the same 4 capability rows from CAPABILITY_MATRIX
- Every Marketing Manager gets the same 6 terminology terms
- The only user-specific data that enters the blueprint is task descriptions (for keyword matching) — and since all marketing task descriptions match all 4 matrix rows, even that is effectively a no-op

### The LLM layer writes copy for a broken structure it cannot fix

- Duplicate atom labels (L3=L4, R3=R4) are locked — LLM cannot rename them
- Atom tools arrays are locked — LLM writes learner_actions with different tools
- All 6 nodes get identical terminology terms — LLM personalizes examples but not coverage

---

## What Needs to Change

### Fix 1 — Feed skill_gap and skills_have into blueprint selection

`inferCapabilityGaps()` should:
- Accept `gap_cluster_ids` and `have_cluster_ids` as inputs
- Prioritize capabilities that map to gap clusters
- Skip or demote capabilities that map to already-confirmed clusters

### Fix 2 — Start roadmap at the right depth based on skills_have

User with C1A+C2A should not start at `depth_level: scan`. Blueprint should map confirmed clusters to depth index and start from there.

### Fix 3 — Expand CAPABILITY_MATRIX to ≥5 rows per role

Every role needs ≥5 distinct capability rows so the `-ext` duplicate never fires. For marketer this means adding email marketing, SEO/SEM, or analytics as a 5th row.

### Fix 4 — Pad skill_ids to 4 per capability or change atom structure

Either every capability in CAPABILITY_MATRIX needs 4 skill_ids, or `buildConceptAtoms()` needs a distinct fallback label per position (not the same "Overview" text) when fewer than 4 skill_ids exist.

### Fix 5 — Constrain learner_action to atom's locked tools

System prompt must explicitly state: "Each atom's learner_action must reference only the tool listed in that atom's tools field. The tools field is locked and shown to you in the node summary."

### Fix 6 — Derive user industry/context from profile, don't hallucinate

Either pull industry from O*NET occupation data or prompt the user. Pass it explicitly in the profile context to LLM. Remove "startup" as a default assumption.

### Fix 7 — Validate duplicate labels within panel

`validateRoadmap()` must reject any node where `left_items` or `right_items` contain duplicate `label` values.

---

## Files Involved

| File | Role |
|---|---|
| `web/app/assess/page.tsx` | UI state machine, orchestrates all screens |
| `web/app/api/score/route.ts` | Computes risk_score, skill_gap, skills_have |
| `web/app/api/lead/route.ts` | Entry point for roadmap generation |
| `web/lib/llm/roadmap-gen.ts` | Orchestrates blueprint → enrich → validate |
| `web/lib/roadmap/blueprint.mjs` | Deterministic node structure builder |
| `web/lib/roadmap/panel-blueprint.mjs` | Builds 10 atoms per node from SKILL_REGISTRY |
| `web/lib/roadmap/capability-matrix.mjs` | Keyword matrix for inferCapabilityGaps() |
| `web/lib/roadmap/canonical-ai-terms.mjs` | Static terminology terms per role |
| `web/lib/llm/panel-copy.ts` | LLM copy enrichment layer |
| `web/lib/roadmap/validate.mjs` | Shape validator (misses semantic bugs) |
| `web/lib/profile/user-work-profile.mjs` | UserWorkProfile builder |
