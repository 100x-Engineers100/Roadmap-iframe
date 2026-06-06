# 100x AI Roadmap Builder — High-Level Overview

## What It Does

Takes a professional's role, tasks, and AI exposure — and generates a
personalised 90-day AI adoption roadmap. Delivered as an interactive web UI
and a self-contained HTML file via email.

---

## Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                          INPUT                                  │
│  User Domain · Market Domain · AI Familiarity · Task Importance │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │       PROCESSING        │
              │  1. Scoring             │
              │  2. Gap Reveal          │
              │  3. Roadmap Generation  │
              └────────────┬────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                          OUTPUT                                 │
│            Roadmap UI  ·  Email  ·  Offline HTML Download       │
└─────────────────────────────────────────────────────────────────┘
```

---

## INPUT — What the User Provides

| Input | How collected | What it feeds |
|-------|--------------|---------------|
| **User Domain** — free-text role (e.g. "growth marketer at B2B SaaS") | Text field, Step 1 | O*NET SOC match → base exposure score |
| **Work Context** — startup / MNC / agency / freelance | Pill selector, Step 1 | Analogy framing, node personalisation |
| **Market Domain** — O*NET Standard Occupational Code | Auto-matched from role text | LLM exposure score (HAI + arXiv occupational data) |
| **AI Familiarity** — none / basic / intermediate / advanced | Single-select, Step 2 | Score pathway discount + node count formula |
| **Task Importance** — user's actual job tasks rated by time/weight | Sliders, Step 3 | Weighted task mix shifts final score ±20 pts |
| **Skill Clusters** — which 100x clusters user already knows | Checkbox confirm, Step 4 | Removes those nodes from roadmap; score discount −2 pts/cluster |

---

## PROCESSING

### Step 1 — Scoring (`/api/score`)

**What happens:**
- Role text → O*NET SOC lookup → `base_exposure` score (0–100)
- Task slider weights applied: tasks with higher AI exposure shift score up; lower shift it down
- AI familiarity determines pathway:
  - `none` → automation pathway (full score)
  - `basic/intermediate/advanced` → augmentation pathway (score discounted 10–30%)
- Confirmed skill clusters deduct −2 pts each (max −10)
- Final formula: `score = (base − necessity + elasticity) × adoptionMultiplier + taskAdj + familiarityAdj`

**Output:** `ai_displacement_score` (0–100) + tier label

| Score | Tier |
|-------|------|
| 0–25 | LOW |
| 26–50 | MODERATE |
| 51–75 | HIGH |
| 76–100 | CRITICAL |

---

### Step 2 — Gap Reveal + Inference (`/api/gap-inference`)

**What happens** (fires in background at Score Reveal screen):
- LLM call with: `raw_role_text`, `work_context`, `ai_familiarity`, confirmed clusters, high-weight tasks
- LLM selects + sequences 5–9 roadmap nodes from the 100x curriculum
- Each node is tagged to an **AAA phase**:
  - **Assisted** — AI helps; user triggers every time (Days 1–30)
  - **Accelerated** — user sets it up; decides when it runs (Days 31–60)
  - **Autonomous** — system triggers; user reviews output (Days 61–90)
- Node count scales with familiarity: `none` → 8 nodes, `advanced` → 6 nodes
- LLM also generates one global `journey_analogy` (3-phase metaphor tied to user's actual work context)
- Fallback if LLM fails: deterministic `AAA_PHASE_MAP` keyed by role

**Output:** 5–9 ordered nodes, each with outcome title + AAA phase + skill IDs + rationale

---

### Step 3 — Roadmap Generation (`/api/lead`)

Triggered when user submits email. Three sub-steps run in sequence:

#### 3a. Blueprint Build (deterministic)
- Gap-inference nodes expanded into full atom structure
- Each node gets 6–10 atoms (skill panels): `skill_ids.length + 1` per side
- Project nodes inserted on spine: Mini-project after node 2, second Mini at midpoint, Capstone at end
- Phase labels + journey analogy attached

#### 3b. Enrichment (LLM — `panel-copy.ts`)
- LLM writes human content for every atom:
  - `explanation`: opener + bullets + "The Twist" (exact failure mode)
  - `learner_action`: what to do, with tool named verbatim
  - `checkpoint`: scenario (role-specific situation) + done-when checklist + confidence check
- Project nodes get: scenario, build tasks, success criteria, deliverables
- One retry on structural validation failure

#### 3c. Terminology Primer (post-enrichment scan)
- Enriched atom text scanned against 73 canonical AI terms
- Only terms that actually appear in content included in glossary
- No pre-assignment — glossary is derived, not invented

#### 3d. Validate + Save
- Structural checks: no missing nodes, no empty required strings, no banned phrases
- Saved to Supabase `leads` table with full roadmap JSON

---

## OUTPUT

### 1. Roadmap UI (interactive, in-browser)

```
Spine (canvas)
  └── Node tiles (5–9 nodes + project waypoints)
        └── Click → Side panel opens
                    ├── Atom expansion map (skill pills + branch diagram)
                    ├── Explanation + learner action per atom
                    ├── Checkpoint scenario + done-when list
                    └── Global journey analogy (3-phase frame)
  └── Project nodes → Project brief sheet (scenario, tasks, criteria, deliverables)
  └── Glossary node → Term definitions (derived from roadmap content)
```

### 2. Email — Immediate + Follow-up Sequence (Resend)

- **Email 1 (immediate):** Sent right after generation. Full roadmap attached as `.html` file.
- **Email 2 + 3 (follow-ups):** Scheduled via Vercel cron (daily 04:30 UTC). Re-engagement copy.
- All jobs tracked in Supabase `email_jobs` table. Delivery status updated via Resend webhook.

### 3. Offline HTML Download (in-browser button)

- Single `.html` file, no external dependencies
- All nodes clickable, panels animate, glossary works
- Generated client-side from live roadmap state
- User can save, share, or open without internet

---

## Tech Stack (one line each)

- **Frontend:** Next.js App Router + TypeScript + CSS Modules
- **LLM:** OpenAI GPT with structured JSON output (`strict: true` schema)
- **Occupational data:** O*NET API for SOC matching; HAI + arXiv for exposure scores
- **DB:** Supabase Postgres — `leads` + `email_jobs` tables
- **Email:** Resend API + Vercel Cron + Svix webhook verification
- **Infra:** Vercel serverless (300s max on Pro for generation function)

---

## North Star

> Roadmap = confidence artifact, not curriculum.
> "I can do this. If I complete this, I will be AI-native in my role."
