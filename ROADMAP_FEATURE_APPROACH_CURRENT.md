# Personalized Roadmap Feature - Current Approach Notes

Date: 2026-04-23
Status: design discussion still in progress
Purpose: capture where the product/system direction currently stands, without treating this as a final implementation plan.

## Original Goal

Add a new roadmap tool to the existing Framer website.

The user should be able to:
- click a roadmap button
- answer a short set of personalization questions
- register/sign in only when they choose to generate
- get a personalized career roadmap
- edit the roadmap through chat
- download the final roadmap as SVG or PNG
- receive personalized reminder emails later

The feature should feel like both:
- a visual artifact generator
- a career coach

The goal is not just a static roadmap image. The goal is a generated, editable, personalized roadmap experience.

## Tech Stack We Are Working With

Current intended stack:
- Framer website as the public frontend entry point
- custom app/backend layer for auth, generation, persistence, and rendering
- Google Auth for email identity
- mobile number collected during registration
- Supabase for users, sessions, answers, roadmaps, messages, versions, and share state
- Zeno MCP server for knowledge retrieval
- OpenAI GPT API as the first LLM provider
- Claude/Anthropic kept as a switchable provider option
- Resend for email reminders
- cron job for twice-weekly personalized reminders
- SVG as the primary visual export format
- PNG generated from the rendered SVG

Known deployed Zeno MCP URL:
- `https://zeno-wiki-mcp.cohort-c62.workers.dev/mcp`

## Current Product Flow Direction

Current agreed direction:

1. User visits the Framer website.
2. User clicks the roadmap button.
3. A Framer overlay/card opens for the intake questions.
4. User answers around 5 personalization questions.
5. User clicks `Generate Roadmap`.
6. A registration card/popup appears.
7. Registration card asks for:
   - email
   - mobile number
   - Google sign-in/continue button
8. User continues with Google.
9. Backend verifies the Google-authenticated email.
10. Backend creates or updates the user in Supabase.
11. User is redirected to the roadmap page.
12. Roadmap page shows a loading state while the roadmap is generated.
13. User sees the generated roadmap.
14. User can ask for edits in chat.
15. Chat edits modify the current roadmap in place.
16. User can download SVG or PNG.
17. User can share the roadmap through a per-user shareable link.
18. Reminder system later sends personalized emails twice weekly.

## Important Auth / Registration Decision

Earlier idea:
- ask for phone somewhere near final review
- then save draft
- then start Google auth

This was rejected as too messy.

Current preferred flow:
- intake questions first
- user clicks generate
- then registration popup appears
- registration popup asks for email and mobile
- then Google sign-in starts

This keeps the product flow simpler:
- questions are for personalization
- registration popup is for account/contact information
- Google auth is for verified identity

## Email and Mobile Number Handling

Google verifies email identity.

Google does not verify the mobile number for this app.

Current decision:
- collect mobile number in the registration card
- store it in Supabase
- treat it as unverified in v1
- do not add SMS OTP in v1 unless there is a real use case for SMS/WhatsApp reminders

Recommended backend behavior:
- user types email and mobile number in registration popup
- user then signs in with Google
- backend compares typed email with Google email
- if they match, continue
- if they do not match, block and ask user to either edit email or sign in with the matching Google account

Reason:
- prevents storing a user-entered email that does not match verified Google identity
- avoids fake-account confusion
- keeps v1 simple

## What Might Break In Registration/Auth

Known risks:
- user types one email but signs in with another Google account
- user closes Google popup or redirect flow
- Framer overlay state can be lost during auth redirect
- mobile number may be fake or badly formatted
- generation can take time, so auth callback should not block while generating

Current mitigation direction:
- create a pending session before redirecting to Google
- store intake answers, typed email, and mobile number in backend/Supabase
- after Google callback, attach the authenticated user to the pending session
- redirect to roadmap page fast
- generate roadmap from the roadmap page/loading flow, not inside auth callback

## Framer Angle

Current decision:
- use Framer for the public page and initial interaction
- use overlay/card for the short intake flow
- do not try to put the entire app inside a Framer overlay

Reason:
- Framer overlays are good for lightweight entry flows
- the generated roadmap experience is too complex for a simple overlay
- roadmap page needs chat, downloads, share state, loading state, and persistence

Current preferred UX structure:
- Framer landing page
- roadmap button
- intake overlay
- registration popup/card
- dedicated roadmap page after auth

Framer-specific concern:
- auth redirects and complex state are fragile if everything lives only in Framer client state

Current approach:
- before Google auth, persist a pending session on the backend
- use Framer only for entry/intake UX
- use the app/backend for durable state

## Zeno MCP Usage Direction

The Zeno MCP server is deployed on Cloudflare and will be used as the knowledge source.

Current decision:
- the LLM should not directly own the retrieval flow in v1
- backend should retrieve Zeno context first
- backend should pass a compact evidence pack to the active LLM provider

Reason:
- keeps OpenAI and Claude switchable
- avoids coupling the whole architecture to one provider's tool-calling style
- avoids sending the whole wiki to the model
- keeps roadmap generation more deterministic

Current v1 retrieval approach:
- backend calls Zeno MCP
- use scoped retrieval based on user's answers
- retrieve only relevant pages/snippets
- compress into a short evidence pack
- pass evidence pack to GPT/Claude

Known current MCP capabilities from prior review:
- `get_index`
- `get_overview`
- `list_pages`
- `get_page`
- `search_wiki`
- `visualize`

Current limitation:
- the deployed MCP server currently looks more like a structured wiki retriever and visualizer
- it does not currently expose a dedicated roadmap-context tool

Future improvement:
- add a dedicated MCP tool such as `build_roadmap_context(profile)`

## LLM Provider Direction

Current decision:
- use GPT API first
- keep Claude/Anthropic as a switchable option
- do not make generation logic provider-specific

Recommended architectural direction:
- create a provider-neutral LLM interface
- configure provider using an environment variable such as `LLM_PROVIDER=openai` or `LLM_PROVIDER=anthropic`
- keep provider-specific code behind adapter functions
- keep comments in code explaining how to switch provider

Important principle:
- Zeno retrieval should happen before the LLM call and outside the provider adapter

Reason:
- then both GPT and Claude receive the same user profile, evidence pack, and roadmap schema
- switching models becomes a config change, not an architecture rewrite

## Roadmap Artifact Direction

Current decision:
- roadmap JSON is the source of truth
- SVG and PNG are rendered outputs

This is important.

Do not make the LLM generate only an image.

The LLM should generate structured roadmap JSON containing:
- user goal
- current profile summary
- target career
- skill gaps
- phases
- milestones
- weekly actions
- projects
- suggested resources
- coaching notes
- confidence/priority metadata

Then the app renders:
- visual roadmap SVG
- PNG export from SVG
- email reminder snippets from the same roadmap JSON
- chat-edited roadmap updates from the same roadmap JSON

## Roadmap Style Direction

The roadmap should combine:
- career coaching
- visual artifact
- study/execution plan

It should not force only one style.

The likely output should support multiple views:
- visual roadmap view
- skill-gap view
- weekly execution view

Current decision:
- all views should come from one canonical roadmap JSON

## Chat Edit Direction

Current decision:
- chat edits modify the current roadmap in place

Important nuance:
- even if the product shows "current roadmap" only, the backend should still keep hidden revision history

Reason:
- debugging
- rollback
- auditability
- preventing accidental data loss

User-facing behavior:
- "Make this roadmap more focused on AI engineering"
- system updates current roadmap
- same roadmap page reflects the change

Backend behavior:
- current roadmap changes
- previous state is stored silently as revision history

## Sharing Direction

Current decision:
- roadmap should be shareable per user

Recommended direction:
- private by default
- user can generate a share link
- share link uses a random token
- user can revoke the share link

Do not expose private roadmap by predictable user ID.

Good share pattern:
- `/roadmap/share/<random-token>`

## Resource Source Decision

Question discussed:
- should resources come only from Zeno, or Zeno plus a fallback set?

Current decision:
- Zeno is the primary source
- use a small curated fallback set only when Zeno has weak or no results

Reason:
- Zeno keeps the product aligned with the 100x knowledge base
- fallback prevents empty or low-quality roadmaps
- fallback should not dominate if Zeno has relevant material

Fallback should be small and controlled, not random internet search.

## What We Disagree With / Rejected

Rejected:
- asking mobile number inside the 5-question intake
- generating roadmap inside the Google auth callback
- relying only on Framer client state through auth redirect
- dumping the full Zeno wiki into the model
- making Claude or GPT directly responsible for all retrieval in v1
- direct image-only generation as the primary artifact
- public roadmap URLs based on predictable IDs
- adding SMS OTP in v1 without a real SMS/WhatsApp requirement

## Current Open Questions

These are still open and should be discussed before implementation:

1. Where exactly will the dedicated roadmap page live?
   - inside Framer as an embedded app
   - separate Next.js/custom app route
   - subdomain such as `app.domain.com/roadmap`

2. What backend platform will host the roadmap orchestration?
   - Supabase Edge Functions
   - Cloudflare Workers
   - Vercel/Next.js API routes
   - another backend

3. How should the Framer page communicate with backend?
   - direct API calls from Framer custom code
   - embedded iframe app
   - redirect to external app page

4. What exact 5 intake questions should be asked?

5. Should mobile number be required or optional?

6. Should typed email be editable after Google mismatch?

7. Should roadmap generation start automatically after auth, or only after landing on roadmap page?
   - current leaning: start after landing on roadmap page

8. Should roadmap share links be public forever until revoked, or expire automatically?

9. Should reminder emails start automatically after generation, or ask user to opt in?

10. What visual style should the roadmap artifact use?
   - this still needs product/design exploration

11. Should generated roadmap resources cite exact Zeno pages?

12. Should v1 include curated fallback resources, and where should they live?
   - database table
   - config file
   - markdown file

13. Should roadmap chat edits require a new LLM call every time, or can small edits be handled locally?

## Current Mental Model

This feature is not one feature. It is four systems working together:

1. Acquisition/intake system
   - Framer button and intake overlay

2. Registration/auth system
   - email, mobile, Google identity, pending session

3. Roadmap intelligence system
   - Zeno retrieval, evidence pack, GPT/Claude generation, roadmap JSON

4. Lifecycle system
   - saved roadmap, share links, chat edits, downloads, reminder emails

Trying to build all four at once without clean boundaries will create confusion.

## Current Best Next Discussion

Before asking for a final implementation plan, the next useful discussion should be one piece at a time.

Suggested next topic:
- exact user journey and state transitions from `Generate Roadmap` click to roadmap page loading

After that:
- backend platform choice
- Supabase schema
- roadmap JSON schema
- Zeno evidence pack format
- Framer integration method

## Continuation Prompt

Use this prompt in the next chat if context is lost:

```text
Continue from:
C:\Users\visha\Downloads\Roadmap iframe\ROADMAP_FEATURE_APPROACH_CURRENT.md

We are still discussing architecture and product approach, not writing code yet.

Current agreed direction:
- Framer landing page with roadmap button
- intake overlay for around 5 questions
- user clicks Generate Roadmap
- registration card appears asking email and mobile number
- user signs in with Google after registration card
- backend verifies typed email against Google email
- backend stores email and mobile in Supabase
- user redirects to roadmap page
- roadmap page shows generation loading
- backend retrieves scoped context from Zeno MCP
- GPT API is first LLM provider
- Claude should remain switchable through a provider adapter
- roadmap JSON is source of truth
- SVG/PNG are rendered outputs
- chat edits modify current roadmap in place while backend keeps hidden revision history
- roadmap is private by default but shareable per user through random token link
- Zeno is primary resource source, curated fallback only if Zeno results are weak

Do not give a giant implementation plan yet.
Discuss one step/feature/technicality at a time, challenge assumptions, and identify what might break.
```
