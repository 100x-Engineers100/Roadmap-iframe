prompt - 
  Continue building the 100x AI Roadmap Builder from these source-of-truth docs in:

  C:\Users\visha\Downloads\Roadmap iframe\FINAL_IMPLEMENTATION_PLAN.md
  C:\Users\visha\Downloads\Roadmap iframe\ROADMAP_JSON_SCHEMA.md
  C:\Users\visha\Downloads\Roadmap iframe\LLM_PROMPT_CONTRACT.md
  C:\Users\visha\Downloads\Roadmap iframe\tasks\lessons.md

  Read all four first and treat them as locked context.

  Important:
  - Do not reopen product debates unless a real implementation blocker appears.
  - V1 is Framer + Supabase + OpenAI + Zeno.
  - This is a 100x AI roadmap builder, not a generic career tool.
  - Roadmap JSON is the source of truth.
  - SVG is the primary rendered artifact.
  - Mobile is compulsory, India-only for v1.
  - Google auth is Supabase popup-first, redirect fallback.
  - Reminders are auto-sent at +3 days and +6 days after roadmap generation.
  - Use expected progress wording only, never tracked progress wording.
  - Zeno retrieval is index-first, evidence-pack based, via a secret-protected internal endpoint.

  Next build steps:
  1. Create Supabase schema
  2. Create SVG layout contract
  3. Create Zeno internal endpoint spec
  4. Start implementation in that order

  Do not summarize the docs back to me unless needed. Start executing.
                                                                             
=======================================================================================


# 100x AI Roadmap Builder - Final Implementation Plan

Date: 2026-04-23
Status: final locked plan for v1
Scope: implementation-ready product and system plan
Purpose: this file is the source of truth for building v1

## 1. Product Definition

### Product Name

`100x AI Roadmap Builder`

### Core Positioning

This is not a generic career roadmap tool.

This is a `100x AI career roadmap builder`.

The user can come from any background:
- student
- designer
- PM
- software developer
- founder
- non-tech

But the destination is always AI-related or AI-enabled.

The system should:
- take the user's current background
- understand their AI goal
- map them into the closest AI transformation path
- use the 100x/Zeno knowledge base as the curriculum substance
- generate a personalized roadmap for 3 or 6 months

### Guardrail

If the user's goal is not AI-related, the system should reframe it into an AI-enabled version before generating the roadmap.

Example:
- non-AI goal: `I want to become a chef`
- reframed AI direction: `Use AI in food content, automation, branding, or creator workflows`

### Product Promise

The roadmap should feel like:
- a structured AI career roadmap
- a 100x-backed learning path
- a polished visual artifact the user can share publicly

## 2. V1 Scope

### Included In V1

- Framer intake flow
- Google sign-in with Supabase Auth
- compulsory Indian mobile number capture
- 3-month or 6-month roadmap generation
- 100x-light branded SVG roadmap
- client-side PNG download from SVG
- private storage with signed access
- public share-token page for roadmap sharing
- automatic reminder emails after 3 days and 6 days
- hidden revision history
- manual retry on failed generation

### Excluded From V1

- chat editing
- analytics
- interactive node graph roadmap
- SMS or WhatsApp reminders
- OTP verification for mobile
- global phone flows
- public source citations in UI

These are v2 candidates.

## 3. Product Decisions

### Timeframe

User chooses:
- `3 months`
- `6 months`

Roadmap structure:
- `3 months -> 3 phases -> 4 weeks each`
- `6 months -> 6 phases -> 4 weeks each`

### Intake Questions

Locked intake sequence:

1. `What should we call you?`
2. `What specific AI outcome do you want?`
3. `What is your current background?`
4. `What are your weakest areas right now?`
5. `How many hours per week can you commit?`
6. `How do you learn best?`
7. `Enter your mobile number`
8. `How long do you want your roadmap to be?`

Note:
- Mobile is compulsory
- Timeframe is the final input before generation/auth

### Q2 Goal Chips

AI-oriented only:
- `Become an AI engineer`
- `Build AI agents`
- `Become an AI product builder`
- `Use AI in my current career`
- `Build AI content or ads`
- `Start an AI automation business`
- `Master diffusion / image-video AI`

Goal input format:
- clickable chips
- editable free text
- if vague, nudge toward concrete outcome

### Background Options

Base options:
- `Student`
- `Software developer`
- `Designer`
- `PM`
- `Founder/operator`
- `Non-tech`
- `Other`

This set can expand later.

### Weak Areas

Base multi-select chips:
- `Programming fundamentals`
- `Web development`
- `AI / LLMs`
- `System design`
- `Data / ML`
- `Product thinking`
- `Deployment`
- `Consistency / accountability`

This set can expand later as needed.

### Weekly Hours

- `2-4`
- `5-8`
- `9-15`
- `15+`

### Learning Style

- `Building projects`
- `Watching videos`
- `Reading docs`
- `Guided tasks`
- `Mixed`

## 4. Brand and Visual Direction

### Theme

Use `100x light theme`.

### Core Colors

- Coral: `#f96846`
- Peach: `#ffeee9`
- Blush: `#fff8f6`
- White: `#ffffff`
- Surface: `#f5f5f3`
- Primary text: `#1a1a1a`
- Muted text scale: `#555`, `#888`, `#aaa`

### Typography

- Main: `Space Grotesk`
- Labels/mono accents: `JetBrains Mono`

### Visual Personality

- clean white canvas
- coral accents
- peach callout cards
- numbered coral circles
- coral left-border accents
- technical but human

### SVG Format

- poster-style dashboard
- tall poster
- `1200 x 1800`

### SVG Header

Show the user's name:

`<name>'s roadmap to become <role>`

### SVG Content Rules

- include skill tree
- cap skill tree to `8 skills`
- max `2 resources per milestone`
- hide exact source citations in UI
- show footer line:

`Built with 100x learning intelligence.`

### Share CTA

Use:

`Share your new beginning: your AI roadmap starts here.`

## 5. High-Level User Flow

### Entry Flow

1. User lands on Framer site
2. User clicks roadmap button
3. Intake UI opens
4. User completes all roadmap inputs
5. User clicks generate
6. Google auth popup starts
7. On auth success, user session is available through Supabase
8. Framer calls generation endpoint
9. Generation begins async
10. User sees roadmap loading state
11. Roadmap completes
12. SVG renders on roadmap page
13. User can download SVG or PNG
14. User can share roadmap via public share token page

### Auth

Use:
- `Supabase Google auth`
- `popup-first`
- `redirect fallback`

### Mobile

India only for v1:
- require 10 digits
- store as `+91XXXXXXXXXX`
- schema should remain global-ready for later

### Reminder Consent Copy

Small visible line:

`By generating your roadmap, you agree to receive personalized roadmap reminders.`

## 6. Architecture

### Frontend

`Framer`

Responsibilities:
- intake UI
- Google auth initiation
- roadmap loading page/state
- signed SVG display
- SVG/PNG download
- share CTA

### Frontend Data Access

Preferred:
- `@supabase/supabase-js` via `esm.sh` in Framer custom code

Fallback:
- raw `fetch()` to Supabase Edge Functions
- pass Supabase JWT in `Authorization: Bearer <jwt>`

Important:
- preferred path is still POC-verified in the actual Framer project
- fallback path remains part of the plan

### Backend

`Supabase only`

Use:
- Supabase Auth
- Supabase Edge Functions
- Supabase Postgres
- Supabase Storage
- Supabase scheduled jobs / cron

No extra hosting dependency in v1.

### LLM Provider

Primary:
- `GPT-4.1`

Output:
- structured JSON

Provider design:
- provider adapter layer
- Claude adapter ready for later

### Rendering

V1 rendering strategy:
- hand-rolled SVG string generation

Not used in v1:
- React Flow
- ELK
- Satori

Reason:
- lower complexity
- predictable poster output
- fewer runtime dependencies

### Export

- store SVG
- PNG export generated client-side from SVG

## 7. Zeno Strategy

### Role of Zeno

Zeno is not a generic all-career knowledge base.

Zeno is:
- the 100x curriculum knowledge base
- the proof layer for what 100x teaches
- the enrichment layer for AI career paths

### Source Strategy

Use this logic:
- general model knowledge maps the user's background to the AI target path
- Zeno provides the curriculum substance
- the system should not force irrelevant Zeno concepts into unrelated paths
- if Zeno is weak for a specific angle, the model can still generate

If Zeno evidence is weak:
- still generate roadmap
- set internal `zeno_confidence = low`

### Retrieval Flow

Locked retrieval strategy:

1. Get Zeno index first
2. Use the index as the routing map
3. Let the model or router identify relevant 100x topics
4. Fetch the relevant pages
5. Build evidence excerpts
6. Pass evidence pack to the LLM within prompt budget

### Retrieval Budget

Do not hard-limit to a tiny page count.

Instead:
- fetch relevant pages based on index mapping
- compress to excerpts
- keep final evidence pack inside a target budget of roughly `12k-20k tokens`

### Internal Endpoint

Add to Zeno Worker:

`POST /internal/roadmap-context`

Protection:
- `Authorization: Bearer ZENO_INTERNAL_SECRET`

Purpose:
- backend-friendly route
- keeps MCP OAuth untouched

### Evidence Pack Shape

Return evidence pack, not raw full pages:

```json
{
  "overview": "short overview excerpt",
  "evidence": [
    {
      "key": "concepts/ai-agents-react",
      "title": "AI Agents React",
      "excerpt": "relevant clipped text...",
      "matched_terms": ["Build AI agents", "AI / LLMs"]
    }
  ],
  "meta": {
    "queries": ["goal...", "weak area..."],
    "result_count": 5
  }
}
```

## 8. Roadmap Generation Logic

### Generation Rule

The model must:
- map the user into the closest AI/applied-AI path
- use general knowledge only to bridge the user into AI
- use Zeno as the main curriculum substance
- avoid generic non-AI career advice

### Prompt Rule

Locked prompt principle:

`Map the user's background and goal to the closest AI/applied-AI transformation path. Use general model knowledge only to bridge from their current background into the AI domain. Use Zeno evidence as the main curriculum and roadmap substance. Do not create a generic career roadmap unrelated to AI. If goal is not AI-related, reframe it into an AI-enabled version before generating.`

## 9. Roadmap JSON Contract

This is the core artifact.

Everything else depends on it:
- SVG renderer
- reminder emails
- hidden revisions
- storage
- share rendering

### Required Shape

```json
{
  "version": "1",
  "roadmap_title": "3-Month AI Engineer Roadmap",
  "user_profile": {
    "name": "Vishal",
    "goal": "Become an AI engineer",
    "background": "Software developer",
    "weak_areas": ["AI / LLMs", "System design"],
    "hours_per_week": "5-8",
    "learning_style": "Building projects",
    "timeframe_months": 3,
    "phone_country": "IN"
  },
  "source_strategy": {
    "domain_mapping": "llm_general_knowledge",
    "zeno_usage": "relevant_enrichment_only",
    "fallback_allowed": true,
    "zeno_confidence": "high"
  },
  "summary": "Short direct coaching summary.",
  "target_outcome": "Concrete AI outcome for the user.",
  "success_metrics": [
    "Metric 1",
    "Metric 2"
  ],
  "assumptions": [
    "Assumption 1"
  ],
  "risks": [
    "Risk 1"
  ],
  "next_7_days": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "phases": [
    {
      "id": "phase-1",
      "title": "Foundation",
      "weeks": "1-4",
      "focus": "What this phase is about",
      "milestones": [
        {
          "title": "Milestone title",
          "type": "concept",
          "priority": "high",
          "done": false,
          "resources": [
            {
              "title": "AI Agents React",
              "source": "zeno",
              "key": "concepts/ai-agents-react"
            },
            {
              "title": "Bridge from current background",
              "source": "model_knowledge"
            }
          ]
        }
      ],
      "weekly_actions": [
        "Action 1",
        "Action 2"
      ]
    }
  ],
  "skill_tree": [
    {
      "name": "AI / LLMs",
      "current_level": 2,
      "target_level": 4,
      "category": "ai",
      "unlocks": ["Agents", "Prompting", "RAG"]
    }
  ],
  "coaching_note": "Short direct note on biggest risk or focus.",
  "reminder_emails": {
    "day_3": {
      "subject": "Day 3 check-in: {{name}}, here's where you should be",
      "preview": "A quick check-in on your roadmap start.",
      "headline": "Day 3 check-in",
      "body_context": "Expected progress guidance based on roadmap, not tracked progress.",
      "cta_label": "Open your roadmap",
      "cta_path": "/roadmap/..."
    },
    "day_6": {
      "subject": "Day 6: Phase 1 is almost done, {{name}}",
      "preview": "You're one week into your roadmap.",
      "headline": "Week 1 check-in",
      "body_context": "Expected week-one completion guidance.",
      "cta_label": "Continue Phase 1",
      "cta_path": "/roadmap/..."
    }
  },
  "download_metadata": {
    "theme": "100x-light",
    "width": 1200,
    "height": 1800,
    "generated_at": "ISO_DATE"
  },
  "evidence_used": [
    {
      "key": "concepts/ai-agents-react",
      "title": "AI Agents React",
      "source": "zeno"
    }
  ]
}
```

### Constraints

- `skill_tree` max `8`
- max `2 resources per milestone`
- 3-month roadmap = exactly `3 phases`
- 6-month roadmap = exactly `6 phases`

## 10. Reminder Email Strategy

### Timing

Reminder schedule is relative to roadmap creation time:
- first reminder at `+3 days`
- second reminder at `+6 days`

### Content

Use pre-generated reminder content created at roadmap generation time.

No second LLM call at send time.

Important:
- the emails refer to expected roadmap progress
- they do not claim actual progress tracking

### Reminder Logic

Examples:
- Day 3 -> what Phase 1 says they should be doing now
- Day 6 -> what should be complete before moving deeper into the roadmap

### Copy Requirement

Use unsubscribe in every email.

## 11. Sharing

### V1 Sharing

- enabled in v1
- share token page shows roadmap only
- do not expose private details
- do not expose phone/email
- do not expose raw intake answers

### Storage Model

- private bucket for stored SVGs
- signed URLs for user access
- public share token page for external sharing

## 12. Rate Limits, Failure, Retry

### Rate Limit

`2 generations per authenticated user per day`

### Status Lifecycle

Required statuses:
- `pending`
- `generating`
- `complete`
- `failed`

### Failure Rules

- if generation exceeds 5 minutes, mark as `failed`
- show manual retry button

### Hidden Revisions

Store revision history silently even in v1.

Reason:
- debugging
- rollback
- future chat editing compatibility

## 13. Supabase Data Model

### Core Tables

#### `profiles`

- id
- email
- full_name
- phone_e164
- phone_country
- created_at
- updated_at

#### `roadmap_requests`

- id
- user_id
- goal
- background
- weak_areas
- hours_per_week
- learning_style
- timeframe_months
- generation_count_for_day
- created_at

#### `roadmaps`

- id
- user_id
- request_id
- status
- timeframe_months
- roadmap_json
- svg_storage_path
- zeno_confidence
- reminder_day3_at
- reminder_day6_at
- reminder_day3_sent_at
- reminder_day6_sent_at
- created_at
- updated_at

#### `roadmap_revisions`

- id
- roadmap_id
- revision_number
- roadmap_json
- created_at

#### `roadmap_share_tokens`

- id
- roadmap_id
- token
- is_active
- created_at
- revoked_at

### RLS Direction

- user can only access their own roadmap rows
- share-token page reads via token-specific path, not raw user rows
- server-side functions own internal operations

## 14. Supabase Edge Functions

### `/generate-roadmap`

Responsibilities:
- authenticate user
- enforce rate limit
- create `pending`
- call Zeno internal endpoint
- call OpenAI
- validate roadmap JSON
- generate SVG
- upload SVG to storage
- store roadmap JSON + metadata + reminders
- mark `complete` or `failed`

### `/roadmap-status`

Responsibilities:
- return roadmap status
- if complete, return signed SVG URL and relevant metadata

### `/retry-roadmap`

Responsibilities:
- allow manual retry on failed roadmap
- respect rate limits

### `/send-reminders`

Responsibilities:
- run on schedule
- find roadmaps due for day 3 or day 6 reminder
- send via Resend
- mark reminder sent

## 15. Scheduling Strategy

Cron can run periodically, for example hourly.

But reminder logic is not day-based.

Selection logic is based on:
- current time
- `reminder_day3_at`
- `reminder_day6_at`
- reminder already sent or not

## 16. Security

### Client Side

Safe to expose:
- Supabase project URL
- Supabase anon key

Not safe to expose:
- service role keys
- OpenAI keys
- ZENO_INTERNAL_SECRET

### Zeno Internal Route

Protected by:
- `Authorization: Bearer ZENO_INTERNAL_SECRET`

### Frontend Access

- auth session via Supabase
- JWT used for Edge Function auth

## 17. POC Requirements

Before full implementation is considered safe, prove these:

1. Framer custom code can initialize Supabase client cleanly
2. Google popup auth works in Framer
3. Redirect fallback works if popup fails
4. Edge Function can call Zeno internal route
5. OpenAI returns valid roadmap JSON
6. SVG generation produces branded poster output
7. SVG upload + signed URL retrieval works
8. Client-side PNG conversion works from stored SVG

## 18. Build Order

Recommended implementation order:

1. Zeno Worker internal route
2. Roadmap JSON validator/schema
3. OpenAI prompt + roadmap generation
4. Hand-rolled SVG generator
5. Supabase schema + storage
6. Edge Functions
7. Framer intake + auth + loading page
8. End-to-end POC
9. Share page
10. Reminder sending

## 19. Final Summary

V1 is a `Framer + Supabase + OpenAI + Zeno` product.

The user:
- gives an AI goal
- picks a 3-month or 6-month plan
- signs in with Google
- gets a branded 100x AI roadmap
- downloads it as SVG/PNG
- shares it publicly
- receives reminder emails after 3 days and 6 days

The backend:
- uses general model knowledge to bridge the user into the AI domain
- uses Zeno as the 100x curriculum proof layer
- generates structured roadmap JSON
- renders a 100x-style poster SVG
- stores private roadmap data with public share-token access

This is the final locked v1 implementation plan.

## 20. Rejected Decisions

These were discussed and explicitly rejected during planning.

### Product Direction Rejected

- Generic career roadmap builder for every industry
- Non-AI roadmap generation without reframing
- Broad “learn anything” product positioning

Why rejected:
- product became too vague
- Zeno would stop being central
- 100x value proposition would weaken

### UX Patterns Rejected

- Entire experience inside a Framer overlay
- Chat-first roadmap builder in v1
- Interactive graph roadmap in v1
- Collecting mobile number inside the core roadmap questions
- Pre-auth email input plus Google email mismatch checking
- Showing raw Zeno sources in the SVG UI

Why rejected:
- too much friction
- too much complexity for v1
- poor conversion risk
- weak maintainability

### Infra / Architecture Patterns Rejected

- Railway / Render / Vercel as required v1 hosting dependency
- Full custom backend outside Supabase for v1
- Direct model-to-MCP ownership of retrieval flow
- Building prompt context by dumping large raw wiki pages
- Dynamic prereq-generation API call before auth
- Satori / React Flow / ELK in v1
- Server-side PNG generation in v1

Why rejected:
- unnecessary dependency expansion
- more moving parts before product proof
- higher ops burden
- pre-auth abuse risk
- overengineering for static poster output

### Reminder Patterns Rejected

- Fixed weekday reminder schedule
- Progress-based reminder claims without real progress tracking
- Pre-ticked reminder consent checkbox

Why rejected:
- reminders must be relative to roadmap creation
- v1 does not track completion
- consent handling needed to stay explicit and honest

## 21. Patterns We Are Following

These are the core architectural/product patterns chosen for v1.

### Source-of-Truth Pattern

- roadmap JSON is the canonical artifact
- SVG and PNG are derived outputs
- reminder email content is derived from roadmap JSON
- future revisions are stored against roadmap JSON

### Product Pattern

- narrow positioning
- low-friction intake
- auth only near generation
- async generation with loading state
- polished shareable artifact

### Retrieval Pattern

- Zeno index-first routing
- relevant page fetches
- evidence-pack compression
- general model knowledge only for bridging user background into AI
- Zeno used as main curriculum substance

### Reliability Pattern

- async status lifecycle
- generation state in database
- retries
- failure marking
- hidden revisions

### Security Pattern

- no sensitive secrets in Framer
- Supabase as trusted layer
- private storage
- signed URLs
- secret-protected internal Zeno route

## 22. End Goal

The end goal of v1 is:

- user lands on Framer
- user describes an AI goal
- system maps user background into a 100x-backed AI path
- user signs in
- roadmap is generated as a branded visual poster
- user downloads and shares it
- user gets two follow-up reminders tied to roadmap timing

The real business goal is:

- showcase that 100x teaches the material needed for practical AI transformation
- turn roadmap generation into a public, shareable acquisition surface
- position 100x as the structured path into AI careers and AI-enabled work

## 23. Inputs and Outputs

### Inputs

User inputs:
- name
- AI goal
- background
- weak areas
- weekly hours
- learning style
- mobile number
- roadmap duration

System inputs:
- Zeno index
- Zeno evidence pages
- OpenAI structured generation
- 100x design system

### Outputs

Primary outputs:
- roadmap JSON
- SVG poster
- PNG export
- share page
- day 3 reminder payload
- day 6 reminder payload

Internal outputs:
- zeno confidence marker
- hidden revisions
- signed storage URL
- share token

## 24. Risks and Pitfalls

### Product Risks

- users enter vague goals
- users enter non-AI goals
- users expect actual progress tracking from reminder emails
- broad user segments may create goals Zeno only partially covers

Mitigation:
- strong goal chips
- AI-only framing
- explicit roadmap wording
- internal low-confidence flag

### Technical Risks

- Framer + Supabase JS integration may need fallback
- Google popup auth may fail in some environments
- Zeno internal retrieval may be slower than expected
- OpenAI may occasionally produce invalid structured output
- client-side PNG conversion can break if SVG is not self-contained
- async jobs can get stuck

Mitigation:
- fallback raw fetch path
- popup-first with redirect fallback
- evidence compression
- schema validation + retry
- self-contained SVG
- failed/stuck job lifecycle

### Prompt Risks

- model may generate generic AI advice not anchored enough in 100x
- model may overuse Zeno even when it is not relevant
- model may hallucinate completion/progress language

Mitigation:
- strict source-strategy instructions
- explicit AI-domain bridge rule
- explicit “expected progress, not tracked progress” reminder wording

## 25. Future Work

These are intentionally out of scope for v1.

### V2 Candidates

- chat editing
- analytics
- interactive roadmap graph
- source viewer / deeper source citations
- richer share cards
- global phone support
- OTP / WhatsApp / SMS
- richer progress tracking
- milestone completion tracking
- progress-aware reminder emails
- Claude as active second provider
- better Zeno retrieval indexing
- dynamic prereq generation

## 26. Next Build Session Instructions

This section is for the next implementation-focused session.

### Build Order For Next Session

1. Read this file first
2. Treat this file as source of truth
3. Do not re-open already locked product debates unless blocked
4. Implement schema contracts before UI polish
5. Validate each subsystem with a small POC before integrating everything

### Recommended Immediate Next Tasks

1. Write the final roadmap JSON schema and validator
2. Write the OpenAI system prompt and structured output contract
3. Write the SVG layout contract
4. Write Supabase schema
5. Implement Zeno internal route

### Non-Negotiable Rules For Build Session

- do not reintroduce generic non-AI roadmap scope
- do not move mobile into the main roadmap questions
- do not add extra hosting unless Supabase clearly fails
- do not expose raw Zeno pages in UI
- do not claim actual user progress in reminder emails
- do not rely on unvalidated Framer/Supabase behavior without a quick POC

## 27. Notes For Schema Session

When creating the roadmap JSON schema, preserve these constraints:

- 3 months = 3 phases
- 6 months = 6 phases
- 4 weeks per phase
- skill tree max 8
- resources max 2 per milestone
- sources hidden in UI
- reminder payloads included in artifact
- source strategy encoded in artifact

## 28. Notes For Prompt Session

When writing the prompt:

- keep the tone direct, not hype-heavy
- ensure the output is AI-domain-specific
- use Zeno as curriculum evidence, not as a random citation dump
- allow general knowledge to bridge user background into AI
- do not overfit the roadmap only to software engineers
- ensure user from non-tech can still get an AI-enabled path

## 29. Notes For SVG Session

When writing the SVG contract:

- use the 100x light palette
- prioritize readability over excessive ornament
- make it feel premium and shareable
- emphasize poster quality over dashboard complexity
- show user name and target role strongly
- keep sources invisible in UI
- keep footer subtle

## 30. Final Build Intent

This file should be enough to build v1 without reopening architecture from scratch.

If a future implementation session conflicts with this file:
- prefer this file unless an implementation blocker is proven
- if a blocker is proven, update this file before continuing
