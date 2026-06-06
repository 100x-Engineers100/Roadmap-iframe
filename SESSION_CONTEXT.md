# Session Context — 2026-06-05

## Project
100x AI Roadmap Builder. Next.js app. Live at `roadmap-100x.vercel.app`.
Upcoming workshop: **this weekend, audience = Product Managers**.
Full pipeline: Role Input → O*NET SOC Match → Task Sliders → Score → Gap View → Email Gate → Roadmap.

---

## Bugs Found & Fixed This Session

### Bug 1 — SOC match hard-fails for "Product Manager"
**File:** `web/lib/llm/soc-match.ts`
**Root cause:** LLM (gpt-5.4-mini) had no list of valid O*NET codes → hallucinated codes → `validateSOCCode` returned false → threw error → user saw "Try being more specific".
**Fix:**
- Added curated list of ~25 verified O*NET codes to system prompt
- Explicitly flagged `13-1082.00` (Project Management Specialists) for PM roles
- Before throwing, now tries each alternative code in sequence
- Last-resort raw-text keyword fallback: if all O*NET calls fail, maps "product manager" → `13-1082.00` hardcoded

### Bug 2 — GapView always showed "AI-native Engineer" for any role
**File:** `web/lib/utils/role-mapper.ts`
**Root cause (two stacked bugs):**
1. `major === 15` catch fired for `15-1299.09` (IT Project Managers) → always returned `'engineer'` before PM check
2. `t.includes('project manager')` didn't match `"project management specialists"` (the O*NET title) — fell to default `return 'engineer'`
3. Function only saw O*NET title, not user's raw input — "Product Manager" typed by user was discarded
**Fix:**
- Added `rawInput?: string` as 3rd param — checked FIRST via keyword patterns before any SOC logic
- Added explicit SOC overrides: `13-1082.00` → `'pm'`, `15-1299.09` → `'pm'`, `11-9199` → `'pm'`
- Moved PM title check BEFORE the `major === 15` engineer block
- Added `t.includes('project management')` alongside `t.includes('project manager')`

### Bug 3 — `inferRoleCategory` not receiving raw input
**File:** `web/components/screens/RoleInput.tsx` line ~117
**Fix:** Changed call from `inferRoleCategory(activeSoc.soc_code, activeSoc.title)` to `inferRoleCategory(activeSoc.soc_code, activeSoc.title, input)`

### Bug 4 (UX) — Card showed O*NET bureaucratic title, not user's own words
**File:** `web/components/screens/RoleInput.tsx`
**Root cause:** Card displayed `activeSoc.title` = "Project Management Specialists" instead of what user typed.
**Fix:** Added `extractDisplayTitle(rawInput, onetTitle)` function:
- `"Product Manager at fintech startup"` → strips `"at fintech startup"` → shows **"Product Manager"**
- `"UX Designer in edtech"` → shows **"UX Designer"**
- Falls back to O*NET title if input is ambiguous/too long
- O*NET title still flows into all pipeline logic unchanged — display-only change

---

## Cascading Effect of Bug 2 (all now fixed)
When `roleCategory` was wrong (`'engineer'` instead of `'pm'`), ALL downstream was broken:
- Score used `FO_FALLBACK_BY_ROLE['engineer'] = 0.868` → CRITICAL band (wrong)
- Skill gap clusters filtered by `'engineer'` → wrong skills shown
- Gap inference used engineer tools (FastAPI, LangChain) not PM tools (Claude, Lovable, Cursor, Linear)
- Roadmap blueprint used engineer journey analogy
All of this now resolves correctly because `roleCategory = 'pm'` flows through.

---

## Files Changed
| File | What changed |
|---|---|
| `web/lib/llm/soc-match.ts` | Verified SOC code list in prompt, fallback chain, raw-text last resort |
| `web/lib/utils/role-mapper.ts` | Full rewrite — rawInput param, SOC overrides, correct check order |
| `web/components/screens/RoleInput.tsx` | Pass `input` to `inferRoleCategory`; add `extractDisplayTitle` for card |

---

## Known Remaining Issue (not fixed)
- `extractDisplayTitle` title-cases everything, so `"Senior PM at startup"` → `"Senior Pm"` (PM loses caps).
- Fix: add acronym guard for common uppercase tokens: `PM`, `UX`, `UI`, `SEO`, `VP`, `CTO`, `CXO`, `B2B`, `B2C`, `SaaS`.
- Not done yet — carry into next session if needed.

---

## O*NET Auth (confirmed working)
- API v2 uses `X-API-Key` header — code is correct.
- `.env.local` comment says "Basic Auth" — that was v1.9. Comment is stale, ignore it.
- Keys: `ONET_API_KEY=aqQs9-9P3ik-FWipd-Gndsc` in `.env.local`.

## LLM Provider
- `gpt-5.4-mini` via OpenAI SDK (`web/lib/llm/provider.ts`)
- Reasoning model: uses `max_completion_tokens`, temperature omitted — correct
- `OPENAI_API_KEY` set in `.env.local`

---

## PM Role Data (confirmed working end-to-end)
- SOC code: `13-1082.00` (Project Management Specialists)
- Role tools: Claude, Lovable, Cursor, Linear, n8n, Notion
- Fallback score: `FO_FALLBACK_BY_ROLE['pm'] = 0.720` (DERIVED estimate, labelled in UI)
- Skill clusters: C2A, C2B, C2C, C3A, C3B (5 PM-relevant clusters)
- AAA phase map: `pm` key exists in `web/lib/roadmap/aaa-phase-map.mjs`
- Journey analogy: "Going from writing every product brief manually to getting structured insight ready before each product decision"
