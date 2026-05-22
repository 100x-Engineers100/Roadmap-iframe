# AI Displacement Risk Calculator — Build Progress
Last updated: 2026-05-21

---

## Product
**100x School of Applied AI — Lead Magnet Tool**
User enters job title → gets AI displacement risk score (0–100) → gets personalized AI learning roadmap → drops email to unlock it.

Spec: `MASTER_SPEC.md` — single source of truth for everything.

---

## Infrastructure
- Supabase project: `oxzbnhssdnmvbfmuirbf` (Sydney)
- Next.js app: `web/` folder
- Vercel: linked via `web/.vercel/project.json`

---

## ENV STATUS (`web/.env.local`)
| Var | Status |
|-----|--------|
| NEXT_PUBLIC_SUPABASE_URL | FILLED |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | FILLED |
| SUPABASE_SERVICE_KEY | FILLED |
| LLM_PROVIDER | set to `openai` |
| ANTHROPIC_API_KEY | not needed (using OpenAI) |
| OPENAI_API_KEY | FILLED |
| ONET_API_KEY | FILLED — X-API-Key header, base URL `https://api-v2.onetcenter.org/online` |
| ONET_API_PASSWORD | FILLED (in file, unused — v2 API uses API key only) |

---

## Phase Status

| Phase | What | Status |
|-------|------|--------|
| Pre-0 | Codebase audit + cleanup | DONE |
| 0 | Foundation setup | DONE |
| 1 | Data layer (Supabase schema + curriculum seed) | DONE |
| 2 | Score engine (O*NET + F&O + LLM-era calculator) | DONE |
| 3 | SOC matching + skill gap inference | DONE |
| 4 | Frontend screens 1–4 | DONE |
| 5 | Frontend screens 5–7 | NEXT |
| 6 | Roadmap visualization (screen 8) | NOT STARTED |
| 7 | End-to-end integration | NOT STARTED |
| 8 | Mobile + polish + accessibility | NOT STARTED |
| 9 | Zeno curriculum sync (cron) | NOT STARTED |

---

## Phase 0 — What Was Built

```
web/
  app/
    globals.css        design tokens (#b22c11, Space Grotesk, Inter)
    layout.tsx         fonts loaded
    page.tsx           placeholder
  components/
    ui/button.tsx      shadcn
  lib/
    llm/provider.ts    callLLM() — routes to Claude or GPT-4o via LLM_PROVIDER
    utils.ts           shadcn cn util
  types/index.ts       ALL shared types (AssessmentState, Roadmap, Lead, etc.)
  data/                empty — Phase 1
  scripts/             empty — Phase 1 seed script
```

**Test gate 0:** All passing. Zero TS errors. Dev server starts clean.

---

## Phase 1 — What Was Built

```
web/
  data/
    fo-scores.ts          702 F&O occupation probabilities + task keywords + bottleneck coefficients
    curriculum-seed.ts    25 skills seeded (M1: 8, M2: 11, M3: 6) — corrected against Zeno wiki
  lib/
    db/
      curriculum.ts       getSkillsByRole(), getAllSkills()
      leads.ts            insertLead()
  scripts/
    seed-curriculum.ts    idempotent upsert → Supabase curriculum_skills table
```

**Key correction made in Phase 1:**
Module 1 originally listed Midjourney/DALL-E as if 100x didn't teach image tools. Corrected after verifying Zeno wiki — 100x DOES teach Midjourney, DALL-E, WAN, Kling. S1.1 now reflects real curriculum.

**Test gate 1:** All 5 tests passing. 25 rows in Supabase `curriculum_skills`.

---

## Phase 2 — What Was Built

```
web/
  lib/
    api/
      onet.ts               O*NET v2 API client
                            - getTasksForSOC(socCode): fetches real tasks
                            - validateSOCCode(socCode): 404 check
                            - Auth: X-API-Key header (api-v2.onetcenter.org)
                            - NOTE: spec said basic auth — v2 API uses X-API-Key header
    score/
      calculator.ts         3-tier base score lookup + F&O task adjustment + India calibration
      india-calibration.ts  Sector adjustment constants (DERIVED, WEF/NASSCOM estimates)
  data/
    fo-scores.ts            EXTENDED with:
                            - LLM_EXPOSURE_BY_SOC (30+ SOC codes, GPTs are GPTs 2023)
                            - FO_FALLBACK_BY_ROLE (updated to GPTs β values)
  scripts/
    test-phase2.ts          All 18 test assertions
```

**Critical architecture decision made in Phase 2:**

F&O (2013) base scores for knowledge workers are useless for a 2026 product.
Marketing Managers = 1.4% in F&O paper (written before LLMs).

Solution: **3-tier base score priority** in calculator.ts:
1. `LLM_EXPOSURE_BY_SOC` — GPTs are GPTs (Eloundou et al. 2023, Science). β scores = task exposure to LLMs. Accurate for knowledge workers.
2. `FO_OCCUPATION_PROBABILITIES` — F&O (2013). Still accurate for routine/manual occupations.
3. `FO_FALLBACK_BY_ROLE` — GPTs β role proxies. Used when SOC not in either dataset.

Every value traces to a published primary source. No invented constants.

**Test gate 2:** 18/18 passing.
- TEST 2.1: getTasksForSOC('11-3021.00') → 5+ real tasks [PASS]
- TEST 2.2: validateSOCCode validation [PASS]
- TEST 2.3: categoriseTask keyword matching [PASS]
- TEST 2.4: PM 55-75, Social Worker 20-45 using real O*NET tasks [PASS]
- TEST 2.5: India calibration +10/-12, clamping [PASS]
- TEST 2.6: Score band boundaries [PASS]

---

## Phase 3 — What Was Built

```
web/
  lib/
    llm/
      soc-match.ts          socMatch(input) — calls OpenAI, validates all SOC codes via O*NET,
                            drops invalid codes silently
    skill-gap/
      inference.ts          inferSkillGap(role, skills) — green=roles_adjacent, red=roles only
                            returns max 8 skills (2-3 green + 5-6 red), ordered by seq_order
  app/
    api/
      soc-match/route.ts    POST handler — 400 on bad input, 500 on LLM failure
  scripts/
    test-phase3.ts          16/16 assertions
```

**Test gate 3:** 16/16 passing.
- TEST 3.1: PM SOC match — format, title, confidence >= 0.7 [PASS]
- TEST 3.2: Ambiguous banking input returns alternatives [PASS]
- TEST 3.3: All returned SOC codes pass O*NET validation [PASS]
- TEST 3.4: inferSkillGap — S2.3 green, S2.2 red, 6-8 total, all green adjacent [PASS]
- TEST 3.5: POST /api/soc-match — 200, < 5000ms warm, valid format [PASS]

---

## Phase 4 — What Was Built

```
web/
  app/
    page.tsx                  Screen 1 (Landing) — grid bg, staggered Framer Motion entrance,
                              pulse CTA, credibility bar (O*NET | OECD | WEF)
    assess/page.tsx           State machine (useReducer) — steps 2-8, AnimatePresence transitions,
                              score fetch kicked off in step 4 useEffect
    api/
      onet-tasks/route.ts     GET ?soc=XX-XXXX.XX → OnetTask[]
      score/route.ts          POST { soc_code, tasks, task_weights, role_category } → { score, band, skill_gap }
  components/
    screens/
      RoleInput.tsx           Screen 2 — debounced SOC match, loading dots, match card slide-in,
                              RadioGroup alternatives, O*NET tasks fetch on confirm
      TaskSliders.tsx         Screen 3 — custom range sliders (3-stop), sticky bottom CTA
      Calculating.tsx         Screen 4 — dark bg, SVG ring countdown, rotating text, 5s timer
    ui/
      ProgressDots.tsx        5-dot progress indicator, Framer Motion size/color transitions
  hooks/
    useCountUp.ts             Count-up animation hook (ease-out cubic, rAF-based)
  lib/
    utils/
      role-mapper.ts          inferRoleCategory(socCode, socTitle) → RoleCategory
```

**Verified working:** Screen 1→2→3→4→score (55 — MODERATE confirmed live). Back navigation preserves SOC match. 5s calculating screen enforced. Zero TS errors.

---

## Key Files
| File | Purpose |
|------|---------|
| `MASTER_SPEC.md` | Single source of truth. Read before every session. |
| `web/.env.local` | All env vars |
| `web/types/index.ts` | All TypeScript types |
| `web/lib/llm/provider.ts` | LLM abstraction (Claude + OpenAI interchangeable) |
| `web/lib/api/onet.ts` | O*NET v2 API client |
| `web/lib/score/calculator.ts` | Score engine — 3-tier lookup, task adjustment, India calibration |
| `web/lib/score/india-calibration.ts` | India sector adjustment constants |
| `web/data/fo-scores.ts` | F&O 702 probs + GPTs-era exposure scores + task keywords |
| `web/scripts/test-phase2.ts` | Phase 2 test gate (18 assertions) |
