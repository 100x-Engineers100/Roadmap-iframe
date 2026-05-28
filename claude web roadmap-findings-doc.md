# Roadmap System — Findings & Discovery Document

**Purpose of this document:**
This is not a solution document. This is a discovery document.
It captures what was found, what was discussed, and what fundamental insights emerged from a deep Socratic interview with the product owner. Claude Code should read this document, analyse the entire codebase end-to-end, and then propose surgical fixes or architectural changes that address these findings at a ground level. Do not implement anything blindly. Understand first.

---

## How This Document Was Produced

This document is the output of a structured Socratic interview with the founder of 100xEngineers — an AI engineer and software developer building a personalised AI learning roadmap system for non-technical audiences. The interview was designed to extract tacit knowledge that was not present anywhere in the codebase — the founder's mental model of what the roadmap should do, how it should feel, and why the current system is failing.

The interview was not about the code. It was about the thinking behind the code. The findings below are what emerged.

---

## Section 1 — What the Roadmap Is Actually Supposed to Do

### The north star feeling
The roadmap is not a curriculum. It is a confidence artifact. When a non-technical person sees this roadmap for the first time, the intended emotional response is:

> "Okay. I can do this. I just need to follow this. If I complete this, I will be AI-native in my role."

That feeling — clarity plus believability — is the product. Everything else is in service of producing that feeling.

### The transformation arc
The roadmap covers 90 days, divided into 3 phases of 30 days each. The progression is not just increasing technical difficulty. It is increasing autonomy — the person's relationship with AI changes across phases:

- Phase 1: AI helps you do your job. You are present every time.
- Phase 2: AI does parts of your job when you set it up. You trigger it.
- Phase 3: AI runs parts of your job without you. A system triggers it.

This is the core progression insight. It was not present anywhere in the existing system. The phases were separated by module number, not by this autonomy principle.

### The primary personas
The roadmap is being built for 6 non-technical roles:
- Marketers
- Founders
- Sales executives
- Designers
- Product managers
- Students

All share the same 3-phase structure. What changes per role is the language, the analogies, the project checkpoints, and the tool recommendations. The underlying cluster logic is shared.

Starting AI familiarity assumed: casual — used ChatGPT a few times, no systematic AI usage.

---

## Section 2 — The Core Content Principles Extracted from the Interview

These are not design opinions. These are the founder's explicit mental model for how the roadmap should teach. They emerged from asking "how did you explain RAG to your sales rep?"

### Principle 1 — Outcome first, technology second
The main node on the canvas should never be named after a technology or a capability. It should be named after what the person gains. The technology name is a footnote — a credibility badge that says "this is real, this has a name" — not the headline.

Current system violates this. Nodes are named after capabilities ("AI Marketing Content at Scale") not outcomes ("Ship a week's content in one afternoon").

### Principle 2 — Why before what
Before any concept is introduced, the person must first feel the pain of not having it. The sequence is: establish the problem → show why the obvious solution fails → make the real solution feel inevitable → only then name it.

The founder demonstrated this live by explaining RAG: he never started with "RAG stands for Retrieval Augmented Generation." He started with "LLMs don't know your company's data — and if you just dump your documents in, the context window breaks." By the time he said "vector database," the sales rep already understood why it had to exist.

This principle is completely absent from the current roadmap generator. The LLM names concepts before establishing need.

### Principle 3 — Projects are the prize, not the curriculum
Non-technical people drop off learning resources at two moments:
1. When they hit jargon they don't understand
2. When they can't see a tangible reward at the end

The fix for dropout moment 2 is: show the 3 project checkpoints before showing the topics. The person should see what they'll build first. The topics then become the path to the prize, not a wall in front of it.

Current system: checkpoints are listed at the bottom as an afterthought. They should be the first thing that earns attention.

### Principle 4 — Analogies from their actual Tuesday
Every analogy should be pulled from something the person already does in their real job — not generic analogies like "think of it like a library." A marketer's analogy for RAG should come from campaigns or briefs. A sales rep's from their objection handling playbook.

The founder acknowledged he personally used generic analogies (library, filing cabinet) because he doesn't know the non-tech person's world deeply enough. He explicitly wants the system to enter the user's world — which means role-specific analogies are required, not optional.

Current system: one generic analogy per node, written without role context.

### Principle 5 — Technical credibility inside the side panel
The main node is non-technical. But once a person opens the side panel, they must encounter real technical names — chunking, embeddings, vector database, retrieval. This is intentional. It creates credibility.

The glossary exists to support this. Every technical term that appears in the side panel subnodes must have a plain-English definition in the glossary. The glossary is the safety net that makes technical subnodes readable without being scary.

The rule: glossary terms must be derived from what actually appears in the roadmap content. They must not be independently generated.

---

## Section 3 — The Specific Bugs Found in the Current System

These are not speculative. These were identified by reading the actual codebase files (`skill-clusters.ts`, `curriculum-seed.ts`) during the interview.

### Bug 1 — Cluster boundary is module number, not concept
**What was found:**
C2A ("Map and automate your work with AI") and C3B ("Automate complex workflows") are nearly indistinguishable to a human reader — and to an LLM. The only real difference between them in the data is that one comes from module 2 and one from module 3.

**Why it matters:**
The LLM generating roadmaps cannot draw a clear line between Phase 2 and Phase 3 for a non-technical role. The result is blurred, repetitive content between phases — which destroys the sense of progression the roadmap is supposed to create.

**The insight that exposes the real difference:**
Phase 2 = the human is still the trigger. Phase 3 = a system is the trigger. Same tools (n8n appears in both), completely different autonomy level. This distinction exists nowhere in the current data model.

### Bug 2 — Skills are role-filtered by permission, not by fit
**What was found:**
Multiple skills in `curriculum-seed.ts` have `marketer` in their `roles` array but contain tools that require engineering knowledge to use. Examples:
- S1.3 (Train AI on brand style) — tools: JavasLabs, AI Toolkit, Replicate
- S2.11 (Build software with AI) — tools: Cursor, Lovable, Claude Code
- S3.4 (Automate full workflow) — tools: n8n, LangChain (LangChain is engineering)
- S3.6 (Measure if AI is working) — tools: LangSmith, Langfuse (developer monitoring tools)

**Why it matters:**
The `roles` array controls which skills get pulled into a marketer's roadmap. If engineering-flavoured skills pass the role filter, the LLM generates subnode content using those skills — and produces technically accurate but completely wrong output for a non-technical audience. This is the most likely direct cause of the "false false outputs" the founder described.

**The distinction missing from the data:**
There is no field that separates "this role should DO this skill" from "this role should KNOW this skill exists." Both currently map to `roles`. The `roles_adjacent` field exists but is not being used consistently or with clear rules.

### Bug 3 — Glossary is generated in parallel, not derived
**What was found:**
The current system generates roadmap content and glossary content in the same pass or in separate parallel LLM calls. The result is glossary terms that do not match the terms appearing in the actual nodes.

Evidence from the live UI screenshot: "Few-shot prompting" and "Structured output" appear in the glossary for the marketer roadmap, but neither term appears in any node name on the canvas.

**Why it matters:**
The glossary's entire purpose is to be a lookup table for terms the person encounters in the roadmap. If the terms don't match, the glossary is decorative — not functional. It creates an illusion of support without providing it.

### Bug 4 — Checkpoint hints are too thin to be credible
**What was found:**
The `checkpoint_hint` field in `skill-clusters.ts` is a single vague sentence. Example: "Automate one end-to-end workflow using n8n that runs on a trigger and requires zero manual steps."

**Why it matters:**
A non-technical person reading this does not know what workflow, what data, what output, what done looks like. The vagueness makes the checkpoint feel impossible — which is the opposite of the intended "I can do this" feeling. Checkpoints need a scenario, not a hint.

### Bug 5 — Node names are capability labels, not outcome statements
**What was found:**
Every node name in the current system describes what a technology does, not what the person gains. From the live UI: "AI Marketing Content at Scale," "AI Market Intelligence," "AI Influencer and UGC Campaigns," "AI-Native Marketing Workflow."

**Why it matters:**
Capability labels speak to someone who already understands the capability. A non-technical person reads "AI Market Intelligence" and thinks "what does that mean for me?" An outcome statement answers that question before they ask it. The current naming convention is designed for a technical audience, not for the 6 non-technical personas this product serves.

### Bug 6 — The autonomy progression is invisible on the canvas
**What was found:**
Looking at the live UI, there are 6 nodes connected by a path. There is no visual or textual signal that tells the person their relationship with AI is changing across the journey. All 6 nodes look like equal steps.

**Why it matters:**
The autonomy progression — assisted → delegated → autonomous — is the emotional engine of the roadmap. It's what makes Phase 3 feel like a destination worth reaching, not just more topics. If it's invisible, the roadmap is a list. If it's visible, the roadmap is a journey.

---

## Section 4 — The Architectural Issue Beneath All the Bugs

This is the most important finding. All 6 bugs above are symptoms of one root cause.

**The root cause: the roadmap is generated, not authored.**

The current system asks an LLM to invent the entire roadmap — node names, subnode names, analogies, glossary terms, checkpoint hints — at runtime, from a prompt, every time. The source data (skill clusters, curriculum seed) provides parameters and permissions. The LLM fills in all the content.

This architecture is non-deterministic by design. Every call produces slightly different output. There is no fixed content to validate against. There is no authored skeleton that guarantees the right concepts appear in the right places for the right role. The LLM is not personalising around a fixed structure — it is inventing the structure every time.

**The consequence:** you cannot fix the output quality by improving the prompt alone. You can make the output slightly less wrong. You cannot make it reliably right. Because "reliably right" requires authored ground truth that does not currently exist anywhere in the system.

**The insight from the interview that surfaces this:**
When the founder explained how he taught RAG to his sales rep — he didn't generate a new explanation each time from a prompt. He had a mental model he had developed and refined. He delivered that mental model every time, in language calibrated to the person in front of him. The LLM's job should be calibration, not invention.

---

## Section 5 — What Was NOT Resolved in This Interview

These are open questions that Claude Code will need to investigate in the codebase:

1. **Where exactly does the roadmap generation happen?** What file, what function, what prompt? How does it consume the cluster and skill data?

2. **What is the full typed shape of the roadmap output?** What interface or type defines the final roadmap object? Are node names, subnode names, analogies, and glossary terms all generated fields? Or are any of them sourced directly from the seed data?

3. **How is the role filter applied?** Is it a simple array includes check on `roles`? Or is there additional logic? Is `roles_adjacent` used anywhere in the generator?

4. **Is the glossary generated in the same LLM call as the roadmap, or separately?** What is the exact prompt that generates it?

5. **What does the system do when the LLM output doesn't match the expected structure?** Is there validation? A fallback? Or does bad output go straight to the UI?

6. **How are the 3 phases separated in the generator?** Is it by module number? By skill `seq_order`? By cluster assignment? The answer here will reveal exactly how the C2A/C3B blurring happens in practice.

---

## Section 6 — The Standard Claude Code Must Achieve

After reading this document and analysing the codebase, the system should be capable of producing a roadmap where:

1. A non-technical marketer reads every main node name and immediately understands what they will be able to do — without knowing any AI terminology.

2. The three phases feel like three distinct life stages — not three chapters of the same textbook.

3. Every technical term in the side panel has a matching definition in the glossary. No term appears in the glossary that does not appear in the roadmap content.

4. Every project checkpoint is specific enough that the person knows exactly what they will build, with which tools, and what done looks like.

5. The analogy in each side panel uses a situation from the person's actual job — not a generic everyday metaphor.

6. A non-technical person can read the entire roadmap, including all side panels, without needing to Google a single term — because everything is either explained inline or defined in the glossary.

If the system cannot produce output that meets all 6 of these standards reliably and consistently, the architecture needs to change — not just the prompt.

---

*Document produced: May 2026*
*Based on: Socratic interview with 100xEngineers founder*
*Purpose: Brief Claude Code for surgical codebase analysis and fix proposal*
*Do not implement fixes from this document. Analyse first. Propose second. Implement third.*
