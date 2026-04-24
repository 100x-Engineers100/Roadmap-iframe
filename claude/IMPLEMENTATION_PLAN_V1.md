prompt - READ FIRST: C:\Users\visha\Downloads\Roadmap iframe\IMPLEMENTATION_PLAN_V1.md                                                                                        This is the complete locked implementation plan. Read it fully before writing a single line of code.                                                               
                                                                                                                                                                       PROJECT: 100x AI Roadmap Builder
  A personalized AI career roadmap generator. Users answer 7 intake questions, authenticate with Google, and receive a downloadable SVG roadmap grounded in 100x     
  Engineers curriculum.

  BUILD ORDER — follow exactly, do not skip ahead:
  STEP 1: Zeno Worker → add /internal/roadmap-context endpoint
  STEP 2: Supabase schema (tables + RLS + pg_cron)
  STEP 3: Edge Function shared utilities (_shared/)
  STEP 4: /generate Edge Function
  STEP 5: /status Edge Function
  STEP 6: /send-reminders Edge Function
  STEP 7: End-to-end POC test (no Framer yet)
  STEP 8: Framer intake UI
  STEP 9: Framer roadmap result page
  STEP 10: Production hardening

  KEY FILES:
  - Zeno Worker source: C:\Users\visha\Downloads\100x Wiki\zeno-mcp-server\src\index.ts
  - Zeno deployed URL: https://zeno-wiki-mcp.cohort-c62.workers.dev
  - Implementation plan: C:\Users\visha\Downloads\Roadmap iframe\IMPLEMENTATION_PLAN_V1.md

  BEFORE STARTING — ask the user for these credentials (do not proceed without them):
  1. Supabase project URL + anon key + service role key (or confirm if project needs to be created)
  2. OpenAI API key (confirm GPT-4.1 access)
  3. Resend API key + verified sending domain
  4. Cloudflare access to deploy Zeno Worker changes
  5. ZENO_INTERNAL_SECRET value to generate (suggest: run `openssl rand -hex 32`)
  6. Framer site domain/URL (needed for OAuth redirect URLs)

  OPEN QUESTIONS TO RESOLVE WITH USER BEFORE BUILDING:
  - Q3 in intake (weak areas): user said "can add more" — confirm final chip list or use plan defaults
  - Framer site: is it published on custom domain or framer.app subdomain? Affects Google OAuth callback URL

  RULES FOR THIS BUILD SESSION:
  - Do not add any feature not in the plan
  - Do not start Framer UI before Step 7 (POC) passes
  - After each step: run a test, confirm it works before moving to next step
  - If anything in plan conflicts with actual platform behavior: stop and flag to user, do not assume
  - V2 items are: chat editing, analytics, progress tracking, SMS, global phone — do not build these
  - All design decisions are locked. Do not re-discuss architecture.
================================================================================================================

# 100x AI Roadmap Builder — V1 Implementation Plan

**Date:** 2026-04-23 (revised 2026-04-24)
**Status:** Ready for build — V1.1 (post adversarial review fixes)
**Purpose:** Complete reference for agents building V1. Every decision is locked. Do not assume anything not in this doc.

**Changes in V1.1:**
- FIX: users.id = auth.uid() (Supabase UUID), not google_sub. RLS now uses direct UUID match.
- FIX: All RLS policies rewritten — no cast, no subquery join for ownership checks.
- FIX: reminders UNIQUE (roadmap_id, reminder_type) constraint added.
- REMOVED: Share system (share_token, share_enabled, share RLS, share page) → v2.

---

## 1. Product Overview

### What It Is
A personalized AI career roadmap generator embedded in the 100x Engineers Framer website. Any person — regardless of background — provides their goal and profile. The system maps their goal to an AI/applied-AI destination, retrieves relevant 100x cohort curriculum from Zeno wiki, generates a structured roadmap JSON via OpenAI, and renders a downloadable visual roadmap SVG/PNG in the 100x brand style.

### Core User Journey
1. User visits 100x Framer site → clicks roadmap CTA button
2. Intake overlay opens → user answers 7 questions
3. Registration card appears → mobile number + Google auth
4. Auth completes → user redirected to roadmap result page
5. Page shows loading state while generation runs in background
6. Roadmap SVG renders → user can download SVG or PNG
7. Automated reminder emails sent at +3 days and +6 days post-generation

### End Goal
- Generate leads for 100x Engineers cohort
- Demonstrate 100x curriculum depth
- Collect mobile numbers for sales team follow-up
- Viral share loop via social-ready roadmap output

### What This Is NOT
- Not a generic career roadmap tool
- Not an AI chatbot
- Not interactive (no chat editing in v1)
- Not a learning platform itself

---

## 2. Tech Stack (Final, No Alternatives)

| Layer | Technology | Reason |
|---|---|---|
| Public frontend | Framer (existing 100x site) | Already deployed, intake UI lives here |
| Auth | Supabase Auth (Google OAuth) | Native popup support, session JWT, no custom OAuth code |
| Database | Supabase PostgreSQL | Free tier, RLS, native Edge Function access |
| Storage | Supabase Storage | SVG/PNG files, private bucket + signed URLs |
| Backend/API | Supabase Edge Functions (Deno) | No new hosting, 150s free timeout, background tasks via EdgeRuntime.waitUntil |
| LLM | OpenAI GPT-4.1 (structured JSON output) | Best structured output capability; Claude adapter built in but not used in v1 |
| Knowledge base | Zeno MCP (deployed Cloudflare Worker) | 100x cohort curriculum, accessed via new internal HTTP endpoint |
| Email | Resend | Simple HTTP API, good deliverability |
| Framer ↔ Supabase bridge | `@supabase/supabase-js` via `esm.sh` CDN | Well-documented pattern, anon key safe with RLS |

### What Was Rejected and Why
- **Railway/Render:** No timeout constraints needed after EdgeRuntime.waitUntil confirmed. Adds hosting dependency.
- **Vercel:** Extra service, cost for Pro needed for 300s timeout. Not required.
- **Cloudflare Workers as primary backend:** 30s wall-clock too tight for OpenAI generation on free tier.
- **React Flow + ELK:** Overkill for static SVG v1. Added 2MB+ cold start, no interactivity in v1.
- **Satori for SVG:** WASM init complexity, font loading issues, 2MB bundle. Hand-rolled SVG template is faster and zero-dep.
- **Full MCP OAuth flow from Edge Function:** Too complex. Solved by adding internal HTTP route to Zeno Worker instead.
- **Redirect OAuth from Framer:** Full page redirect wipes all JS state. Popup flow is correct.
- **Pre-auth email collection:** Removed entirely. Google Auth provides verified email. No mismatch risk.
- **SMS OTP:** No SMS feature in v1. No justification.
- **Chat editing:** v2 only. V1 is generate + view + download.
- **Dynamic prereq call before auth (Q3 as API call):** Too much pre-auth complexity. Static multi-select chips instead.
- **Dark theme for SVG:** Using 100x light theme, not dark.
- **Global phone support:** India-only in v1, schema is global-ready for v2.

---

## 3. Intake Form (7 Questions + Registration)

Intake lives in a Framer custom code overlay/component. Completed before auth.

### Question Flow

```
Q1: What should we call you?
    → free text input, required, max 50 chars
    → stored as: user.display_name
    → shown on roadmap as: "<name>'s roadmap to become <role>"

Q2: What specific AI outcome do you want?
    → clickable chips (select one) + free text to customize
    → chips (AI-forced, no generic career):
      [ Become an AI engineer ]
      [ Build AI agents ]
      [ Become an AI product builder ]
      [ Use AI in my current career ]
      [ Build AI content or ads ]
      [ Start an AI automation business ]
      [ Master diffusion / image-video AI ]
    → free text box appears below chips, pre-fills with chip text, editable
    → if goal is not AI-related: system prompt redirects it into AI path (not a form-level block)
    → stored as: intake.goal

Q3: How long do you want your roadmap?
    → two large option cards:
      [ 3 Months ]  [ 6 Months ]
    → stored as: intake.timeframe_months (value: 3 or 6)
    → drives: phase count (3 months = 3 phases, 6 months = 6 phases), each phase = 4 weeks

Q4: What is your current background?
    → two dropdowns side by side:
      Dropdown 1 — Role:
        Student / Software developer / Designer / Product manager /
        Founder or operator / Data analyst / Cybersecurity professional /
        Hardware engineer / Non-tech professional / Other
      Dropdown 2 — Experience:
        Less than 1 year / 1–3 years / 3–7 years / 7+ years
    → stored as: intake.background_role, intake.experience_years

Q5: What are your weakest areas right now?
    → multi-select chips (pick all that apply):
      [ Programming fundamentals ] [ Web development ] [ AI and LLMs ]
      [ System design ] [ Data and ML ] [ Product thinking ]
      [ Deployment and DevOps ] [ Consistency and accountability ]
    → stored as: intake.weak_areas (array)

Q6: How many hours per week can you commit?
    → single-select option cards:
      [ 2–4 hours ] [ 5–8 hours ] [ 9–15 hours ] [ 15+ hours ]
    → stored as: intake.hours_per_week

Q7: How do you learn best?
    → single-select option cards:
      [ Building projects ] [ Watching videos ]
      [ Reading docs ] [ Guided tasks ] [ Mixed ]
    → stored as: intake.learning_style
```

### Registration Card (Appears After Q7)

```
Field: Mobile number (compulsory)
  → India: 10-digit number, stored as +91XXXXXXXXXX
  → Validation: /^[6-9]\d{9}$/ for Indian numbers
  → No explanation copy next to field
  → Architecture: country code stored separately (country_code: "+91") for v2 global

Small text below mobile (small font, no checkbox):
  "By generating your roadmap, you agree to receive personalized roadmap reminders."

Button: Continue with Google
  → triggers Supabase Google OAuth popup
  → popup-first, redirect fallback if popup blocked
```

---

## 4. Auth Flow (Detailed)

### Popup OAuth Pattern
```
1. User clicks "Continue with Google"
2. Store intake answers in sessionStorage (backup for redirect fallback)
3. Call supabase.auth.signInWithOAuth({ provider: 'google', options: { skipBrowserRedirect: true } })
4. Get OAuth URL from response
5. Open window.open(oauthUrl, '_blank', 'width=500,height=600')
6. Popup completes OAuth → posts message via window.opener.postMessage({ type: 'auth_complete', session: ... }, '*')
7. Parent Framer page receives postMessage → gets session
8. Clear sessionStorage
9. Create pending roadmap record in Supabase with intake answers
10. Redirect to roadmap result page: /roadmap?id=<roadmap_id>
```

### Redirect Fallback (If Popup Blocked)
```
1. Detect popup blocked (popup === null after window.open)
2. Store intake answers + mobile in sessionStorage
3. Full page redirect to Google OAuth with callbackUrl = /roadmap-callback
4. /roadmap-callback page: read session from URL hash, read intake from sessionStorage
5. Create pending roadmap record → redirect to /roadmap?id=<roadmap_id>
```

### Post-Auth Backend
```
1. Edge Function /auth-complete called with session JWT
2. Upsert user in Supabase:
   {
     id: user.id,                        // Supabase Auth UUID (auth.uid()) — NOT google_sub
     google_sub: user.user_metadata.sub, // stored for reference only
     email: user.email,
     display_name,
     mobile,
     country_code
   }
   ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, display_name=EXCLUDED.display_name
3. Create roadmap record: { id: uuid, user_id: user.id, intake_answers, status: 'pending' }
4. Return { roadmap_id }
5. Trigger /generate asynchronously (EdgeRuntime.waitUntil)
```

---

## 5. Roadmap Generation Architecture

### Flow
```
Framer → POST /generate (with JWT) → Edge Function returns { roadmap_id, status: "generating" } immediately
                                    → EdgeRuntime.waitUntil(generateRoadmap(roadmap_id))

generateRoadmap():
  1. Fetch intake answers from Supabase
  2. Update roadmap status → "generating"
  3. Call Zeno /internal/roadmap-context
  4. Build evidence pack
  5. Build LLM prompt
  6. Call OpenAI GPT-4.1 with structured output schema
  7. Validate JSON output (Zod)
  8. Render SVG from roadmap JSON
  9. Upload SVG to Supabase Storage
  10. Update roadmap record: { status: "complete", roadmap_json, svg_url }
  11. Schedule reminder records in DB

Framer polls GET /status?id=<roadmap_id> every 3 seconds
  → returns { status, svg_url } when complete
```

### Status Lifecycle
```
pending → generating → complete
                     ↘ failed (if > 5 minutes elapsed or unhandled error)
```

Failed state: Framer shows "Generation failed — try again" + manual retry button.  
Retry: creates new generation attempt, same roadmap_id, resets status to "pending".  
Rate limit: **2 generations per user per 24-hour window** (check `roadmaps` table count).

### Stuck Job Recovery
```
pg_cron job runs every 10 minutes:
  UPDATE roadmaps SET status = 'failed'
  WHERE status = 'generating'
  AND updated_at < NOW() - INTERVAL '5 minutes'
```

---

## 6. Zeno MCP Integration

### Problem
Deployed Zeno MCP at `https://zeno-wiki-mcp.cohort-c62.workers.dev/mcp` is behind Google OAuth bearer token flow. Supabase Edge Function is a server, cannot authenticate interactively. Direct MCP calls = 401.

### Solution
Add new internal HTTP endpoint to Zeno Cloudflare Worker. Keep existing MCP OAuth untouched.

### New Endpoint: POST /internal/roadmap-context

**File to modify:** `src/index.ts` in zeno-mcp-server  
**Add BEFORE `oauthProvider.fetch()` call**

```typescript
if (url.pathname === "/internal/roadmap-context" && request.method === "POST") {
  // Auth check
  const secret = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!secret || secret !== env.ZENO_INTERNAL_SECRET) {
    return withSecurityHeaders(new Response(
      JSON.stringify({ error: "Unauthorized" }), { status: 401 }
    ));
  }

  // Body validation
  const body = await request.json() as {
    goal: string;
    background: string;
    weak_areas: string[];
    timeframe_months: number;
  };
  if (!body.goal || body.goal.length > 500) {
    return withSecurityHeaders(new Response(
      JSON.stringify({ error: "Invalid request" }), { status: 400 }
    ));
  }

  // Step 1: Get index (routing map)
  const [index, overview] = await Promise.all([
    env.ZENO_WIKI.get("__index__"),
    env.ZENO_WIKI.get("__overview__"),
  ]);

  // Step 2: Search for relevant pages by goal + weak areas
  const searchTerms = [body.goal, ...body.weak_areas].filter(Boolean);
  const allMatches: Map<string, { count: number; excerpts: string[] }> = new Map();

  const listed = await env.ZENO_WIKI.list();
  for (const k of listed.keys) {
    const md = await env.ZENO_WIKI.get(k.name);
    if (!md) continue;
    const lower = md.toLowerCase();
    let matchCount = 0;
    const excerpts: string[] = [];
    for (const term of searchTerms) {
      const idx = lower.indexOf(term.toLowerCase());
      if (idx !== -1) {
        matchCount++;
        const start = Math.max(0, idx - 100);
        excerpts.push(md.slice(start, idx + term.length + 400).replace(/\n/g, " ").trim());
      }
    }
    if (matchCount > 0) {
      allMatches.set(k.name, { count: matchCount, excerpts: excerpts.slice(0, 2) });
    }
  }

  // Sort by relevance, build evidence pack within token budget
  const sorted = [...allMatches.entries()]
    .sort((a, b) => b[1].count - a[1].count);

  const evidence = sorted.map(([key, data]) => {
    const title = key.split("/").pop()?.replace(/-/g, " ") ?? key;
    return {
      key,
      title,
      excerpt: data.excerpts.slice(0, 1500).join(" ... "),
      matched_terms: searchTerms.filter(t =>
        data.excerpts.some(e => e.toLowerCase().includes(t.toLowerCase()))
      ),
    };
  });

  return withSecurityHeaders(Response.json({
    overview: overview?.slice(0, 2000) ?? "",
    index: index?.slice(0, 3000) ?? "",
    evidence,
    meta: {
      queries: searchTerms,
      result_count: evidence.length,
    },
  }));
}
```

**Add to Cloudflare secrets:**
```
wrangler secret put ZENO_INTERNAL_SECRET
```

**Add to `worker-configuration.d.ts`:**
```typescript
ZENO_INTERNAL_SECRET: string;
```

**Rate limit the /internal route too** (same `MCP_RATE_LIMITER`, key = caller IP).

---

## 7. Roadmap JSON Schema (Final Contract)

This is the exact output the LLM must produce. SVG renderer, Supabase storage, and reminder emails all consume this.

```json
{
  "version": "1",
  "roadmap_title": "{{name}}'s roadmap to become {{target_role}}",
  "generated_at": "ISO-8601 timestamp",

  "source_strategy": {
    "domain_mapping": "llm_general_knowledge",
    "zeno_usage": "relevant_enrichment_only",
    "zeno_confidence": "high | low",
    "fallback_allowed": true
  },

  "user_profile": {
    "name": "string",
    "goal": "string — exact user input",
    "target_role": "string — LLM-interpreted clean role title",
    "background_role": "string",
    "experience_years": "string",
    "weak_areas": ["string"],
    "hours_per_week": "string",
    "learning_style": "string",
    "timeframe_months": 3
  },

  "summary": "2-3 sentence direct coaching summary. No hype. What this person needs to do.",

  "target_outcome": "Specific measurable end state. e.g. 'Ship 2 AI agent projects, get 3 interviews at AI-first startups'",

  "success_metrics": [
    "Metric 1 — concrete and measurable",
    "Metric 2"
  ],

  "risks": [
    "Risk 1 — direct, honest",
    "Risk 2"
  ],

  "assumptions": [
    "Assumption 1",
    "Assumption 2"
  ],

  "phases": [
    {
      "id": "phase-1",
      "number": 1,
      "title": "Phase title",
      "weeks": "1–4",
      "focus": "One line — what this phase is about",
      "difficulty": "beginner | intermediate | advanced",
      "milestones": [
        {
          "id": "m-1-1",
          "title": "Milestone title",
          "type": "concept | project | skill",
          "priority": "high | medium | low",
          "done": false,
          "resources": [
            {
              "title": "Resource title",
              "source": "zeno | model_knowledge",
              "key": "concepts/llm-basics"
            }
          ]
        }
      ],
      "weekly_schedule": [
        { "week": 1, "focus": "What to do this week", "estimated_hours": 6 },
        { "week": 2, "focus": "What to do this week", "estimated_hours": 6 },
        { "week": 3, "focus": "What to do this week", "estimated_hours": 6 },
        { "week": 4, "focus": "What to do this week", "estimated_hours": 6 }
      ],
      "weekly_actions": [
        "Specific action 1",
        "Specific action 2",
        "Specific action 3"
      ]
    }
  ],

  "next_7_days": [
    "Action 1 — specific and doable",
    "Action 2",
    "Action 3"
  ],

  "skill_tree": [
    {
      "id": "sk-1",
      "name": "Skill name",
      "current_level": 2,
      "target_level": 4,
      "category": "foundation | ai | deployment | product",
      "unlocks": ["Skill that this enables"],
      "source": "zeno | model_knowledge"
    }
  ],

  "evidence_used": [
    { "key": "concepts/llm-basics", "title": "LLM Basics" }
  ],

  "coaching_note": "One direct sentence about the single biggest risk or gap for this specific person.",

  "reminder_emails": {
    "day_3": {
      "subject": "Day 3 check-in: {{name}}, here is where you should be",
      "body": "Pre-generated personalized email body referencing next_7_days + phase 1 milestones. Written as if coaching the person directly. 150-200 words."
    },
    "day_6": {
      "subject": "Day 6: Week 1 is almost done, {{name}}",
      "body": "Pre-generated email referencing phase 1 completion state + phase 2 preview. 150-200 words."
    }
  },

  "download_metadata": {
    "theme": "100x-light",
    "width": 1200,
    "height": 1800,
    "generated_at": "ISO-8601 timestamp"
  }
}
```

**Constraints:**
- Max 8 skills in `skill_tree`
- Max 2 resources per milestone
- Max 3-4 milestones per phase
- `phases` array length: 3 for 3-month plan, 6 for 6-month plan
- `next_7_days`: exactly 3 items
- `success_metrics`: 2-3 items
- `risks`: 2-3 items

---

## 8. LLM Prompt Design

### System Prompt
```
You are a career roadmap generator for 100x Engineers — an applied AI cohort that teaches builders how to work with LLMs, agents, diffusion models, and AI systems.

Your job is to take a user's background and goal, map it to the closest AI/applied-AI career transformation, and produce a structured roadmap grounded in the 100x curriculum.

RULES:
1. Every roadmap must lead to an AI-enabled outcome. If the goal is not AI-related, reframe it into the closest AI-enabled version before generating.
2. Use the Zeno wiki evidence as your primary curriculum source. Cite zeno pages in resources where relevant.
3. Use general model knowledge only to bridge the user's background into the AI domain, or where Zeno has no coverage.
4. Do NOT generate generic internet-advice roadmaps. Every recommendation must be grounded in real 100x content where possible.
5. Be direct and clinical — no motivational filler. Treat the user as an adult who wants honest guidance.
6. If zeno_confidence is low (weak Zeno results), still generate using general AI knowledge but mark source as "model_knowledge" throughout.
7. The roadmap must be actionable. next_7_days must be doable in the first week given the stated hours/week.
8. Match phase count to timeframe: 3 months = 3 phases, 6 months = 6 phases. Each phase = 4 weeks.
9. Pre-generate two reminder email bodies (day_3 and day_6) that reference this specific roadmap's content and the user's stated hours + learning style.

OUTPUT: Return only valid JSON matching the roadmap schema. No markdown, no explanation, no wrapper text.
```

### User Message Template
```
USER PROFILE:
Name: {{name}}
Goal: {{goal}}
Background: {{background_role}}, {{experience_years}}
Weak areas: {{weak_areas.join(', ')}}
Hours per week: {{hours_per_week}}
Learning style: {{learning_style}}
Timeframe: {{timeframe_months}} months

ZENO WIKI OVERVIEW:
{{overview}}

ZENO INDEX (curriculum map):
{{index}}

RELEVANT 100x CURRICULUM EVIDENCE:
{{evidence.map(e => `[${e.key}] ${e.title}\n${e.excerpt}`).join('\n\n')}}

Generate a complete roadmap JSON following the schema exactly.
```

### OpenAI Call Config
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4.1",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage }
  ],
  response_format: { type: "json_object" },
  temperature: 0.3,
  max_tokens: 6000,
});
```

### Provider Adapter Pattern
```typescript
// supabase/functions/_shared/llm-provider.ts
interface LLMProvider {
  generateRoadmap(prompt: string, userMessage: string): Promise<string>;
}

class OpenAIProvider implements LLMProvider { ... }
class AnthropicProvider implements LLMProvider { ... }  // v2

const LLM_PROVIDER = Deno.env.get("LLM_PROVIDER") ?? "openai";
export const llm: LLMProvider = LLM_PROVIDER === "anthropic"
  ? new AnthropicProvider()
  : new OpenAIProvider();
```

---

## 9. SVG Layout Contract

### Canvas
- Size: 1200 × 1800px
- Background: `#ffffff`
- Font family: `Space Grotesk, sans-serif` (system fallback — no CDN in SVG)
- Mono font: `JetBrains Mono, monospace`
- No external font embedding in v1 (avoids 200KB+ base64 bloat)

### 100x Brand Tokens
```
Coral:    #f96846  (primary, badges, phase numbers, accents, CTAs)
Peach:    #ffeee9  (card backgrounds, highlights)
Blush:    #fff8f6  (subtle section backgrounds)
Text:     #1a1a1a  (never pure black)
Muted:    #888     (subtitles, labels)
Muted2:   #aaa     (small labels)
Border:   #e0ddd8  (card borders)
Surface:  #f5f5f3  (alternate backgrounds)
```

### Layout Zones
```
┌─────────────────────────────────────────────┐  y:0
│  HEADER (120px)                              │
│  "<name>'s roadmap to become <role>"         │
│  subtitle: target_outcome                    │
│  top-right: "Built with 100x learning intel" │
├─────────────────────────────────────────────┤  y:120
│                         │                   │
│  PHASE CARDS            │  SKILL TREE        │
│  (left 58%, w:696)      │  (right 42%, w:504)│
│                         │                   │
│  Phase 1 card           │  Skill nodes       │
│  Phase 2 card           │  with progress     │
│  Phase 3 card           │  bars + arrows     │
│  (+ 3-6 depending on    │  (max 8 nodes)     │
│  timeframe)             │                   │
├─────────────────────────┴───────────────────┤  y:~1640
│  FOOTER STRIP (160px)                        │
│  "Start here:" + next_7_days[0]              │
│  coaching_note (muted)                       │
│  "Built with 100x Engineers curriculum"      │
└─────────────────────────────────────────────┘  y:1800
```

### Phase Card Anatomy
```
┌─────────────────────────────────┐
│  ● 01  FOUNDATION    [Wk 1-4]   │  ← coral circle + JetBrains Mono badge
│  ─────────────────────────────  │  ← coral left border (3px)
│  focus line                     │
│  • milestone 1                  │
│  • milestone 2                  │
│  • milestone 3                  │
│  [difficulty badge]             │
└─────────────────────────────────┘
Peach (#ffeee9) card bg, 12px radius, 0.5px border #e0ddd8
```

### Skill Node Anatomy
```
┌──────────────────┐
│  Python          │  ← Space Grotesk 600
│  ████░░  3 → 5   │  ← coral progress bar
│  foundation      │  ← JetBrains Mono label
└──────────────────┘
Arrows between nodes showing unlock relationships
```

### SVG Generation (Hand-rolled, zero deps)
```typescript
// supabase/functions/_shared/svg-renderer.ts
export function renderRoadmapSVG(roadmap: RoadmapJSON): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1800" ...>
    ${renderHeader(roadmap)}
    ${renderPhaseCards(roadmap.phases)}
    ${renderSkillTree(roadmap.skill_tree)}
    ${renderFooter(roadmap)}
  </svg>`;
}
```

### PNG Export (Client-side)
```typescript
// In Framer custom code
async function exportPNG(svgUrl: string): Promise<void> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = svgUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 1800;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "my-100x-roadmap.png";
  a.click();
}
```

**Critical:** SVG must be self-contained (no external image refs) for canvas export to work without CORS tainting.

---

## 10. Supabase Schema

### Tables

```sql
-- Users
-- id = Supabase Auth UUID (auth.uid()). Inserted on first login, NOT gen_random_uuid().
CREATE TABLE users (
  id UUID PRIMARY KEY,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+91',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intake answers (stored separately for analytics future use)
CREATE TABLE intake_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  target_role TEXT,
  timeframe_months INTEGER NOT NULL,
  background_role TEXT NOT NULL,
  experience_years TEXT NOT NULL,
  weak_areas TEXT[] NOT NULL,
  hours_per_week TEXT NOT NULL,
  learning_style TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roadmaps
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  intake_id UUID REFERENCES intake_answers(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'complete', 'failed')),
  roadmap_json JSONB,
  svg_url TEXT,
  generation_attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- share_token / share_enabled deferred to v2

-- Hidden revision history
CREATE TABLE roadmap_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  roadmap_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder scheduling
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('day_3', 'day_6')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (roadmap_id, reminder_type)  -- prevents duplicate reminder inserts
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Users: own data only
-- auth.uid() = Supabase Auth UUID, which IS users.id — direct match, no cast or join needed
CREATE POLICY "users_own" ON users FOR ALL
  USING (auth.uid() = id);

-- Intake answers: own only
CREATE POLICY "intake_own" ON intake_answers FOR ALL
  USING (user_id = auth.uid());

-- Roadmaps: own only (direct UUID match — no subquery needed)
CREATE POLICY "roadmaps_own" ON roadmaps FOR ALL
  USING (user_id = auth.uid());

-- Roadmap revisions: own only
CREATE POLICY "revisions_own" ON roadmap_revisions FOR ALL
  USING (roadmap_id IN (SELECT id FROM roadmaps WHERE user_id = auth.uid()));

-- Reminders: own only
CREATE POLICY "reminders_own" ON reminders FOR ALL
  USING (user_id = auth.uid());

-- NOTE: No share policy in v1. Share system deferred to v2.
```

### pg_cron Jobs

```sql
-- Stuck job cleanup (every 10 minutes)
SELECT cron.schedule('cleanup-stuck-jobs', '*/10 * * * *', $$
  UPDATE roadmaps SET status = 'failed', error_message = 'timeout'
  WHERE status = 'generating'
  AND updated_at < NOW() - INTERVAL '5 minutes';
$$);

-- Reminder sender (every hour)
SELECT cron.schedule('send-reminders', '0 * * * *', $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );
$$);
```

---

## 11. Edge Functions

### Function List

```
supabase/functions/
├── generate/        POST — triggers roadmap generation (async)
├── status/          GET  — poll roadmap status
├── send-reminders/  POST — called by pg_cron, sends due reminder emails
└── _shared/
    ├── llm-provider.ts    — OpenAI/Anthropic adapter
    ├── svg-renderer.ts    — SVG generation from roadmap JSON
    ├── zeno-client.ts     — calls /internal/roadmap-context
    └── roadmap-schema.ts  — Zod schema for LLM output validation
```

### /generate function
```typescript
Deno.serve(async (req) => {
  // 1. Verify JWT
  const user = await verifyJWT(req);

  // 2. Rate limit check (2 per 24h)
  const recentCount = await countRecentGenerations(user.id, 24);
  if (recentCount >= 2) return Response.json({ error: "Rate limit: 2 per day" }, { status: 429 });

  // 3. Parse intake answers from request body
  const intake = await req.json();

  // 4. Create roadmap record
  const roadmapId = await createRoadmapRecord(user.id, intake);

  // 5. Return immediately
  const response = Response.json({ roadmap_id: roadmapId, status: "generating" });

  // 6. Run generation in background
  EdgeRuntime.waitUntil(generateRoadmapBackground(roadmapId, user, intake));

  return response;
});
```

### /send-reminders function
```typescript
Deno.serve(async (req) => {
  // Called by pg_cron hourly
  // Find due reminders: scheduled_at <= NOW() AND status = 'pending'
  const due = await getDueReminders();

  for (const reminder of due) {
    const roadmap = await getRoadmapById(reminder.roadmap_id);
    const emailContent = roadmap.roadmap_json.reminder_emails[reminder.reminder_type];
    await resend.emails.send({
      from: 'roadmap@100xengineers.com',
      to: reminder.user.email,
      subject: emailContent.subject.replace('{{name}}', reminder.user.display_name),
      html: renderEmailTemplate(emailContent.body, reminder.user),
    });
    await markReminderSent(reminder.id);
  }
});
```

---

## 12. Framer Integration

### Custom Code Components Needed

```
1. IntakeOverlay.tsx      — 7-question form, chip selectors, dropdowns
2. RegistrationCard.tsx   — mobile input + Google auth trigger
3. RoadmapLoader.tsx      — polling state, loading animation
4. RoadmapDisplay.tsx     — shows SVG, download SVG button, PNG export button
```

### Supabase Client Init (Framer)
```typescript
// Import via esm.sh CDN in Framer custom code
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://YOUR_PROJECT.supabase.co",  // anon key — safe to expose
  "YOUR_ANON_KEY"
);
```

### Polling Pattern
```typescript
async function pollStatus(roadmapId: string): Promise<void> {
  const interval = setInterval(async () => {
    const { data } = await supabase.functions.invoke('status', {
      body: { roadmap_id: roadmapId }
    });
    if (data.status === 'complete') {
      clearInterval(interval);
      showRoadmap(data.svg_url);
    } else if (data.status === 'failed') {
      clearInterval(interval);
      showRetryButton();
    }
  }, 3000); // poll every 3 seconds
}
```

### Roadmap Page URL Pattern
```
https://your-framer-site.com/roadmap?id=<roadmap_id>
```
On page mount: read `id` from URL params → call status endpoint → handle all states (pending/generating/complete/failed).

---

## 13. Share System

**DEFERRED TO V2.** Not in v1 scope.

Removed: share_token column, share_enabled column, share RLS policy, share CTA in SVG footer, share button in Framer UI.

V2 design note: serve share via dedicated RPC/endpoint scoped to exact token, return redacted payload (SVG only, no personal data). Do not use blanket table SELECT policy.

---

## 14. Reminder System

### Trigger Point
When `generateRoadmapBackground()` completes successfully and status → "complete":
```typescript
const now = new Date();
await insertReminders([
  {
    user_id: userId,
    roadmap_id: roadmapId,
    reminder_type: 'day_3',
    scheduled_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    status: 'pending'
  },
  {
    user_id: userId,
    roadmap_id: roadmapId,
    reminder_type: 'day_6',
    scheduled_at: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
    status: 'pending'
  }
]);
```

### Email Content Source
Both email bodies are pre-generated by the LLM during roadmap creation and stored in `roadmap_json.reminder_emails`. Resend sends exactly what LLM wrote — no second LLM call at send time.

---

## 15. Build Order (For Agents)

Build in this exact order. Each step is deployable and testable before the next.

```
STEP 1: Zeno Worker — add /internal/roadmap-context
  - Modify src/index.ts
  - Add ZENO_INTERNAL_SECRET to Cloudflare secrets
  - Deploy to Cloudflare
  - Test: curl POST to /internal/roadmap-context with secret header + test goal
  - Verify: returns overview + evidence pack

STEP 2: Supabase Setup
  - Create tables (users, intake_answers, roadmaps, roadmap_revisions, reminders)
  - Enable RLS + add policies
  - Enable Google Auth provider in Supabase dashboard
  - Configure redirect URLs for OAuth
  - Set up pg_cron extension + schedule stuck-job cleanup

STEP 3: Shared Edge Function Utilities
  - _shared/roadmap-schema.ts — Zod schema
  - _shared/zeno-client.ts — calls Zeno internal endpoint
  - _shared/llm-provider.ts — OpenAI adapter + Claude stub
  - _shared/svg-renderer.ts — hand-rolled SVG from roadmap JSON

STEP 4: /generate Edge Function
  - JWT verification
  - Rate limit check
  - Intake parsing + roadmap record creation
  - Zeno retrieval
  - LLM generation + Zod validation
  - SVG render + Supabase Storage upload
  - Reminder scheduling
  - EdgeRuntime.waitUntil pattern

STEP 5: /status Edge Function
  - Simple: read roadmap status + svg_url from DB by roadmap_id

STEP 6: /send-reminders Edge Function
  - Query due reminders
  - Send via Resend
  - Mark sent

STEP 7: POC End-to-End Test
  - Trigger /generate with test user JWT
  - Poll /status until complete
  - Verify SVG file in Supabase Storage
  - Check roadmap_json in DB
  - Verify reminder records created

STEP 8: Framer — Intake UI
  - IntakeOverlay component (7 questions)
  - RegistrationCard component (mobile + Google auth popup)
  - Supabase JS client initialization
  - Auth popup + postMessage handler

STEP 9: Framer — Roadmap Result Page
  - URL param reading (roadmap_id)
  - Polling /status
  - Loading state
  - SVG display
  - Download SVG button
  - PNG export (client-side canvas)
  - No share button (v2)

STEP 10: Production Hardening
  - Validate SVG is self-contained (no external refs)
  - Test PNG export cross-browser
  - Test auth popup on mobile (iOS Safari popup blocker)
  - Test auth redirect fallback
  - Verify RLS blocks cross-user data access
  - Load test /generate with concurrent users
  - Verify stuck job cleanup runs
  - Send test reminder emails
```

---

## 16. Common Pitfalls and Risks

### HIGH RISK

**Framer popup blocked on iOS Safari and some Android browsers**  
iOS Safari blocks window.open unless called synchronously inside a user gesture handler. The auth popup will be blocked if there's any await before window.open. Solution: call supabase.signInWithOAuth synchronously on button click, handle the popup URL in the .then().

**SVG canvas tainting on PNG export**  
If SVG references any external resource (images, fonts via URL), canvas.toDataURL() will throw a security error. Solution: all SVG content must be inline. No external image URLs in SVG. Use system font fallbacks, not Google Fonts CDN.

**Supabase Edge Function cold start adding to 150s budget**  
Cold starts can add 500ms–2s. Zeno retrieval (full KV scan on 121+ pages) adds 200-500ms. OpenAI generation adds 10–30s. SVG render adds ~100ms. Total: typically 15–35s. Well within 150s, but monitor with logging.

**LLM producing invalid JSON despite json_object mode**  
GPT-4.1 in json_object mode doesn't guarantee schema compliance, only valid JSON. Zod validation is required. On validation failure: retry once with a tighter prompt. On second failure: mark roadmap failed, don't surface bad data.

**Zeno KV scan slowing down at scale**  
Current search_wiki does full sequential KV read per search term. With 121 pages now it's fast. If wiki grows to 500+ pages, this will become slow. Solution already planned: add `__search_index__` key to Zeno KV during sync.js (pre-built title + excerpt index). Read one key instead of 500.

### MEDIUM RISK

**Framer sessionStorage not persisting through OAuth redirect**  
sessionStorage is tab-specific and survives soft navigation but not new tab opens. The redirect fallback reads back from sessionStorage. Test this flow explicitly on Chrome and Safari.

**Reminder emails hitting spam**  
Resend deliverability is good but sender domain must be verified. Set up SPF/DKIM for the sending domain before launch.

**OpenAI rate limits during high usage**  
GPT-4.1 has per-minute token limits. If multiple users generate simultaneously, requests may queue. Edge Functions handle this gracefully since generation runs async. Add exponential backoff on OpenAI calls.

### LOW RISK

**Supabase anon key exposed in Framer**  
Anon key is designed to be public. RLS policies are the security layer. Verify all RLS policies before launch.

*(Share token collisions risk removed — share system deferred to v2)*

---

## 17. What's Deferred to V2

These are explicitly out of scope for v1. Do not build them now.

```
- Share system (share_token, share_enabled, share RLS, share page)
- Chat editing of roadmap
- Interactive node graph (React Flow + ELK)
- Progress tracking (milestone completion)
- Analytics (PostHog or similar)
- SMS/WhatsApp reminders
- SMS OTP verification for mobile number
- Dynamic prereq suggestions (API call after Q1)
- Global phone number support
- Multiple roadmaps per user
- Roadmap comparison
- Team/cohort view
- Admin dashboard
- Dark mode variant
- Email unsubscribe flow
- Delete account / GDPR data export
- Zeno search index optimization (__search_index__ KV key)
- Claude/Anthropic provider activation (adapter is built, just not enabled)
```

---

## 18. Environment Variables

### Supabase Edge Functions (.env / Supabase secrets)
```
OPENAI_API_KEY=sk-...
ZENO_MCP_URL=https://zeno-wiki-mcp.cohort-c62.workers.dev/internal/roadmap-context
ZENO_INTERNAL_SECRET=<strong random secret>
RESEND_API_KEY=re_...
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
LLM_PROVIDER=openai
```

### Zeno Cloudflare Worker (wrangler secrets)
```
ZENO_INTERNAL_SECRET=<same secret as above>
```

### Framer Custom Code (public — safe)
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

---

## 19. Key Architectural Decisions Summary

| Decision | What | Why |
|---|---|---|
| EdgeRuntime.waitUntil | Return HTTP immediately, run generation async | Avoids timeout on 150s free tier |
| Hand-rolled SVG | Zero deps, full control | Satori has WASM complexity + 2MB cold start |
| Internal Zeno endpoint | Add /internal/roadmap-context to Zeno Worker | MCP OAuth blocks server-to-server calls |
| Pre-generated reminder emails | LLM writes email bodies at roadmap creation time | No second LLM call at send time, personalized |
| Index-first Zeno retrieval | get_index → topic mapping → fetch pages | Reduces irrelevant page fetches |
| Popup OAuth not redirect | window.open + postMessage | Framer state survives, no sessionStorage dance |
| Supabase UUID as users.id | users.id = auth.uid(), not google_sub | Direct RLS match — no cast, no join, no identity mismatch |
| Anon key in Framer | supabase-js with RLS policies | Designed pattern, RLS is the security layer |
| JSON source of truth | Roadmap JSON → SVG + PNG + emails | All outputs from one artifact, consistent |
| Private Storage + signed URLs | SVG in private bucket | Authenticated access only; share system is v2 |
| Share system deferred | No share_token/share_enabled in v1 | Blanket SELECT policy leaks full roadmap_json; safe design requires dedicated RPC |

---

## 20. Continuation Prompt for Next Session

Use this to start the build session:

```
We are building the 100x AI Roadmap Builder — a personalized AI career roadmap generator 
embedded in the 100x Engineers Framer website.

Full implementation plan is at:
C:\Users\visha\Downloads\Roadmap iframe\IMPLEMENTATION_PLAN_V1.md

Read the full plan before starting. All decisions are locked.

Build order starts at STEP 1: Add /internal/roadmap-context to the Zeno Cloudflare Worker.
Zeno Worker source is at: C:\Users\visha\Downloads\100x Wiki\zeno-mcp-server\src\index.ts

Do not assume anything not in the plan. Do not add features not listed. 
Do not start Framer UI before Edge Functions are tested end-to-end.
```

---

*Plan created: 2026-04-23. All decisions locked. Ready for implementation.*
