# AI Displacement Risk Calculator + Roadmap Generator

**Product:** 100x School of Applied AI — Lead Magnet Tool
**Version:** 2.0
**Last Updated:** 2026-05-22

---

## What This Is

A web tool that computes an academic-grade AI displacement risk score for any job title and generates a personalised 90-day AI learning roadmap. Users trade their email to unlock the roadmap. Every score traces to peer-reviewed research published 2023–2026.

**Why it works as a lead magnet:** Career-anxious professionals get a specific, credible score for their exact role — not generic "AI will take jobs" content. The roadmap shows a concrete path out. High intent, high conversion.

---

## Business Objectives

- Convert career-anxious professionals into 100x enrolled students
- Capture high-intent leads with full context: role, risk level, skill gaps
- Demonstrate curriculum depth before any sales interaction
- Build a role → risk → skill gap dataset for future product decisions

---

## KPI Targets (8–12 weeks post-launch)

| Metric | Target |
|--------|--------|
| Email submissions | 500+ leads |
| Completion rate (start → email gate) | > 40% |
| Roadmap unlock rate | > 60% |
| CTA clicks to 100xengineers.com | Track weekly |

---

---

## High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER (Vercel / Next.js)                │
│                                                                         │
│  Screen 1        Screen 2        Screen 3        Screen 4              │
│  [Landing]  ──►  [Job Input] ──► [Sliders]  ──► [Calculating]          │
│                      │               │                │                 │
│                  free text       8 task sliders    5s wait              │
│                      │           Low/Med/High          │                │
│                      │               │                 ▼               │
│  Screen 7        Screen 6        Screen 5       Score computed          │
│  [Email Gate]◄── [Skill Gap] ◄── [Score]  ◄────────────                │
│       │           2-3 GREEN        0-100                                │
│       │           5-6 RED          CRITICAL/HIGH                        │
│       │                            /MOD/LOW                             │
│       ▼                                                                 │
│  Screen 8                                                               │
│  [Roadmap]  ─── 3-step SVG spine, clickable nodes, side panel          │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                        │
         │ POST /api/soc-match│ POST /api/score        │ POST /api/lead
         │                    │                        │
         ▼                    ▼                        ▼
┌─────────────────── NEXT.JS API ROUTES (Vercel server) ─────────────────┐
│                                                                         │
│  /api/soc-match          /api/score              /api/lead              │
│  ─────────────           ──────────              ──────────             │
│  Input: free text        Input: SOC code +       Input: name, email,    │
│  Output: SOC code        task weights            full assessment state  │
│  + confidence            Output: 0-100 score,    Output: lead_id,       │
│                          band, skill gap          roadmap JSON           │
└──────────┬───────────────────────────────────────┬──────────────────────┘
           │                                       │
     ┌─────┘                                 ┌─────┘
     ▼                                       ▼
┌──────────────────┐           ┌─────────────────────────────────────────┐
│  CLAUDE API      │           │  SCORE ENGINE (/lib/score/calculator.ts)│
│  claude-sonnet   │           │                                         │
│  4-6             │           │  Factor 1: dv_beta × 100                │
│                  │           │  Source: Eloundou 2023 occ_level.csv    │
│  Call 1:         │           │                                         │
│  SOC match       │           │  Factor 2: − Human Necessity Discount   │
│  (temp 0,        │           │  Source: OpenAI Jobs Framework Apr 2026 │
│  300 tokens)     │           │                                         │
│                  │           │  Factor 3: ± Demand Elasticity Adj      │
│  Call 2:         │           │  Source: OpenAI Apr 2026 + WEF 2025    │
│  Roadmap gen     │           │                                         │
│  (temp 0.3,      │           │  Factor 4: × Adoption Multiplier        │
│  2000 tokens)    │           │  Source: Anthropic AEI + HAI 2026      │
│                  │           │                                         │
│  ~$0.007/session │           │  ± Task Adjustment (±20pts)             │
└──────────────────┘           │  Source: WEF BOX 3.1 (2800 skills)     │
                               │                                         │
                               │  + India Calibration (optional)         │
                               │  Source: WEF FoJ 2025 industry rates    │
                               └─────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  O*NET v2 API (api-v2.onetcenter.org)  │  SUPABASE (Postgres, Sydney)   │
│  ──────────────────────────────────── │  ──────────────────────────────│
│  GET /occupations/{soc}/details/tasks  │  leads          (write/session)│
│  Returns: task text + importance score │  curriculum_skills (read)      │
│  Used: populate sliders + task adj     │  curriculum_snapshots           │
│  1 call/session, free tier             │                                │
│                                        │  Weekly cron: Supabase Edge Fn │
│                                        │  sync-curriculum ← Zeno Wiki   │
└────────────────────────────────────────┴────────────────────────────────┘
```

---

### Score Formula (plain English)

```
STEP 1  base  = dv_beta × 100              ← how exposed this occupation is to LLMs (Eloundou 2023)
STEP 2  adj1  = base − necessity_discount  ← subtract if role legally/relationally requires human (OpenAI 2026)
STEP 3  adj2  = adj1 + elasticity_delta    ← add/subtract if AI expands or contracts role demand (OpenAI 2026)
STEP 4  prior = adj2 × adoption_multiplier ← scale by how much AI is ACTUALLY being used in this role (AEI + HAI)
STEP 5  task  = slider_weighted_exposure   ← user's sliders personalise ±20 pts (WEF BOX 3.1 coefficients)
STEP 6  score = clamp(prior + task, 0–100) + india_sector_delta
```

---

### Data Flow: Input → Score → Roadmap

```
"Product Manager, Bangalore fintech"
        │
        ▼
  LLM SOC match ──► 11-9199.00 (Managers, All Other)  confidence: 0.91
        │
        ▼
  O*NET fetch ──► 8 real tasks for 11-9199.00
        │
        ▼
  User sets sliders (e.g. "Strategic planning" = HIGH, "Data entry" = LOW)
        │
        ▼
  Score engine:
    base         =  78.0   (dv_beta 0.780 × 100)
    − necessity  =   0     (PM: no regulatory/relational anchor)
    + elasticity =  −3     (PM elastic: cheaper software → more PMs needed)
    × multiplier =  1.20×  (Computer/Math = 40% Claude usage, AEI confirmed)
    prior        =  90.0
    + task adj   =  −4     (strategic HIGH = protective, routine LOW = less exposure)
    final        =  86  →  CRITICAL band
        │
        ▼
  Skill gap: [S2.1, S2.4 GREEN] [S2.7, S3.1, S3.2, S3.4 RED]
        │
        ▼
  Email submitted → LLM generates roadmap → stored in Supabase → rendered Screen 8
```

---

# INPUT → PROCESSING → OUTPUT

---

## INPUT

### User-provided

| Input | Screen | Format |
|-------|--------|--------|
| Job description | Screen 2 | Free text — "Product Manager at a fintech startup in Mumbai" |
| Task time allocation | Screen 3 | 8 sliders × 3 stops (Low / Med / High) |
| Name + email | Screen 7 | Text fields |

### System-provided (no user action)

| Input | Source | Purpose |
|-------|--------|---------|
| O*NET task list | O*NET v2 API — live per session | Populate sliders with real occupation tasks |
| Curriculum skills | Supabase `curriculum_skills` table | Skill gap inference + roadmap generation |
| Score constants | Hardcoded from research papers | Base risk score calculation |

---

## PROCESSING

### Step 1 — SOC Matching (Free Text → Occupation Code)

**Problem:** Users type informal text. Need a standardised SOC code to look up research data.

**Solution:**
- User input → LLM (claude-sonnet-4-6) with strict prompt → returns O*NET SOC code + confidence
- All returned codes validated against O*NET API — hallucinated codes silently dropped
- From SOC title → heuristic infers `role_category`: pm / designer / marketer / sales / engineer / student
- `role_category` drives module selection and skill gap logic downstream

**Why LLM, not keyword search:** O*NET keyword search fails on "I handle growth at a Series B" or "I'm a content person at a media house." LLM handles colloquial, Indian, and startup-specific descriptions.

**Fallback:** If LLM fails or returns no valid codes → manual SOC entry shown. Never crashes.

---

### Step 2 — O*NET Task Fetch

- `GET https://api-v2.onetcenter.org/online/occupations/{soc}/details/tasks`
- Auth: `X-API-Key` header
- Returns: task text + importance score (1–5)
- Up to 8 tasks surfaced on sliders screen, pre-weighted by importance
- If API fails → error + retry shown. No crash, no empty state.

---

### Step 3 — Risk Score Engine (4-Factor Composite Model)

**Why not Frey & Osborne 2013 alone:**
F&O gives Marketing Managers 1.4% automation probability — written pre-LLM, entirely wrong for 2026. The OpenAI Jobs Transition Framework (April 2026) explicitly states single-dimension exposure is "too blunt." LLMs broke F&O's creative and social bottleneck assumptions.

**Formula:**
```
priorScore = (base_score − human_necessity_discount + demand_elasticity_adj) × adoption_multiplier
finalScore = clamp(priorScore + task_adjustment, 0, 100) + india_calibration
```

All 4 factors sourced from 2023–2026 research. F&O 2013 retained only as a fallback lookup for manual/routine roles where base LLM exposure data is absent.

---

#### Factor 1 — LLM Task Exposure (Base Score)

**Source:** Eloundou et al. 2023, *Science* — "GPTs are GPTs" ([doi.org/10.1126/science.adj0998](https://doi.org/10.1126/science.adj0998))

- Uses `dv_beta` column from `occ_level.csv` (github.com/openai/GPTs-are-GPTs)
- `dv_beta` = LLM exposure WITH tools (GPT + plugins). NOT `human_beta` (bare LLM, pre-2024 baseline)
- The dv_beta vs human_beta gap for Software Developers: **0.868 vs 0.447** — 42-point difference. Using the wrong column produces systematically underestimated scores for engineering roles.
- 800+ SOC codes covered. Fallback: F&O 2013 occupation probabilities (702 roles) → role category average (last resort, labelled "estimate" in UI)

**Confirmed base values:**

| Role | SOC | dv_beta | base (×100) |
|------|-----|---------|-------------|
| Software Developer | 15-1252.00 | 0.868 | 86.8 |
| Marketing Manager | 11-2021.00 | 0.500 | 50.0 |
| Product Manager | 11-9199.00 | ~0.780 | ~78.0 |
| Graphic Designer | 27-1024.00 | ~0.720 | ~72.0 |

*Remaining SOC codes populated from CSV at build time. Phase 2 blocked if any test-role SOC missing.*

---

#### Factor 2 — Human Necessity Discount

**Source:** OpenAI — "AI and the Labor Market: The Jobs Transition Framework" (April 2026) ([openai.com](https://openai.com))

- Some roles have irreducible human presence requirements that create a ceiling on displacement
- 3 categories: Regulatory/Accountability (−20 pts), Relational (−10 pts), Physical (−15 pts)
- Applied to our 6 roles:

| Role | Discount | Reason |
|------|----------|--------|
| PM | 0 | No regulatory/relational anchor |
| Designer | 0 | WEF 2025 confirms designers declining — no protection applies |
| Marketer | 0 | Performance marketing = fully quantified output, no relational anchor |
| Sales | −5 pts | Partial: consultative selling = relational (not full −10) |
| Engineer | 0 | Technical expertise ≠ human necessity per this framework |
| Student | 0 | No role-specific protection |

---

#### Factor 3 — Demand Elasticity Adjustment

**Source:** OpenAI Jobs Transition Framework (April 2026), Figure 6
**Designer override source:** WEF Future of Jobs 2025 — 1,000+ employer survey ([weforum.org](https://weforum.org))

- When AI makes output cheaper, does demand for the role *expand* or *contract*?
- Elastic roles (engineers, PMs): cheaper output → more shipped → role demand grows → score decreases
- Inelastic (sales, admin): output price drop doesn't expand demand → no protection

**Designer correction:** OpenAI elasticity theory predicts designers are protected. WEF 2025 employer survey data directly contradicts — Graphic Designers are among the 15 fastest-declining occupations by 2030. Observed employer reality overrides demand-side theory.

| Role | Adjustment | Direction |
|------|-----------|-----------|
| PM | −3 pts | Elastic: more software shipped |
| Designer | +3 pts | WEF override: fastest-declining employer data |
| Marketer | −4 pts | Elastic: cheaper ad creation → more campaigns |
| Sales | 0 | Inelastic: quota-bound, not output-price-bound |
| Engineer | −8 pts | Highly elastic: cheaper code → more software → engineer demand grows |
| Student | 0 | No signal |

---

#### Factor 4 — Observed Adoption Multiplier

**Source:** Anthropic Economic Index Feb 2026 — Massenkoff et al. ([huggingface.co/datasets/Anthropic/EconomicIndex](https://huggingface.co/datasets/Anthropic/EconomicIndex))
**Confirmation:** Stanford HAI AI Index 2026, Chapter 4, Figure 4.3.13 ([aiindex.stanford.edu](https://aiindex.stanford.edu))

- Gap between theoretical exposure (Factor 1) and actual observed AI usage per occupation
- AEI measures real Claude.ai usage by O*NET task category. Computer/Mathematical occupations = **40% of all Claude usage** — far above their workforce share
- Engineers and PMs are being exposed faster than theory predicts
- HAI 2026 empirically confirms: entry-level software developers (22–25) saw **−20% employment** in 2024. SWE-bench solve rate went from 60% → ~100% in one year — capability overhang realised.
- Arts/Design: declining Claude task share, consistent with WEF employer data

| Role | Multiplier | Source basis |
|------|-----------|-------------|
| PM | 1.20× | Business/Financial Operations = high AEI Claude exposure |
| Designer | 0.90× | Arts/Design declining Claude share + WEF fastest-declining |
| Marketer | 1.10× | WEF BOX 3.1: marketing/media has HIGH GenAI substitution capacity |
| Sales | 0.95× | CRM-centric, lower tech adoption, partial relational barrier |
| Engineer | 1.20× | Computer/Math = 40% Claude usage; HAI −20% employment confirmed |
| Student | 0.90× | Education context, not professional deployment |

---

#### Pre-Task Score by Role (expected ranges, all-medium task weights)

| Role | Pre-task Score | Band | Research confirmation |
|------|---------------|------|-----------------------|
| PM | 88–96 | CRITICAL | HAI 2026: 1 in 3 orgs expect management function reductions |
| Designer | 68–78 | HIGH | WEF 2025: Graphic Designers top-15 fastest-declining by 2030 |
| Marketer | 48–54 | MODERATE | WEF BOX 3.1: marketing/media = moderate-high GenAI substitution |
| Sales | 47–55 | MODERATE | Relational barrier + inelastic demand provides partial protection |
| Engineer | 90–96 | CRITICAL | HAI 2026: −20% entry-level employment; SWE-bench saturation |
| Student | 52–58 | MODERATE | Broad average, lower realised exposure context |

---

#### Task Weight Adjustment (Slider Input → ±20 pts)

**Source:** WEF Future of Jobs 2025, BOX 3.1 — GPT-4o analysis of 2,800 granular skills (August 2024)

The base score = average for all people in that occupation. Sliders personalise it based on how the user actually spends their time.

**How it works:**
1. Each O*NET task text → keyword matcher → one of 8 categories
2. Each category has a GenAI substitution exposure score (from WEF BOX 3.1)
3. Task exposure centred on 0.5 so neutral tasks don't shift score
4. `rawAdj = (exposure − 0.5) × importance × weightMultiplier`
5. `weightMultiplier` = { low: 0.5, medium: 1.0, high: 1.5 }
6. All rawAdj values summed → normalised to [−20, +20]

**Task category exposure values (WEF BOX 3.1):**

| Category | Exposure | GenAI substitution capacity |
|----------|----------|-----------------------------|
| routine_cognitive | 0.82 | HIGH — data mining, ML applications |
| routine_communication | 0.78 | HIGH — reading, writing, mathematics |
| analytical | 0.45 | MODERATE — systems thinking |
| strategic | 0.30 | MODERATE-LOW — analytical thinking |
| creative | 0.12 | LOW — nuanced judgment required |
| social | 0.05 | VERY LOW — human interaction, empathy |
| physical_nonroutine | 0.02 | ZERO — manual dexterity, no digital substitute |
| supervision | 0.25 | MODERATE-LOW — leadership, talent management |

**Example:** PM who marks "Build business strategy" (strategic, 0.30) as HIGH and "Prepare standard reports" (routine_communication, 0.78) as LOW → score drops below average PM baseline.

---

#### India Calibration (Optional Layer)

**Source:** WEF Future of Jobs 2025 — industry automation rates + India GenAI adoption chapter

Applied if sector is detected from user input. Clearly labelled "India-adjusted estimate" in UI.

| Sector | Delta | WEF 2025 basis |
|--------|-------|----------------|
| IT services / BPO | +10 | Telecom/IT 96% automation rate; India leads in corporate GenAI enrollment |
| Insurance / BFSI | +10 | Insurance 97%, Financial Services 100% human-task automation by 2030 |
| Banking | +8 | Financial services 100% + India fintech acceleration |
| Government / admin | −12 | Government 59% + India manual processes + slow e-governance |
| Manufacturing | −5 | Advanced manufacturing 74% AI adoption (faster than old estimate) |
| Healthcare | −10 | Medical/Healthcare only 54% — augmentation dominates, relational necessity |
| Education | −8 | Teaching/mentoring: very low GenAI substitution (WEF BOX 3.1) |

---

#### Score Bands

| Band | Range | Meaning |
|------|-------|---------|
| LOW | 0–35 | Role largely resilient to current AI capabilities |
| MODERATE | 36–60 | Significant exposure — reskilling recommended |
| HIGH | 61–80 | High substitution risk within 3–5 years |
| CRITICAL | 81–100 | Core tasks directly replaceable by current LLMs |

---

### Step 4 — Skill Gap Inference

**Problem:** 30 AI skills across 3 modules. Which does this user already have transferable foundations for? Determined without a quiz — purely from role category.

**Logic (Role-Adjacent Heuristic):**
- Every curriculum skill has: `roles` (relevant to) + `roles_adjacent` (has transferable foundation)
- GREEN = skill is in `roles_adjacent` for this user's role category
- RED = skill is in `roles` but NOT `roles_adjacent` → genuine gap
- Returns max 8 skills (2–3 green + 5–6 red), ordered by curriculum sequence

**Why heuristic, not quiz:** A micro-assessment adds 2–3 min friction before the email gate. Heuristic achieves 80%+ accuracy with zero added screens.

**Flight plan:** If heuristic wrong for 2+ test users in a role → add "Which tools do you use?" micro-screen.

---

### Step 5 — Lead Capture + Roadmap Generation

**Trigger:** User submits name + email.

**Two parallel operations:**

**A — Store lead in Supabase:**
- SOC code, title, role category
- Risk score, band, India-adjusted flag, sector
- Task weights (per-task Low/Med/High JSON)
- Green + red skill IDs
- Generated roadmap JSON
- Email status: `pending` (Brevo post-launch)

**B — Generate roadmap via LLM:**
- Input: SOC title, role category, risk score, red skill IDs, full curriculum skill list
- Output: 3-step JSON roadmap (Days 1–30, 31–60, 61–90)
- Rules: plain English node names (no RAG/MCP/LLM/API as titles), step 3 must include capstone project, each node has a role-specific analogy
- Temperature: 0.3

**Fallback:** LLM call fails → pre-written static roadmap per role category. Lead still saved. Never empty state.

---

### Step 6 — Roadmap Visualisation

- SVG spine: curving path, nodes alternating left-right, 3 step sections
- Checkpoint flags after every 2–3 nodes
- Glossary node: all technical terms in plain English
- Click any node → side panel (desktop: Sheet, mobile: Drawer)
- Sticky top bar: "LEARN HOW 100X TRAINS THIS →" → 100xengineers.com

---

## System Architecture

```
USER BROWSER (Next.js, Vercel)
│
├── /app/page.tsx                   Screen 1: Landing
├── /app/assess/page.tsx            Screens 2–7: Multi-step (useReducer state machine)
└── /app/roadmap/page.tsx           Screen 8: Roadmap viewer
│
│   All state: AssessmentState (useReducer)
│   Step transitions: 1→2→3→4→5→6→7→8
│
│   ▼ HTTP (Next.js API routes, server-side only)
│
├── POST /api/soc-match             Free text → SOC code (LLM)
├── GET  /api/onet-tasks            SOC code → task list (O*NET API)
├── POST /api/score                 Tasks + weights → risk score + skill gap
└── POST /api/lead                  Lead insert + roadmap generation (LLM)
│
│   ▼ External calls (server-side only — API keys never exposed to browser)
│
├── Claude API (claude-sonnet-4-6)  2 calls/session: SOC match + roadmap gen
├── O*NET v2 API                    1 call/session: task list for SOC code
└── Supabase (Postgres, Sydney)     1 write/session: full lead row
      ├── leads
      ├── curriculum_skills
      └── curriculum_snapshots

      ▲
      │ Weekly cron (Supabase Edge Function)
      sync-curriculum
      │
      ▼
ZENO WIKI (100x internal curriculum)
      Extracts → validates → upserts into curriculum_skills
```

**Architecture rules (enforced project-wide):**
- LLM calls: `/lib/llm/` only — never instantiate client in components
- DB queries: `/lib/db/` only — never import Supabase client in components
- O*NET calls: `/lib/api/onet.ts` — single client, single auth config
- Types: `/types/index.ts` — imported everywhere, defined nowhere else
- No `any` types in TypeScript
- RLS on all Supabase tables — service role only for leads, public read for curriculum

---

## Curriculum: 30 Skills, 3 Modules

| Module | Focus | Skills |
|--------|-------|--------|
| M1 — AI Content Creation | Image gen, video avatars, content pipelines | 8 |
| M2 — Full Stack LLM | Prompt engineering, RAG, fine-tuning, tool calling, vibe coding | 11 |
| M3 — AI Agents & Automation | n8n workflows, multi-agent systems, guardrails, LLM eval | 6 |

All 6 roles receive M3. Automation is the universal value prop — every role has repetitive workflows.

| Role | Primary modules |
|------|----------------|
| PM | M2 + M3 |
| Designer | M1 + M3 |
| Marketer | M1 + M3 |
| Sales | M1 + M3 |
| Engineer | M2 + M3 |
| Student | M1 + M2 + M3 |

---

## OUTPUT

### Screen 5 — Risk Score
- Score 0–100 with animated count-up (2s)
- Band badge: LOW / MODERATE / HIGH / CRITICAL with colour coding
- Stacked bar: exposed portion (band colour) + resilient portion
- 2-line role-specific explanation

### Screen 6 — Skill Gap View
- GREEN rows (2–3): transferable foundations — "You're closer than you think"
- RED rows (5–6): genuine gaps — "LEARN THIS" badge
- Ordered by curriculum sequence, green rows first

*Product narrative validated by NBER w31161 (Brynjolfsson et al. 2023): AI-assisted tools produced 14% average productivity gain and 34% gain for low-skill workers — AI helps the bottom of the distribution most.*

### Screen 8 — 90-Day Roadmap
- Step 1 (Days 1–30): AI operator foundation
- Step 2 (Days 31–60): Redesign role with AI leverage
- Step 3 (Days 61–90): Signal new identity + capstone project
- Every node: description, analogy, depth indicator
- Glossary: all terms defined in plain English
- CTA → 100xengineers.com

### Internal — Supabase Lead Row
- Full assessment state: role, score, task weights, skill gap, roadmap JSON
- Schema ready for Brevo email sequence (post-launch)
- PostHog events: `roadmap_viewed`, `node_opened`, `cta_clicked` (post-launch)

---

## Cost Per Session

| Operation | Cost |
|-----------|------|
| SOC match (LLM, ~300 tokens) | ~$0.001 |
| Roadmap generation (LLM, ~2000 tokens) | ~$0.006 |
| O*NET API | Free (non-commercial tier) |
| Supabase write | < $0.001 |
| **Total per completed lead** | **~$0.007–0.01** |

---

## Risks & Mitigations

### Product Risks

| Risk | Mitigation |
|------|-----------|
| LLM hallucinated SOC codes | All codes validated against O*NET. Invalid codes dropped silently. |
| O*NET API down | Error + retry shown. No crash. |
| LLM roadmap call fails | Pre-written static fallback per role. Lead still saved. |
| Score feels wrong for a user | Disclaimer: "Based on occupational average + your task weights, not individual assessment." |
| India calibration over-adjusts | Labelled "India-adjusted estimate" in UI. Sector detection clearly shown. |
| Heuristic wrong green/red split | Flight plan: micro-screen added if 2+ test users report wrong split. |

---

### Security Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|-----------|
| S1 | **Prompt injection** on job description field — user input goes directly into LLM prompt for SOC matching | CRITICAL | Strip control characters + max 500 char limit before LLM call. System prompt uses strict JSON-only output instruction. Validated output structure before use. |
| S2 | **No rate limiting on /api/lead** — each submission triggers Claude call (2000 tokens) + Supabase write. Loopable to exhaust LLM budget in minutes. | CRITICAL | Upstash Redis rate limit via Next.js middleware: 3 submissions per IP per hour on `/api/lead`, 20 per hour on `/api/soc-match`. Returns 429 + `Retry-After` header. |
| S3 | **SUPABASE_SERVICE_KEY bypasses RLS** — if accidentally prefixed `NEXT_PUBLIC_`, full DB exposed to browser | HIGH | Enforce `SUPABASE_SERVICE_KEY` server-side only. RLS enabled on all tables. `leads` table: service role only policy. CI check: no `NEXT_PUBLIC_SUPABASE_SERVICE` in env. |
| S4 | **No server-side input validation** — email field client-validated only; malformed emails, oversized strings reach DB unvalidated | HIGH | Server-side: `zod` schema validates all `/api/lead` inputs before DB write. Email regex + max 254 chars. Name max 100 chars. SOC code format `XX-XXXX.XX` enforced. |
| S5 | **CORS open by default** — any origin can POST to API routes | MEDIUM | Next.js middleware: `Access-Control-Allow-Origin` restricted to `100xengineers.com` + Vercel preview domains. Preflight OPTIONS handled. |

---

### Infrastructure Risks

| # | Risk | Severity | Mitigation | Blocks Launch? |
|---|------|----------|-----------|---------------|
| I1 | **Vercel timeout on roadmap gen** — Claude 2000-token call takes 6–9s p95. Vercel Hobby default timeout = 10s. Under any load → 504. | CRITICAL | Upgrade to Vercel Pro (60s timeout). OR stream response via `ReadableStream` + `TransformStream`. OR move roadmap gen to Supabase Edge Function (no timeout limit). | YES |
| I2 | **O*NET latency under load** — live API call per session. Free tier ~50 req/min. 20 concurrent users → 429s → broken slider screen. | HIGH | Supabase lazy cache: check `onet_task_cache` table first (TTL 30 days), call O*NET on miss. Tasks change rarely. Cache hit rate >95% after warm-up. | No |
| I3 | **getAllSkills() DB hit on every lead submit** — 30 static rows queried per submission. Curriculum changes once/week via cron. | HIGH | Module-level singleton: `let _cache: CurriculumSkill[] \| null = null`. Populated on first call, reused within function instance lifetime. | No |
| I4 | **SOC match not cached** — "Product Manager at a fintech" typed by 200 users = 200 identical Claude calls (~$1.40 wasted) | MEDIUM | Redis cache keyed on normalised input (lowercase, trimmed). TTL 7 days. Cache hit → skip Claude call entirely. | No |
| I5 | **No circuit breaker** — O*NET or Claude down → unhandled 500 cascade, no graceful degradation path at infra level | HIGH | Implement per-route circuit breaker: 3 failures in 60s → open circuit → serve cached/fallback immediately. Auto-reset after 120s. | No |
| I6 | **Cron failure silent** — `sync-curriculum` Edge Function fails → stale curriculum data, no alert | MEDIUM | Add Supabase cron result logging to `cron_runs` table. Alert via Slack webhook if `last_success_at` > 8 days. | No |
| I7 | **No error monitoring** — 500s on any route invisible until user complaints | MEDIUM | Sentry DSN wired to Next.js `instrumentation.ts`. Capture all unhandled API route errors with `soc_code`, `role_category` context. Free tier sufficient. | No |

**Launch blockers (must fix before go-live):** S1, S2, I1
**Ship day-1 (degrade experience or cost money):** S3, S4, I2, I3, I5
**Week-2 polish:** S5, I4, I6, I7

---

## Research Sources

All sources used in scoring constants. Every constant in the codebase traces to one of these.

| # | Paper / Report | Year | Authors | Link | Used For |
|---|---------------|------|---------|------|---------|
| 1 | GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models | 2023 | Eloundou et al., *Science* | [doi.org/10.1126/science.adj0998](https://doi.org/10.1126/science.adj0998) | Factor 1: dv_beta base exposure scores, 800+ SOC codes |
| 2 | AI and the Labor Market: The Jobs Transition Framework | Apr 2026 | OpenAI | [openai.com/research](https://openai.com/research) | Factor 2: human necessity discount; Factor 3: demand elasticity |
| 3 | Anthropic Economic Index (Reports 3, 4, 5) | 2025–2026 | Massenkoff et al., Anthropic | [huggingface.co/datasets/Anthropic/EconomicIndex](https://huggingface.co/datasets/Anthropic/EconomicIndex) | Factor 4: adoption multiplier; per-task ai_autonomy, human_only_ability |
| 4 | AI Index Report 2026 | 2026 | Stanford HAI | [aiindex.stanford.edu](https://aiindex.stanford.edu) | Factor 4 confirmation: Claude usage by occupation; engineer −20% employment signal |
| 5 | Future of Jobs Report 2025 | 2025 | World Economic Forum | [weforum.org/publications/the-future-of-jobs-report-2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025) | Task exposure coefficients (BOX 3.1); industry automation rates; India calibration; designer override |
| 6 | Generative AI at Work | 2023 | Brynjolfsson, Li & Raymond, NBER | [nber.org/papers/w31161](https://www.nber.org/papers/w31161) | Product narrative: 14% avg / 34% novice productivity gain validates reskilling value prop |
| 7 | The Future of Employment | 2013 | Frey & Osborne, Oxford | [doi.org/10.1016/j.techfore.2013.08.041](https://doi.org/10.1016/j.techfore.2013.08.041) | Fallback only: 702-occupation probabilities for manual/routine roles absent from LLM exposure dataset |
