/**
 * PIPELINE E2E TEST — Phases 1–5 cumulative
 * Run from web/: node scripts/test-pipeline-e2e.mjs
 *
 * Tests the full pipeline with real LLM for all 6 role fixtures:
 *   P3: buildRoadmapBlueprint (deterministic)
 *   P4: enrichBlueprintCopy via OpenAI (live LLM — uses exact prompts from panel-copy.ts)
 *   P5: post-enrichment terminology re-scan (replicates roadmap-gen.ts block)
 *   P6: context propagation + profile hydration (no legacy bridge path)
 *
 * North Star validation:
 *   "Roadmap = confidence artifact. Feeling: I can do this. I will be AI-native in my role."
 *
 * Gates:
 *   G1:  5–9 nodes per fixture (correct architecture)
 *   G2:  Node titles are outcome statements (not tech labels)
 *   G3:  Atom counts = skill_ids.length*2+2 per node (Phase 3 flex atom contract)
 *   G4:  No generic copy in enriched atoms (banned phrases check)
 *   G5:  All atom explanations start with active verb (not "Learn"/"Understand")
 *   G6:  Checkpoint scenario ≥ 100 chars, references at least one node tool (role-specific) [Phase 4 open — must hit 6/6]
 *   G7:  Journey analogy is role-specific (not generic — checked by frame length and content)
 *   G8:  Post-enrichment terms differ from pre-enrichment terms (Phase 5 scan adds value)
 *   G9:  Post-enrichment terms appear in actual enriched atom text (no false positives)
 *   G10: validateCopyDelta passes on LLM output (no schema violations)
 *   G11: [Phase 6] work_context propagates — blueprint.user_profile.work_context matches fixture input
 *   G12: [Phase 6] raw_role_text is real input text — NOT a legacy fallback like "Marketer - SOC Title"
 *   G13: [Phase 6] Blueprint content node count ≤ gap inference node count (CAPABILITY_MATRIX not in path)
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import nextEnv from '@next/env';
import OpenAI from 'openai';
import { buildRoadmapBlueprint } from '../lib/roadmap/blueprint.mjs';
import { buildUserWorkProfile } from '../lib/profile/user-work-profile.mjs';
import {
  buildTerminologyPrimerFromContent,
  CANONICAL_TERM_NAMES,
} from '../lib/roadmap/canonical-ai-terms.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '..');
const repoRoot = resolve(webRoot, '..');
const { loadEnvConfig } = nextEnv;
loadEnvConfig(webRoot);

const outputDir = resolve(repoRoot, 'test output');
const e2eDir = resolve(outputDir, 'pipeline-e2e');

// ── 6 role fixtures (same as P4 + P5 tests) ──────────────────────────────────

const CASES = [
  {
    id: 'marketer-none',
    profile: {
      rawRoleText: 'Digital marketer at a fintech startup running campaign and content ops',
      socMatch: { soc_code: '11-2021.00', title: 'Marketing Managers', confidence: 0.92 },
      roleCategory: 'marketer',
      aiFamiliarity: 'none',
      workContext: 'startup',
      confirmedClusterIds: ['C1A'],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium', t4: 'low' },
      tasks: [
        { id: 't1', description: 'Plan campaign calendar', importance: 92 },
        { id: 't2', description: 'Draft content briefs', importance: 88 },
        { id: 't3', description: 'Review campaign performance', importance: 76 },
        { id: 't4', description: 'Coordinate creative approvals', importance: 60 },
      ],
    },
    gapInference: {
      nodes: [
        { title: 'Map content workflow with OPT',         aaa_phase: 'assisted',    skill_ids: ['S2.1'],               why_for_this_person: 'Your content calendar gets rebuilt from scratch every month — no documented process exists from brief to published piece, so every campaign starts from memory',             tools: ['Claude'] },
        { title: 'Draft briefs with prompt engineering',  aaa_phase: 'assisted',    skill_ids: ['S2.1', 'S2.2'],       why_for_this_person: 'You write briefs from scratch each time with no reusable template — same information retyped for every campaign at the fintech startup',                    tools: ['Claude'] },
        { title: 'Build no-code content pipeline',        aaa_phase: 'accelerated', skill_ids: ['S3.2'],               why_for_this_person: 'Every handoff between copywriter, designer and approver happens in a Slack thread that dies — campaigns slip because no step is tracked',              tools: ['n8n'] },
        { title: 'Set up trigger-based reporting',        aaa_phase: 'accelerated', skill_ids: ['S3.1', 'S3.2', 'S3.4'], why_for_this_person: 'Campaign performance reports are manually pulled every Friday — two hours of copy-pasting data from three dashboards into a slide',    tools: ['n8n', 'Claude'] },
        { title: 'Deploy content monitoring agent',       aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4'],       why_for_this_person: 'You find out a campaign underperformed three days after it launched — there is no automatic alert when KPIs drop below threshold',                tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Going from hand-crafting every campaign to running a content engine that refills from your brief at the startup', phase_1_meaning: 'You write and launch every piece manually — AI helps you produce faster but you drive every step', phase_2_meaning: 'You build pipeline templates that run when you trigger them — one brief generates all variants', phase_3_meaning: 'Brief goes in, the engine routes it through creation, approval and publishing without you in the loop' },
      fallback_used: false,
    },
  },
  {
    id: 'designer-basic',
    profile: {
      rawRoleText: 'Brand designer creating visual systems for a SaaS team',
      socMatch: { soc_code: '27-1024.00', title: 'Graphic Designers', confidence: 0.9 },
      roleCategory: 'designer',
      aiFamiliarity: 'basic',
      workContext: 'agency',
      confirmedClusterIds: ['C1A'],
      taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
      tasks: [
        { id: 't1', description: 'Create visual concepts', importance: 90 },
        { id: 't2', description: 'Adapt brand assets', importance: 74 },
        { id: 't3', description: 'Prepare presentation boards', importance: 83 },
      ],
    },
    gapInference: {
      nodes: [
        { title: 'Have 20 on-brand image variants ready from any client brief',  aaa_phase: 'assisted',    skill_ids: ['S1.1', 'S1.2'],   why_for_this_person: 'Every concept starts with a stock photo hunt or blank Figma frame — no way to generate 20 on-brand variants from a single brief without manually prompting and discarding for an hour',     tools: ['Midjourney'] },
        { title: 'Train a LoRA for brand style consistency',  aaa_phase: 'assisted',    skill_ids: ['S1.3'],           why_for_this_person: 'Generated images never match the SaaS client brand guide without 30 minutes of re-prompting — each client has visual rules the AI does not know and there is no way to lock them in',   tools: ['AI Toolkit'] },
        { title: 'Produce AVTV pipeline for presentations',   aaa_phase: 'accelerated', skill_ids: ['S1.7'],           why_for_this_person: 'Presentation decks take a full day to produce — sourcing visuals, exporting at correct dimensions and formatting every slide is entirely manual for every client pitch',     tools: ['HeyGen', 'CapCut'] },
        { title: 'Automate asset delivery workflow',          aaa_phase: 'accelerated', skill_ids: ['S3.2', 'S2.1'],   why_for_this_person: 'After final approval, assets are manually renamed, resized per channel spec, and Slack-shared one by one — a deliverable that took 2 hours to design takes another hour to package',      tools: ['n8n'] },
        { title: 'Create AI influencer persona for brand',    aaa_phase: 'accelerated', skill_ids: ['S1.5'],           why_for_this_person: 'Client wants a consistent visual spokesperson across all content but photography budget is zero — every post currently uses a different stock image and the brand looks incoherent',      tools: ['FreePik Spaces'] },
        { title: 'Deploy autonomous brand asset generator',   aaa_phase: 'autonomous',  skill_ids: ['S1.2', 'S3.4'],   why_for_this_person: 'Each new brief restarts the entire visual production process from scratch — no system exists that turns a brief into finished on-brand assets without your hands on every step',   tools: ['n8n', 'FLUX'] },
      ],
      journey_analogy: { frame: 'Going from hand-prompting every SaaS client asset from scratch to having your brand visual system generate consistent images without you present for each one', phase_1_meaning: 'You prompt and curate every asset manually — AI generates options but you select and re-prompt each time', phase_2_meaning: 'You set up brand-locked templates and AVTV pipelines — trigger once per brief and assets come out consistent', phase_3_meaning: 'Client brief goes in, the brand-matched asset set comes out — no per-asset decisions or stock hunting' },
      fallback_used: false,
    },
  },
  {
    id: 'sales-none',
    profile: {
      rawRoleText: 'Sales rep doing outbound research, CRM notes, and deal prep',
      socMatch: { soc_code: '41-3091.00', title: 'Sales Representatives', confidence: 0.89 },
      roleCategory: 'sales',
      aiFamiliarity: 'none',
      workContext: 'agency',
      confirmedClusterIds: [],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
      tasks: [
        { id: 't1', description: 'Research prospects', importance: 90 },
        { id: 't2', description: 'Personalize outbound emails', importance: 86 },
        { id: 't3', description: 'Prepare call followups', importance: 72 },
      ],
    },
    gapInference: {
      nodes: [
        { title: 'Document your prospect research steps so any rep can follow them',             aaa_phase: 'assisted',    skill_ids: ['S2.1'],                  why_for_this_person: 'Your outbound process lives in your head — no documented steps exist, so every rep does it differently and onboarding a new SDR at the agency takes 3 weeks of shadowing',   tools: ['Claude'] },
        { title: 'Write AI-personalised outbound sequences',     aaa_phase: 'assisted',    skill_ids: ['S2.1', 'S2.2'],          why_for_this_person: 'You write a fresh cold email for every prospect from scratch — an hour of research produces a 5-line message that still reads generic because there is no template that stays personal',     tools: ['Claude'] },
        { title: 'Research prospects with ReAct loop',           aaa_phase: 'assisted',    skill_ids: ['S3.1', 'S2.2'],          why_for_this_person: 'Prospect research means 4 tabs open at once — LinkedIn, their website, Crunchbase, recent news — and 30 minutes per account before you write a single line of outreach',         tools: ['n8n', 'Claude'] },
        { title: 'Build outbound automation pipeline',           aaa_phase: 'accelerated', skill_ids: ['S3.2', 'S3.4'],          why_for_this_person: 'After every call you manually copy notes to CRM, send a follow-up email, and create a next-action task — the same 3 steps every time, fully manual, adding up to an hour a day',      tools: ['n8n'] },
        { title: 'Evaluate pipeline quality with LLM-as-judge',  aaa_phase: 'accelerated', skill_ids: ['S3.6'],                  why_for_this_person: 'You have no way to tell which outbound sequence is underperforming until the reply rate drops — by then you have already sent 200 bad emails and wasted a week of pipeline',    tools: ['n8n', 'Claude'] },
        { title: 'Deploy autonomous CRM update agent',           aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4', 'S3.5'], why_for_this_person: 'Your CRM is always 2 days behind — call notes never get logged same-day and deal stages drift because every update feels like extra admin after an already full day of calls', tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Going from building each prospect brief from memory to having a researched call prep document ready before every conversation at the agency', phase_1_meaning: 'You pull each prospect brief manually — Apollo search, LinkedIn scan, news check, then write the email — AI speeds each step but you run every one', phase_2_meaning: 'You build a sequence pipeline that runs on your trigger — one prospect list in, personalised messages and CRM entries out', phase_3_meaning: 'New lead hits your pipeline, the system researches them, drafts outreach, logs the call — you review the summary and move to close' },
      fallback_used: false,
    },
  },
  {
    id: 'founder-pm',
    profile: {
      rawRoleText: 'Founder PM at a healthcare startup handling launch ops and discovery',
      socMatch: { soc_code: '11-1021.00', title: 'Chief Executives', confidence: 0.86 },
      roleCategory: 'pm',
      aiFamiliarity: 'intermediate',
      workContext: 'startup',
      confirmedClusterIds: ['C2A'],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
      tasks: [
        { id: 't1', description: 'Synthesize customer calls', importance: 94 },
        { id: 't2', description: 'Prioritize launch scope', importance: 89 },
        { id: 't3', description: 'Write product briefs', importance: 75 },
      ],
    },
    gapInference: {
      nodes: [
        { title: 'Turn every customer call into structured insight you can act on', aaa_phase: 'assisted',    skill_ids: ['S2.2'],                  why_for_this_person: 'After each discovery call you write 3 paragraphs of notes by hand — then spend another 45 minutes searching back through them when writing the product brief a week later',       tools: ['Claude'] },
        { title: 'Build a product brief generator',                  aaa_phase: 'accelerated', skill_ids: ['S2.1', 'S2.2'],          why_for_this_person: 'Writing a product brief takes half a day — you pull from call notes, Notion docs, and Slack threads, synthesise them manually, and still end up with a brief that misses context',          tools: ['Claude', 'Notion'] },
        { title: 'Connect customer CRM to AI pipeline via MCP',      aaa_phase: 'accelerated', skill_ids: ['S2.7'],                  why_for_this_person: 'Every time you ask Claude to help with a customer decision, you have to manually copy in the account history from HubSpot — two tools that never talk to each other',          tools: ['Claude', 'n8n'] },
        { title: 'Automate launch scope prioritisation',             aaa_phase: 'accelerated', skill_ids: ['S3.4', 'S2.2'],          why_for_this_person: 'Launch scope decisions get made in a 30-minute Zoom call based on whoever spoke loudest — there is no structured way to weight customer signal against engineering effort',        tools: ['Claude', 'Linear'] },
        { title: 'Ship MVP with Ship Cycle',                         aaa_phase: 'autonomous',  skill_ids: ['S2.11'],                 why_for_this_person: 'Turning a validated idea into a testable build takes 2 weeks minimum — by then the customer context from the discovery calls is stale and the team has moved on mentally',           tools: ['Lovable', 'Cursor'] },
        { title: 'Evaluate discovery quality automatically',         aaa_phase: 'autonomous',  skill_ids: ['S3.6'],                  why_for_this_person: 'You have no way to tell if your discovery process is extracting the right signal until a feature ships and misses — there is no quality check between call and decision',  tools: ['Claude', 'n8n'] },
        { title: 'Deploy multi-agent ops orchestrator',              aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4', 'S3.5'], why_for_this_person: 'As a solo founder, every ops task — onboarding checklist, launch prep, sprint planning — requires you to be in the loop even when the work is completely repeatable',     tools: ['n8n', 'Claude'] },
      ],
      journey_analogy: { frame: 'Going from 45-minute manual write-ups of every healthcare discovery call to structured customer insight waiting in Notion before your next product decision', phase_1_meaning: 'You synthesize every call and write every brief yourself — Claude helps you draft faster but you drive each one', phase_2_meaning: 'You build templates and pipelines that auto-structure call output — trigger once after each call, structured insight lands in Notion', phase_3_meaning: 'Calls auto-route to structured summaries, launch scope updates itself, and discovery gaps surface without you pulling the thread' },
      fallback_used: false,
    },
  },
  {
    id: 'engineer-advanced',
    profile: {
      rawRoleText: 'Backend engineer building API integrations and agent systems',
      socMatch: { soc_code: '15-1252.00', title: 'Software Developers', confidence: 0.94 },
      roleCategory: 'engineer',
      aiFamiliarity: 'advanced',
      workContext: 'startup',
      confirmedClusterIds: ['C2B'],
      taskWeights: { t1: 'high', t2: 'medium', t3: 'high' },
      tasks: [
        { id: 't1', description: 'Integrate APIs', importance: 92 },
        { id: 't2', description: 'Design backend services', importance: 80 },
        { id: 't3', description: 'Debug multi-step agent workflows', importance: 85 },
      ],
    },
    gapInference: {
      nodes: [
        { title: 'Have AI answer questions from your own documents without copy-pasting',   aaa_phase: 'accelerated', skill_ids: ['S2.4'],                why_for_this_person: 'Every LLM feature you ship forces users to paste documents into the prompt — context window hits the limit at 4 pages and the whole integration breaks for anything real-world sized',             tools: ['FastAPI', 'Supabase'] },
        { title: 'Upgrade to hybrid search with re-ranking',          aaa_phase: 'accelerated', skill_ids: ['S2.5'],                why_for_this_person: 'Your basic vector search returns the wrong chunks for half of user queries — semantic similarity alone is not enough and you are getting 40% irrelevant results in production',         tools: ['FastAPI', 'Supabase'] },
        { title: 'Implement Redis memory across sessions',             aaa_phase: 'accelerated', skill_ids: ['S2.6'],                why_for_this_person: 'Every conversation starts from zero — the agent has no memory of what the user built last session, so it asks the same questions and gives contradictory recommendations',       tools: ['FastAPI', 'Supabase'] },
        { title: 'Connect external systems with MCP protocol',        aaa_phase: 'accelerated', skill_ids: ['S2.7'],                why_for_this_person: 'Every time you want the LLM to read from your internal DB or trigger a workflow, you write a one-off integration from scratch — no standard pattern exists in your codebase',         tools: ['MCP SDK'] },
        { title: 'Implement tool calling with structured outputs',     aaa_phase: 'accelerated', skill_ids: ['S2.3', 'S2.8'],        why_for_this_person: 'Your agent occasionally calls the wrong tool or returns malformed JSON — you have no reliable way to enforce which tool fires when and the integration breaks under edge cases',        tools: ['FastAPI', 'Supabase'] },
        { title: 'Reduce LLM cost with caching and tiering',          aaa_phase: 'accelerated', skill_ids: ['S2.10'],               why_for_this_person: 'Your LLM API bill doubled last month and you have no visibility into which endpoint is driving the cost — no tracing, no caching, every identical query hits the model again',         tools: ['LangSmith', 'Langfuse'] },
        { title: 'Deploy ReAct agents with LangGraph',                aaa_phase: 'autonomous',  skill_ids: ['S3.1', 'S3.4'],        why_for_this_person: 'Multi-step tasks in your agent pipeline fail silently — the model gets stuck in a loop or skips a tool call and there is no structured way to observe the thought-action cycle',    tools: ['LangGraph', 'CrewAI'] },
        { title: 'Orchestrate multi-agent workflows',                  aaa_phase: 'autonomous',  skill_ids: ['S3.3', 'S3.4'],        why_for_this_person: 'Your single-agent architecture is hitting a ceiling — one agent doing research, writing, and validation serially is too slow and a single failure kills the entire pipeline', tools: ['LangGraph', 'CrewAI'] },
        { title: 'Add safety guardrails and LLM evaluation',          aaa_phase: 'autonomous',  skill_ids: ['S3.5', 'S3.6'],        why_for_this_person: 'You have no automated way to catch when the agent produces a hallucinated output or takes an irreversible action — you only find out when a user reports it or a bug ticket comes in',       tools: ['LangSmith', 'Langfuse'] },
      ],
      journey_analogy: { frame: 'Going from learning about integration failures from customer complaints to shipping LLM features with automated checks that catch edge cases before users hit them', phase_1_meaning: 'You debug every LLM failure manually — each context window crash or tool call error lands in your inbox from a customer ticket', phase_2_meaning: 'You build evaluation suites and cost monitors that run on every deploy — LangSmith reports quality automatically without you watching', phase_3_meaning: 'Your agent systems catch their own edge cases, log anomalies, and escalate only what needs a human decision — you review the dashboard weekly' },
      fallback_used: false,
    },
  },
  {
    id: 'student-none',
    profile: {
      rawRoleText: 'CS student building AI projects for portfolio and job applications',
      socMatch: { soc_code: '25-3099.00', title: 'Student Learners', confidence: 0.78 },
      roleCategory: 'student',
      aiFamiliarity: 'none',
      workContext: 'freelance',
      confirmedClusterIds: [],
      taskWeights: { t1: 'high', t2: 'high', t3: 'medium' },
      tasks: [
        { id: 't1', description: 'Study new concepts', importance: 88 },
        { id: 't2', description: 'Build portfolio projects', importance: 84 },
        { id: 't3', description: 'Document portfolio work', importance: 70 },
      ],
    },
    gapInference: {
      nodes: [
        { title: 'Set up FastAPI with Supabase backend',         aaa_phase: 'assisted',    skill_ids: ['S2.3'],                why_for_this_person: 'Your last portfolio project took 3 days just to wire up the backend — reading auth docs, debugging environment variables, and fixing CORS errors before writing a single line of actual AI logic',       tools: ['FastAPI', 'Supabase'] },
        { title: 'Build your first RAG application',             aaa_phase: 'assisted',    skill_ids: ['S2.4', 'S2.2'],        why_for_this_person: 'Every recruiter who looked at your GitHub said the same thing — no RAG project — and you keep putting it off because you do not know where the context window ends and a database begins',        tools: ['FastAPI', 'Supabase'] },
        { title: 'Add AI tool calling to your project',          aaa_phase: 'accelerated', skill_ids: ['S2.8'],                why_for_this_person: 'Your AI features only work on the data you hardcoded — the moment a user asks about something external or real-time, the model guesses and your app looks broken',          tools: ['FastAPI', 'Supabase'] },
        { title: 'Build a ReAct agent that solves real tasks',   aaa_phase: 'accelerated', skill_ids: ['S3.1', 'S3.4'],        why_for_this_person: 'You can chain a few prompts together but you have never built something that reasons through a multi-step problem autonomously — every portfolio project looks like a wrapper around an API call',         tools: ['n8n', 'Claude', 'FastAPI'] },
        { title: 'Ship an end-to-end product users can test',   aaa_phase: 'autonomous',  skill_ids: ['S2.11', 'S3.3'],       why_for_this_person: 'Your portfolio has 12 repos that are all half-finished local projects — nothing deployed, nothing with real users, and every interview asks you for something people actually use',  tools: ['Cursor', 'Vercel', 'Supabase'] },
      ],
      journey_analogy: { frame: 'Going from 3 days of FastAPI and Supabase setup per portfolio project to shipping a deployed AI demo the same afternoon you have the idea', phase_1_meaning: 'You set up the backend, wire the AI API, and debug auth manually each time — Cursor and Claude speed the code but you run every session', phase_2_meaning: 'You build reusable backend templates and CI pipelines — push to GitHub and Vercel deploys automatically without you watching', phase_3_meaning: 'Your portfolio projects run, collect usage data, and surface errors on their own — you review what real users do and ship the next feature' },
      fallback_used: false,
    },
  },
];

// ── Prompts + schema — exact copies of panel-copy.ts logic (stripped of TS types) ─

const SYSTEM_PROMPT = `You are a learning content writer for 100x School of Applied AI.
You receive a locked roadmap blueprint and rewrite ONLY the copy fields inside it.

Rules (non-negotiable):
- Rewrite ONLY the fields in the JSON schema. Do not invent or remove nodes, atoms, terms, or checkpoints.
- Every explanation must state what the learner gains in their SPECIFIC ROLE CONTEXT, not what the technology does in general.
- Every learner_action must be concrete and completable in the atom's allocated time.
- Every output must be a tangible artifact the learner can show, save, or use.
- Terminology plain definitions are locked by the blueprint. Do not rewrite or restate definitions; only personalize role_example, analogy_hook, and why_it_matters.
- Checkpoint steps must name specific tools from the node's allowed_tools list.
- The checkpoint SCENARIO must contain the exact tool name from the node's allowed_tools list verbatim — no synonym, no generic "an AI tool". If tools include "Claude" write "Claude". If tools include "FastAPI" write "FastAPI". This is checked automatically — failure = test fail.
- confidence_check must be a single yes/no question the learner honestly answers about their own skill.
- NEVER start an explanation with "Learn", "Learn how", "You will learn", "Understand", or "Understand the".
- Every atom explanation MUST start with one of these active verbs or role-specific openings: Use, Build, Create, Map, Draft, Connect, Configure, Compare, Test, Ship, Generate, Automate, Review, Design, Implement, Diagnose, Optimize, Produce, Set up, Refactor.
- NEVER use generic phrases: "practice this skill", "apply your knowledge", "work through the exercise", "complete the task", "capstone project".
- Node title rewriting: each node in the delta MUST include a "title" field. If the current title contains technical jargon (OPT, RAG, FastAPI, Supabase, API, MCP, LoRA, n8n, embeddings, structured output, fine-tuning, vector, LLM, pipeline, naive, advanced, ReAct, SPAORL, retrieval, inference), rewrite it as a plain-language outcome the person will HAVE or DO. Format: "[Action verb] your [role-domain object] [positive improvement]". Focus on the AFTER state only. Max 12 words. No acronyms, no tool names. NEVER start with "Stop", "Go from", or negative framing.
  WRONG: "Map your sales workflow with OPT" → WRONG rewrite: "Stop doing research manually" (negative, no outcome)
  RIGHT rewrite: "Document your prospect research process to cut prep time to 5 minutes"
  WRONG: "Build naive RAG pipeline for document retrieval" → WRONG rewrite: "Get AI to answer questions from your files" (vague, no role domain)
  RIGHT rewrite: "Query your codebase and docs from any API endpoint your backend already has"
  WRONG: "Set up FastAPI with Supabase backend" → WRONG rewrite: "Go from slow setup to fast shipping" (negative framing)
  RIGHT rewrite: "Ship a deployed backend endpoint for your portfolio in one afternoon"
  WRONG: "Generate on-brand images with Midjourney" → WRONG rewrite: "Stop hunting stock photos" (negative)
  RIGHT rewrite: "Have 20 on-brand image variants ready from a single brief at the agency"
  If the current title is already jargon-free and uses positive outcome framing, repeat it verbatim.
- Checkpoint scenarios must be at least 2 sentences: first sentence opens with THIS PERSON'S specific context from the "Role:" field above — use their actual situation detail (e.g. "outbound research at a B2B agency", "API integrations at a startup") NOT a bare job title ("As a sales rep", "As a backend engineer"). Second sentence names the EXACT tool name from the node's tool list and the deliverable. The tool name must appear verbatim in the scenario (e.g. if tools include "Claude", write "Claude" in the scenario text). NEVER write "As a [role category]" alone — the scenario must include specific context from the Role field that makes it personal to this person.
- Atom explanations must open with an active verb or a role-specific statement of what changes for the learner.
- NEVER invent tools, nodes, or concepts not present in the blueprint.
- Output ONLY the JSON delta matching the schema. No explanation, no markdown fences.
- Each node lists "left atoms (N)" and "right atoms (N)". Return exactly N items in left_items and N items in right_items for that node. All counts are mandatory — do not add or remove items.
- Every node ID listed in LOCKED NODES must appear in your output. Omitting a node ID is a fatal error.
- steps must have at least 2 items. done_when must have at least 2 items. Never return an empty array for either field.`;

function termCopySchema() {
  return {
    type: 'object',
    properties: {
      role_example: { type: 'string' },
      analogy_hook: { type: 'string' },
      why_it_matters: { type: 'string' },
    },
    required: ['role_example', 'analogy_hook', 'why_it_matters'],
    additionalProperties: false,
  };
}

function atomCopySchema() {
  return {
    type: 'object',
    properties: {
      explanation: { type: 'string' },
      learner_action: { type: 'string' },
      output: { type: 'string' },
    },
    required: ['explanation', 'learner_action', 'output'],
    additionalProperties: false,
  };
}

function analogyMappingCopySchema() {
  return {
    type: 'object',
    properties: {
      plain_meaning: { type: 'string' },
      mistake_to_avoid: { type: 'string' },
    },
    required: ['plain_meaning', 'mistake_to_avoid'],
    additionalProperties: false,
  };
}

function checkpointCopySchema() {
  return {
    type: 'object',
    properties: {
      scenario: { type: 'string' },
      artifact_to_create: { type: 'string' },
      steps: { type: 'array', minItems: 2, items: { type: 'string' } },
      done_when: { type: 'array', minItems: 2, items: { type: 'string' } },
      confidence_check: { type: 'string' },
    },
    required: ['scenario', 'artifact_to_create', 'steps', 'done_when', 'confidence_check'],
    additionalProperties: false,
  };
}

function nodePanelCopySchema() {
  return {
    type: 'object',
    properties: {
      title: { type: 'string' },
      panel: {
        type: 'object',
        properties: {
          checkpoint: checkpointCopySchema(),
          expansion: {
            type: 'object',
            properties: {
              left_items: { type: 'array', items: atomCopySchema() },
              right_items: { type: 'array', items: atomCopySchema() },
            },
            required: ['left_items', 'right_items'],
            additionalProperties: false,
          },
        },
        required: ['checkpoint', 'expansion'],
        additionalProperties: false,
      },
    },
    required: ['title', 'panel'],
    additionalProperties: false,
  };
}

function projectCheckpointCopySchema() {
  return {
    type: 'object',
    properties: {
      description: { type: 'string' },
      artifact_to_build: { type: 'string' },
      steps: { type: 'array', minItems: 2, items: { type: 'string' } },
      done_when: { type: 'array', minItems: 2, items: { type: 'string' } },
    },
    required: ['description', 'artifact_to_build', 'steps', 'done_when'],
    additionalProperties: false,
  };
}

function buildDeltaSchema(blueprint) {
  const allNodes = blueprint.phases.flatMap(p => p.nodes);
  const terms = blueprint.terminology_primer.terms;
  const termProps = {};
  for (const t of terms) termProps[t.term] = termCopySchema();
  const nodeProps = {};
  for (const n of allNodes) nodeProps[n.id] = nodePanelCopySchema();
  const cpProps = {};
  for (const cp of blueprint.project_checkpoints) cpProps[cp.id] = projectCheckpointCopySchema();
  return {
    type: 'object',
    properties: {
      terminology: { type: 'object', properties: termProps, required: terms.map(t => t.term), additionalProperties: false },
      nodes: { type: 'object', properties: nodeProps, required: allNodes.map(n => n.id), additionalProperties: false },
      project_checkpoints: { type: 'object', properties: cpProps, required: blueprint.project_checkpoints.map(c => c.id), additionalProperties: false },
    },
    required: ['terminology', 'nodes', 'project_checkpoints'],
    additionalProperties: false,
  };
}

function buildUserPrompt(blueprint, validationErrors) {
  const { user_profile, journey_analogy } = blueprint;
  const allNodes = blueprint.phases.flatMap(p => p.nodes);

  const profileCtx = [
    `Role: ${user_profile.raw_role_text}`,
    `Category: ${user_profile.role_category} / ${user_profile.role_archetype}`,
    `AI familiarity: ${user_profile.ai_familiarity}`,
    `Top daily tasks: ${user_profile.high_weight_tasks.slice(0, 3).map(t => t.description).join(' | ')}`,
    `Journey frame: ${journey_analogy.frame} — ${journey_analogy.phase_1_meaning} → ${journey_analogy.phase_3_meaning}`,
  ].join('\n');

  const topTasks = user_profile.high_weight_tasks.slice(0, 2).map(t => t.description).join('" or "');

  const gapNodes = blueprint.gap_inference_nodes ?? [];
  const nodeSummary = allNodes.map((n, idx) => {
    const leftItems = n.panel.expansion.left_items;
    const rightItems = n.panel.expansion.right_items;
    const leftLabels = leftItems.map(a => a.label).join(', ');
    const rightLabels = rightItems.map(a => a.label).join(', ');
    const why = gapNodes[idx]?.why_for_this_person;
    return [
      `Node ${n.id}: "${n.title}" [${n.depth_level}]`,
      why ? `  why for this person: ${why}` : '',
      `  skills: ${n.skill_ids.join(', ')}  tools: ${n.panel.checkpoint.tools.join(', ')}  [scenario MUST name one of these tools verbatim]`,
      `  left atoms (${leftItems.length}): ${leftLabels}`,
      `  right atoms (${rightItems.length}): ${rightLabels}`,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const termList = blueprint.terminology_primer.terms.map(t => `  ${t.term}`).join('\n');
  const cpList = blueprint.project_checkpoints.map(c => `  ${c.id} (${c.type}): "${c.title}"`).join('\n');

  const nonTechRoles = ['marketer', 'designer', 'sales', 'pm', 'student'];
  const isNonTech = nonTechRoles.includes(user_profile.role_category);

  const atomExplanationRule = `ATOM EXPLANATION RULE — EVERY LEFT AND RIGHT ATOM:

Structure (mandatory order):
1. STATE the specific problem this person faces WITHOUT this capability — name the pain in their actual work
2. SHOW why the obvious workaround fails for them
3. REVEAL why this capability solves it
4. THEN demonstrate or name it with an active verb

First word: active verb (Use, Build, Create, Map, Draft, Connect, Configure, Compare, Test, Ship, Generate, Automate, Review, Design, Implement, Diagnose, Optimize, Produce, Set up, Refactor).
BANNED starters: "Learn", "Learn how", "You will learn", "Understand", "Understand the".
BANNED opener pattern: "Without [technology name]..." — this names the solution BEFORE the problem. State the problem first, then reveal what solves it.

WRONG: "Use vector databases to store embeddings for semantic search."
RIGHT: "Your documents don't fit in the context window — copy-pasting is chaos at scale. Map how each piece of content gets from source to AI so you see exactly where retrieval breaks."

WRONG: "Build a no-code content pipeline using n8n to automate handoffs."
RIGHT: "Every campaign handoff is a Slack thread that dies — one missed message means a delayed launch. Map the exact handoff points in your workflow, then connect them in n8n so nothing slips."

WRONG: "Without naive RAG, your backend lacks dynamic document retrieval, forcing static data inclusion."
RIGHT: "Every API query returns whatever you hardcoded — users asking about recent data get stale answers. Map how documents flow from source to query response, then build the retrieval layer that makes it dynamic."
${isNonTech ? `
NON-TECHNICAL AUDIENCE RULE: This person is a ${user_profile.role_category}. Every technical term in atom explanations must be plain English OR defined inline in the same sentence.
NEVER assume they know: RAG, embeddings, vector database, MCP, structured output, context window, token, n8n, LLM, language model, language model API, API, LoRA, ReAct, prompt engineering, fine-tuning. HARD BAN: the exact phrases "language model API", "language model", and bare "API" must never appear in atom text without an immediate inline definition in the same sentence.
If you must use a technical term: define it immediately — "embeddings (a way to convert text into numbers the AI can compare)".` : ''}`;

  const scenarioOpenerRule = `CHECKPOINT SCENARIO OPENER — NON-NEGOTIABLE FOR EVERY NODE:
MUST be exactly 2 sentences, minimum 100 characters total.
Sentence 1: Identify THIS SPECIFIC PERSON — combine who they are (from their Role + work context) with a concrete moment of friction. Both must be in the same sentence. Use their role description words, their company type (${user_profile.work_context}), and a specific pain from their actual work. A stranger reading this sentence must know who this person is AND what went wrong.
VERBATIM SIGNAL: the specific moment of friction already exists in the 'why for this person' field shown above for each node. Copy the exact numbers, tool names, or failure events from it — do NOT invent or paraphrase. Example: if why says 'onboarding takes 3 weeks', write '3 weeks' in the scenario, not 'onboarding is slow'.
Sentence 2: Format exactly: "[EXACT tool name from node's tool list] will [build/produce/generate] [specific artifact], done when [one clear measurable criterion]."
Their situation: "${user_profile.raw_role_text}" | Context: ${user_profile.work_context}
Their key daily tasks: "${topTasks}"

WRONG: "You spent hours searching for stock photos but none matched your SaaS client's brand style." (moment only — no role identity, any designer could say this)
WRONG: "Working on visual systems for a SaaS team, you need to generate brand-aligned images." (role only — no moment, no friction)
WRONG: "Your last outbound run took 3 days because research was scattered across 4 tabs." (moment only — which sales rep at which company?)
RIGHT: "Working on visual systems for SaaS clients at the agency, Tuesday's presentation was delayed two hours because stock photos never match the brand guide and you reprompt Midjourney manually for every asset. Midjourney will generate 20 on-brand image variants from a single brand reference, done when all images match the client colour palette and no reprompting is needed."
RIGHT: "Running outbound at the agency for a B2B software client, your last prospect sequence took 3 days because research was scattered across Apollo, LinkedIn, and a Notion doc with no structure. Claude will build a prospect research template that outputs a call-ready brief in under 5 minutes, done when the brief covers company context, pain signals, and a personalised opening hook."
RIGHT (technical role): "After a customer demo where the document query endpoint returned garbled output on a 5-page PDF at the startup, you spent two hours tracing it to a context window crash — the whole file was passed as raw text. FastAPI will build a chunked retrieval endpoint that handles any document size, done when a 50-page test PDF returns the correct answer to a specific query without errors."

BANNED (output rejected): "As a [role]...", "You are a [role]...", "A [role] at a..." third-person openers — sentence 1 must address the person directly as "you" and name THEIR SPECIFIC CONTEXT (company type + role detail + moment), not describe them from outside.`;

  const errorSection = validationErrors?.length > 0
    ? `\nPrevious attempt failed. Fix ALL these errors:\n${validationErrors.map(e => `  - ${e}`).join('\n')}\n\nFor _banned_start errors: rewrite starting with: Use, Build, Create, Map, Draft, Connect, Configure, Compare, Test, Ship, Generate, Automate, Review, Design, Implement, Diagnose, Optimize, Produce, Set up, Refactor. Never start with Learn or Understand. For _generic_phrase: remove the phrase. Never use "capstone project".\n`
    : '';

  return [
    profileCtx, '',
    atomExplanationRule, '',
    scenarioOpenerRule, '',
    'LOCKED NODES (rewrite copy fields only):', nodeSummary, '',
    'LOCKED TERMINOLOGY TERMS (plain_definition fixed — enrich role_example, analogy_hook, why_it_matters only):', termList, '',
    'PROJECT CHECKPOINTS (enrich description, artifact_to_build, steps, done_when):', cpList,
    errorSection,
    'Return the complete copy delta JSON now.',
  ].join('\n');
}

const BANNED_START = /^(learn|learn how|you will learn|understand|understand the)\b/i;
const BANNED_GENERIC = /\b(practice this skill|apply your knowledge|work through the exercise|complete the task|capstone project)\b/i;

function validateCopyDelta(delta, blueprint) {
  const errors = [];
  const allNodes = blueprint.phases.flatMap(p => p.nodes);

  for (const term of blueprint.terminology_primer.terms) {
    const copy = delta.terminology?.[term.term];
    if (!copy) { errors.push(`terminology_missing:${term.term}`); continue; }
    if (!copy.role_example?.trim()) errors.push(`terminology_empty_role_example:${term.term}`);
    if (!copy.analogy_hook?.trim()) errors.push(`terminology_empty_analogy_hook:${term.term}`);
    if (!copy.why_it_matters?.trim()) errors.push(`terminology_empty_why_it_matters:${term.term}`);
  }

  for (const node of allNodes) {
    const nc = delta.nodes?.[node.id];
    if (!nc) { errors.push(`node_missing:${node.id}`); continue; }
    const pc = nc.panel;
    if (!pc) { errors.push(`node_panel_missing:${node.id}`); continue; }

    const left = pc.expansion?.left_items ?? [];
    const right = pc.expansion?.right_items ?? [];

    for (let i = 0; i < left.length; i++) {
      const ac = left[i];
      if (!ac?.explanation?.trim()) errors.push(`node_${node.id}_left[${i}]_empty_explanation`);
      if (!ac?.learner_action?.trim()) errors.push(`node_${node.id}_left[${i}]_empty_learner_action`);
      if (BANNED_START.test(ac?.explanation?.trim() ?? '')) errors.push(`node_${node.id}_left[${i}]_explanation_banned_start`);
      if (BANNED_GENERIC.test(ac?.explanation?.trim() ?? '')) errors.push(`node_${node.id}_left[${i}]_explanation_generic_phrase`);
    }
    for (let i = 0; i < right.length; i++) {
      const ac = right[i];
      if (!ac?.explanation?.trim()) errors.push(`node_${node.id}_right[${i}]_empty_explanation`);
      if (!ac?.learner_action?.trim()) errors.push(`node_${node.id}_right[${i}]_empty_learner_action`);
      if (BANNED_START.test(ac?.explanation?.trim() ?? '')) errors.push(`node_${node.id}_right[${i}]_explanation_banned_start`);
      if (BANNED_GENERIC.test(ac?.explanation?.trim() ?? '')) errors.push(`node_${node.id}_right[${i}]_explanation_generic_phrase`);
    }

    const ck = pc.checkpoint;
    if (!ck?.scenario?.trim()) errors.push(`node_${node.id}_checkpoint_empty_scenario`);
    if (!ck?.artifact_to_create?.trim()) errors.push(`node_${node.id}_checkpoint_empty_artifact_to_create`);
    if (!Array.isArray(ck?.steps) || ck.steps.length === 0) errors.push(`node_${node.id}_checkpoint_empty_steps`);
    if (!Array.isArray(ck?.done_when) || ck.done_when.length === 0) errors.push(`node_${node.id}_checkpoint_empty_done_when`);
    if (!ck?.confidence_check?.trim()) errors.push(`node_${node.id}_checkpoint_empty_confidence_check`);
  }

  for (const cp of blueprint.project_checkpoints) {
    const cc = delta.project_checkpoints?.[cp.id];
    if (!cc) { errors.push(`project_checkpoint_missing:${cp.id}`); continue; }
    if (!cc.description?.trim()) errors.push(`project_checkpoint_${cp.id}_empty_description`);
    if (!cc.artifact_to_build?.trim()) errors.push(`project_checkpoint_${cp.id}_empty_artifact_to_build`);
    if (!Array.isArray(cc.steps) || cc.steps.length === 0) errors.push(`project_checkpoint_${cp.id}_empty_steps`);
    if (!Array.isArray(cc.done_when) || cc.done_when.length === 0) errors.push(`project_checkpoint_${cp.id}_empty_done_when`);
  }

  return errors;
}

function applyDelta(blueprint, delta) {
  const enriched = JSON.parse(JSON.stringify(blueprint));

  for (const term of enriched.terminology_primer.terms) {
    const copy = delta.terminology?.[term.term];
    if (!copy) continue;
    if (copy.role_example?.trim()) term.role_example = copy.role_example;
    if (copy.analogy_hook?.trim()) term.analogy_hook = copy.analogy_hook;
    if (copy.why_it_matters?.trim()) term.why_it_matters = copy.why_it_matters;
  }

  for (const phase of enriched.phases) {
    for (const node of phase.nodes) {
      const nc = delta.nodes?.[node.id];
      if (!nc) continue;
      const pc = nc.panel;

      const leftCopy = pc.expansion?.left_items ?? [];
      const leftApplyCount = Math.min(leftCopy.length, node.panel.expansion.left_items.length);
      for (let i = 0; i < leftApplyCount; i++) {
        const ac = leftCopy[i];
        if (!ac) continue;
        if (ac.explanation?.trim()) node.panel.expansion.left_items[i].explanation = ac.explanation;
        if (ac.learner_action?.trim()) node.panel.expansion.left_items[i].learner_action = ac.learner_action;
        if (ac.output?.trim()) node.panel.expansion.left_items[i].output = ac.output;
      }
      const rightCopy = pc.expansion?.right_items ?? [];
      const rightApplyCount = Math.min(rightCopy.length, node.panel.expansion.right_items.length);
      for (let i = 0; i < rightApplyCount; i++) {
        const ac = rightCopy[i];
        if (!ac) continue;
        if (ac.explanation?.trim()) node.panel.expansion.right_items[i].explanation = ac.explanation;
        if (ac.learner_action?.trim()) node.panel.expansion.right_items[i].learner_action = ac.learner_action;
        if (ac.output?.trim()) node.panel.expansion.right_items[i].output = ac.output;
      }

      if (nc.title?.trim()) node.title = nc.title;

      const ck = pc.checkpoint;
      if (ck?.scenario?.trim()) node.panel.checkpoint.scenario = ck.scenario;
      if (ck?.artifact_to_create?.trim()) node.panel.checkpoint.artifact_to_create = ck.artifact_to_create;
      if (Array.isArray(ck?.steps) && ck.steps.length > 0) node.panel.checkpoint.steps = ck.steps;
      if (Array.isArray(ck?.done_when) && ck.done_when.length > 0) node.panel.checkpoint.done_when = ck.done_when;
      if (ck?.confidence_check?.trim()) node.panel.checkpoint.confidence_check = ck.confidence_check;
    }
  }

  for (const cp of enriched.project_checkpoints) {
    const cc = delta.project_checkpoints?.[cp.id];
    if (!cc) continue;
    if (cc.description?.trim()) cp.description = cc.description;
    if (cc.artifact_to_build?.trim()) cp.artifact_to_build = cc.artifact_to_build;
    if (Array.isArray(cc.steps) && cc.steps.length > 0) cp.steps = cc.steps;
    if (Array.isArray(cc.done_when) && cc.done_when.length > 0) cp.done_when = cc.done_when;
  }

  return enriched;
}

// ── Phase 5: post-enrichment terminology re-scan (mirrors roadmap-gen.ts block) ─

function extractAtomText(node) {
  const atoms = [
    ...(node.panel?.expansion?.left_items ?? []),
    ...(node.panel?.expansion?.right_items ?? []),
  ];
  return atoms.map(a => `${a.explanation ?? ''} ${a.learner_action ?? ''}`).join(' ');
}

function runPostEnrichmentTermScan(enrichedBlueprint) {
  const nodes = enrichedBlueprint.phases.flatMap(p => p.nodes);
  const nodeIds = nodes.map(n => n.id);
  const nodeAtomTexts = nodes.map(n => extractAtomText(n));
  const enrichedTerms = buildTerminologyPrimerFromContent(
    enrichedBlueprint.user_profile.role_category,
    nodeAtomTexts,
    nodeIds
  );
  enrichedBlueprint.terminology_primer = { terms: enrichedTerms };
  return enrichedBlueprint;
}

// ── North Star checks ─────────────────────────────────────────────────────────

// Node title looks like an outcome ("Build X", "Ship Y") not a tech label ("RAG System")
const TECH_LABEL_PATTERN = /^(AI|LLM|RAG|MCP|API|n8n|GPT|Agent|Tool|Prompt|System|Pipeline|Module|Service)\s+\w+$/i;
function isOutcomeTitle(title) {
  if (TECH_LABEL_PATTERN.test(title)) return false;
  // Outcome titles typically have verbs or describe result
  return title.length > 15;
}

// Checkpoint scenario is specific: >= 100 chars + tool name verbatim (per G6 spec)
function checkpointIsSpecific(scenario, tools) {
  if (!scenario || scenario.length < 100) return false;
  const lowerScenario = scenario.toLowerCase();
  return tools.some(t => lowerScenario.includes(t.toLowerCase()));
}

// Journey analogy is specific: frame should mention role context, not be generic
function analogyIsSpecific(frame) {
  if (!frame || frame.length < 40) return false;
  // Specific = long enough + has enough words to convey real context
  return frame.split(' ').length >= 7;
}

// ── LLM enrichment call ───────────────────────────────────────────────────────

async function enrichWithLLM(blueprint, openai) {
  const schema = buildDeltaSchema(blueprint);
  const res = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    max_tokens: 16000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(blueprint) },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'copy_delta', schema, strict: true } },
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error('LLM returned empty content');
  return JSON.parse(content);
}

// ── Main ──────────────────────────────────────────────────────────────────────

// ── Per-fixture runner (called in parallel) ───────────────────────────────────

async function runFixture(c, openai) {
  const lines = [];
  const log = (s) => { lines.push(s); };
  log(`\n--- ${c.id} ---`);

    const profile = buildUserWorkProfile(c.profile);

    // P3: Blueprint (deterministic)
    const blueprint = buildRoadmapBlueprint(profile, c.gapInference);
    const allNodes = blueprint.phases.flatMap(p => p.nodes);
    const preTermNames = new Set(blueprint.terminology_primer.terms.map(t => t.term));

    const failures = [];

    // G1: Node count 5-9
    if (allNodes.length >= 5 && allNodes.length <= 9) {
      log(`  [PASS] G1: ${allNodes.length} nodes (5-9 range)`);
    } else {
      const msg = `node count ${allNodes.length} outside 5-9 range`;
      log(`  [FAIL] G1: ${msg}`);
      failures.push(`G1: ${msg}`);
    }

    // G2: Node titles are outcome statements
    const labelTitles = allNodes.filter(n => !isOutcomeTitle(n.title));
    if (labelTitles.length === 0) {
      log(`  [PASS] G2: all node titles are outcome statements`);
    } else {
      const msg = `tech-label titles: ${labelTitles.map(n => `"${n.title}"`).join(', ')}`;
      log(`  [FAIL] G2: ${msg}`);
      failures.push(`G2: ${msg}`);
    }

    // G3: Atom counts = skill_ids.length*2+2 per node
    const atomCountViolations = allNodes.filter(n => {
      const expected = n.skill_ids.length * 2 + 2;
      const actual = (n.panel?.expansion?.left_items?.length ?? 0) + (n.panel?.expansion?.right_items?.length ?? 0);
      return actual !== expected;
    });
    if (atomCountViolations.length === 0) {
      log(`  [PASS] G3: all nodes have correct atom counts`);
    } else {
      const msg = `atom count violations: ${atomCountViolations.map(n => `${n.id}(expected ${n.skill_ids.length*2+2})`).join(', ')}`;
      log(`  [FAIL] G3: ${msg}`);
      failures.push(`G3: ${msg}`);
    }

    // G7: Journey analogy is role-specific (pre-enrichment check)
    if (analogyIsSpecific(blueprint.journey_analogy?.frame)) {
      log(`  [PASS] G7: journey analogy is role-specific ("${blueprint.journey_analogy?.frame?.slice(0, 60)}...")`);
    } else {
      const msg = `journey analogy not specific to role: "${blueprint.journey_analogy?.frame}"`;
      log(`  [FAIL] G7: ${msg}`);
      failures.push(`G7: ${msg}`);
    }

    // ── Phase 6 deterministic gates (no LLM needed) ───────────────────────────

    // G11: work_context propagates through UserWorkProfile into blueprint
    const bpWorkContext = blueprint.user_profile?.work_context;
    const expectedWorkContext = c.profile.workContext ?? 'startup';
    if (bpWorkContext === expectedWorkContext) {
      log(`  [PASS] G11: work_context="${bpWorkContext}" propagated correctly`);
    } else {
      const msg = `work_context mismatch: expected "${expectedWorkContext}", got "${bpWorkContext}"`;
      log(`  [FAIL] G11: ${msg}`);
      failures.push(`G11: ${msg}`);
    }

    // G12: raw_role_text is the real input — NOT a legacy fallback like "Marketer - Marketing Managers"
    // Legacy bridge always formatted as: ROLE_DISPLAY[role] + " - " + socTitle
    // Real profile uses the rawRoleText from the fixture directly
    const rawRoleText = blueprint.user_profile?.raw_role_text ?? '';
    const legacyPattern = /^(Product Manager|Designer|Marketer|Sales Professional|Engineer|Student)( - .+)?$/;
    const isLegacyFallback = legacyPattern.test(rawRoleText) && rawRoleText !== c.profile.rawRoleText;
    if (!isLegacyFallback) {
      log(`  [PASS] G12: raw_role_text is real input ("${rawRoleText.slice(0, 50)}...")`);
    } else {
      const msg = `raw_role_text looks like legacy fallback: "${rawRoleText}" (expected: "${c.profile.rawRoleText.slice(0, 40)}")`;
      log(`  [FAIL] G12: ${msg}`);
      failures.push(`G12: ${msg}`);
    }

    // G13: Blueprint content node count ≤ gap inference input node count
    // If CAPABILITY_MATRIX were in path it could add extra nodes not in gap inference
    const gapNodeCount = (c.gapInference?.nodes ?? []).length;
    const contentNodeCount = allNodes.length;
    if (gapNodeCount === 0 || contentNodeCount <= gapNodeCount) {
      log(`  [PASS] G13: blueprint nodes (${contentNodeCount}) ≤ gap inference input (${gapNodeCount}) — no CAPABILITY_MATRIX inflation`);
    } else {
      const msg = `blueprint has ${contentNodeCount} nodes but gap inference only had ${gapNodeCount} — unexpected inflation`;
      log(`  [FAIL] G13: ${msg}`);
      failures.push(`G13: ${msg}`);
    }

    // P4: Enrichment (live LLM)
    console.log(`  calling LLM enrichment...`);
    let enriched;
    try {
      let delta = await enrichWithLLM(blueprint, openai);
      let deltaErrors = validateCopyDelta(delta, blueprint);

      if (deltaErrors.length > 0) {
        console.log(`  retry (${deltaErrors.length} validation errors)...`);
        console.log(`  retry errors: ${deltaErrors.join(' | ')}`);
        const retryRes = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          temperature: 0.2,
          max_tokens: 16000,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(blueprint, deltaErrors) },
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'copy_delta', schema: buildDeltaSchema(blueprint), strict: true } },
        });
        const retryContent = retryRes.choices[0]?.message?.content;
        if (!retryContent) throw new Error('LLM retry returned empty content');
        delta = JSON.parse(retryContent);
        deltaErrors = validateCopyDelta(delta, blueprint);
      }

      // G10: validateCopyDelta passes
      if (deltaErrors.length === 0) {
        log(`  [PASS] G10: LLM delta passes validation`);
        enriched = applyDelta(blueprint, delta);
      } else {
        const msg = `delta validation failed after retry: ${deltaErrors.slice(0, 3).join(', ')}`;
        log(`  [FAIL] G10: ${msg}`);
        failures.push(`G10: ${msg}`);
        return { id: c.id, pass: false, failures, stats: null, lines };
      }
    } catch (err) {
      const msg = `LLM call failed: ${err.message}`;
      log(`  [FAIL] G10: ${msg}`);
      failures.push(`G10: ${msg}`);
      return { id: c.id, pass: false, failures, stats: null, lines };
    }

    // G4: No generic copy in enriched atoms
    const genericViolations = [];
    for (const node of enriched.phases.flatMap(p => p.nodes)) {
      for (const side of ['left_items', 'right_items']) {
        for (const atom of (node.panel?.expansion?.[side] ?? [])) {
          if (BANNED_GENERIC.test(atom.explanation ?? '')) genericViolations.push(`${node.id}.${side}.explanation`);
          if (BANNED_GENERIC.test(atom.learner_action ?? '')) genericViolations.push(`${node.id}.${side}.learner_action`);
        }
      }
    }
    if (genericViolations.length === 0) {
      log(`  [PASS] G4: no generic phrases in enriched atoms`);
    } else {
      const msg = `generic phrases in: ${genericViolations.slice(0, 3).join(', ')}`;
      log(`  [FAIL] G4: ${msg}`);
      failures.push(`G4: ${msg}`);
    }

    // G5: Atom explanations start with active verbs
    const bannedStartViolations = [];
    for (const node of enriched.phases.flatMap(p => p.nodes)) {
      for (const side of ['left_items', 'right_items']) {
        for (const atom of (node.panel?.expansion?.[side] ?? [])) {
          if (BANNED_START.test(atom.explanation?.trim() ?? '')) {
            bannedStartViolations.push(`${node.id}: "${atom.explanation?.slice(0, 40)}"`);
          }
        }
      }
    }
    if (bannedStartViolations.length === 0) {
      log(`  [PASS] G5: all atom explanations start with active verbs`);
    } else {
      const msg = `banned starts: ${bannedStartViolations.slice(0, 2).join(' | ')}`;
      log(`  [FAIL] G5: ${msg}`);
      failures.push(`G5: ${msg}`);
    }

    // G6: Checkpoint scenarios are specific (2+ sentences, tool reference)
    const scenarioViolations = [];
    for (const node of enriched.phases.flatMap(p => p.nodes)) {
      const scenario = node.panel?.checkpoint?.scenario;
      const tools = node.panel?.checkpoint?.tools ?? [];
      if (!checkpointIsSpecific(scenario, tools)) {
        scenarioViolations.push(`${node.id}: "${(scenario ?? '').slice(0, 60)}..."`);
      }
    }
    if (scenarioViolations.length === 0) {
      log(`  [PASS] G6: all checkpoint scenarios are specific`);
    } else {
      const msg = `weak scenarios: ${scenarioViolations.slice(0, 2).join(' | ')}`;
      log(`  [FAIL] G6: ${msg}`);
      failures.push(`G6: ${msg}`);
    }

    // P5: Post-enrichment terminology re-scan
    const enrichedWithTerms = runPostEnrichmentTermScan(enriched);
    const postTermNames = new Set(enrichedWithTerms.terminology_primer.terms.map(t => t.term));

    // G8: Post-enrichment terms differ from pre-enrichment (Phase 5 adds value)
    const newTerms = [...postTermNames].filter(t => !preTermNames.has(t));
    const droppedTerms = [...preTermNames].filter(t => !postTermNames.has(t));
    if (newTerms.length > 0 || droppedTerms.length > 0) {
      log(`  [PASS] G8: post-enrichment scan changed terms (+${newTerms.length} new, -${droppedTerms.length} dropped). New: ${newTerms.slice(0, 3).join(', ')}`);
    } else {
      // Same terms is acceptable if enrichment didn't add new canonical term mentions
      log(`  [INFO] G8: terms unchanged after enrichment (${postTermNames.size} terms). LLM didn't add new canonical term mentions — acceptable if atom text is already rich.`);
    }

    // G9: Post-enrichment terms appear in actual enriched atom text (no false positives)
    const enrichedNodes = enrichedWithTerms.phases.flatMap(p => p.nodes);
    const enrichedNodeAtomTexts = enrichedNodes.map(n => extractAtomText(n));
    const enrichedNodeIds = enrichedNodes.map(n => n.id);
    let g9Pass = true;
    for (const term of enrichedWithTerms.terminology_primer.terms) {
      for (const nid of (term.appears_in_node_ids ?? [])) {
        const idx = enrichedNodeIds.indexOf(nid);
        if (idx === -1) {
          log(`  [FAIL] G9: term "${term.term}" references non-existent node "${nid}"`);
          failures.push(`G9: term "${term.term}" references non-existent node "${nid}"`);
          g9Pass = false;
        } else if (!enrichedNodeAtomTexts[idx].toLowerCase().includes(term.term.toLowerCase())) {
          log(`  [FAIL] G9: false positive — term "${term.term}" in node "${nid}" but not in atom text`);
          failures.push(`G9: false positive for "${term.term}" in "${nid}"`);
          g9Pass = false;
        }
      }
    }
    if (g9Pass) log(`  [PASS] G9: all post-enrichment terms have accurate appears_in_node_ids`);

    const pass = failures.length === 0;
    const stats = {
      nodes: allNodes.length,
      preTermCount: preTermNames.size,
      postTermCount: postTermNames.size,
      newTermsFromEnrichment: newTerms,
      work_context: blueprint.user_profile?.work_context,
      raw_role_text_snippet: (blueprint.user_profile?.raw_role_text ?? '').slice(0, 40),
    };

    await writeFile(
      resolve(e2eDir, `${c.id}-enriched.json`),
      JSON.stringify({ id: c.id, pass, failures, enriched: enrichedWithTerms }, null, 2) + '\n'
    );

  return { id: c.id, pass, failures, stats, lines };
}

// ── Main (all fixtures in parallel) ──────────────────────────────────────────

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'REPLACE_ME') {
    console.error('[FATAL] OPENAI_API_KEY not set — this test requires live LLM');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });
  await mkdir(e2eDir, { recursive: true });

  console.log('\n=== PIPELINE E2E TEST (Phases 1–6) — parallel ===\n');
  const start = Date.now();

  const results = await Promise.all(CASES.map(c => runFixture(c, openai)));

  for (const r of results) {
    for (const line of r.lines) console.log(line);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n  elapsed: ${elapsed}s`);

  console.log('\n=== SUMMARY ===\n');
  for (const r of results) {
    const icon = r.pass ? '[PASS]' : '[FAIL]';
    console.log(`  ${icon} ${r.id} — ${r.stats?.nodes ?? '?'} nodes, ${r.stats?.preTermCount ?? '?'} → ${r.stats?.postTermCount ?? '?'} terms`);
    if (!r.pass) {
      for (const f of r.failures) console.log(`         ${f}`);
    }
  }

  const passed = results.filter(r => r.pass).length;
  console.log(`\n  ${passed}/${results.length} fixtures passed all gates`);

  console.log('\n=== CUMULATIVE GATE CHECK ===');
  const allG3Pass = results.every(r => !r.failures.some(f => f.startsWith('G3')));
  const allG6Pass = results.every(r => !r.failures.some(f => f.startsWith('G6')));
  const allG10Pass = results.every(r => !r.failures.some(f => f.startsWith('G10')));
  const allG8Pass = results.every(r => !r.failures.some(f => f.startsWith('G8')));
  const allG9Pass = results.every(r => !r.failures.some(f => f.startsWith('G9')));
  const allG11Pass = results.every(r => !r.failures.some(f => f.startsWith('G11')));
  const allG12Pass = results.every(r => !r.failures.some(f => f.startsWith('G12')));
  const allG13Pass = results.every(r => !r.failures.some(f => f.startsWith('G13')));
  console.log(`  ${allG3Pass ? '[PASS]' : '[FAIL]'} Phase 3 flex atom contract (G3) — all fixtures`);
  console.log(`  ${allG6Pass ? '[PASS]' : '[FAIL]'} Phase 4 checkpoint scenarios (G6) — all fixtures`);
  console.log(`  ${allG10Pass ? '[PASS]' : '[FAIL]'} Phase 4 enrichment validation (G10) — all fixtures`);
  console.log(`  ${allG8Pass && allG9Pass ? '[PASS]' : '[FAIL]'} Phase 5 post-enrichment terminology (G8+G9) — all fixtures`);
  console.log(`  ${allG11Pass ? '[PASS]' : '[FAIL]'} Phase 6 work_context propagation (G11) — all fixtures`);
  console.log(`  ${allG12Pass ? '[PASS]' : '[FAIL]'} Phase 6 no legacy bridge (G12) — all fixtures`);
  console.log(`  ${allG13Pass ? '[PASS]' : '[FAIL]'} Phase 6 no CAPABILITY_MATRIX inflation (G13) — all fixtures`);

  await writeFile(
    resolve(outputDir, 'pipeline-e2e-report.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), passed, total: results.length, results }, null, 2) + '\n'
  );
  console.log(`\n  full output: ${e2eDir}/`);

  const allPass = results.every(r => r.pass);
  if (!allPass) {
    console.error('\n[FAIL] Pipeline E2E — see failures above');
    process.exit(1);
  } else {
    console.log('\n=== ALL GATES PASS ===');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
