# Roadmap JSON Schema Contract

Date: 2026-04-23
Status: locked v1 contract
Purpose: canonical schema for roadmap generation, rendering, reminders, storage, and future revisions

## 1. Purpose

This schema is the source-of-truth artifact contract for v1.

It must support:
- roadmap generation
- SVG rendering
- PNG export
- reminder email generation
- Supabase storage
- hidden revisions
- future v2 chat editing

Everything downstream should depend on this schema, not on ad hoc fields.

## 2. Product Context

This schema is for:
- `100x AI Roadmap Builder`
- AI-only destination paths
- users from any background
- 3-month or 6-month roadmap
- 100x/Zeno-backed curriculum guidance

It is not for:
- generic non-AI career plans
- interactive graph data structures
- live progress tracking
- v1 chat editing state

## 3. Schema Rules

### Hard Rules

- roadmap JSON is the canonical artifact
- 3 months = exactly 3 phases
- 6 months = exactly 6 phases
- each phase spans exactly 4 weeks
- max 8 skills in skill tree
- max 2 resources per milestone
- reminder content is pre-generated and stored here
- exact Zeno sources are hidden from the SVG UI
- source metadata must still be preserved internally

### Confidence Rules

- if Zeno retrieval is weak, set `source_strategy.zeno_confidence = "low"`
- roadmap may still generate using general AI-domain bridging knowledge
- the model must never claim non-existent progress tracking

## 4. Top-Level Shape

```json
{
  "version": "1",
  "roadmap_title": "",
  "user_profile": {},
  "source_strategy": {},
  "summary": "",
  "target_outcome": "",
  "success_metrics": [],
  "assumptions": [],
  "risks": [],
  "next_7_days": [],
  "phases": [],
  "skill_tree": [],
  "coaching_note": "",
  "reminder_emails": {},
  "download_metadata": {},
  "evidence_used": []
}
```

## 5. Field Definitions

### `version`

Type:
- string

Allowed:
- `"1"`

Purpose:
- schema versioning

### `roadmap_title`

Type:
- string

Example:
- `"3-Month Roadmap to Become an AI Engineer"`

Rules:
- 10-120 chars
- human-readable
- role-focused

### `user_profile`

Type:
- object

Required fields:

```json
{
  "name": "Vishal",
  "goal": "Become an AI engineer",
  "background": "Software developer",
  "experience_range": "1-3 years",
  "weak_areas": ["AI / LLMs", "System design"],
  "hours_per_week": "5-8",
  "learning_style": "Building projects",
  "timeframe_months": 3,
  "phone_country": "IN"
}
```

Rules:
- `name`: 1-60 chars
- `goal`: 10-160 chars
- `background`: enum-like string from allowed input options or validated extension
- `experience_range`: one of `<1 year`, `1-3 years`, `3-7 years`, `7+ years`
- `weak_areas`: 1-8 values
- `hours_per_week`: one of `2-4`, `5-8`, `9-15`, `15+`
- `learning_style`: one of `Building projects`, `Watching videos`, `Reading docs`, `Guided tasks`, `Mixed`
- `timeframe_months`: `3` or `6`
- `phone_country`: `"IN"` for v1

### `source_strategy`

Type:
- object

Shape:

```json
{
  "domain_mapping": "llm_general_knowledge",
  "zeno_usage": "relevant_enrichment_only",
  "fallback_allowed": true,
  "zeno_confidence": "high"
}
```

Rules:
- `domain_mapping`: fixed string for v1
- `zeno_usage`: fixed string for v1
- `fallback_allowed`: boolean
- `zeno_confidence`: `"high"` or `"low"`

Purpose:
- tells downstream systems how the roadmap was constructed

### `summary`

Type:
- string

Purpose:
- short direct coaching summary

Rules:
- 1 paragraph
- 80-500 chars
- direct tone
- no hype

### `target_outcome`

Type:
- string

Purpose:
- exact expected outcome after 3 or 6 months

Rules:
- concrete
- AI-specific
- role or output based

### `success_metrics`

Type:
- string array

Purpose:
- measurable success signals for this roadmap

Rules:
- 2 to 5 items
- must be concrete

Examples:
- `"Build and deploy 2 AI projects"`
- `"Understand and implement basic RAG and tool-calling patterns"`
- `"Be interview-ready for entry AI engineer roles"`

### `assumptions`

Type:
- string array

Purpose:
- explicit assumptions used in the roadmap

Rules:
- 1 to 5 items
- realistic and user-specific

Examples:
- `"You can consistently commit 5-8 hours per week"`
- `"You are willing to build projects, not just consume content"`

### `risks`

Type:
- string array

Purpose:
- biggest risks that could derail this roadmap

Rules:
- 1 to 5 items
- direct and honest

Examples:
- `"You may over-focus on theory and delay project work"`
- `"Your weak system design foundation may slow Phase 2"`

### `next_7_days`

Type:
- string array

Purpose:
- immediate short-term actions

Rules:
- exactly 3 to 5 items
- highly actionable
- first-week focused

### `phases`

Type:
- array of objects

Rules:
- if `timeframe_months = 3`, must have exactly 3 phases
- if `timeframe_months = 6`, must have exactly 6 phases

#### Phase Shape

```json
{
  "id": "phase-1",
  "title": "Foundation",
  "weeks": "1-4",
  "focus": "Build base understanding of LLM applications and workflows",
  "milestones": [],
  "weekly_actions": []
}
```

#### Phase Rules

- `id`: unique string
- `title`: 3-60 chars
- `weeks`: fixed based on roadmap duration and phase position
- `focus`: 20-180 chars
- `milestones`: 2-6 recommended
- `weekly_actions`: 2-6 recommended

#### Phase Week Labels

For 3-month roadmap:
- phase 1 -> `1-4`
- phase 2 -> `5-8`
- phase 3 -> `9-12`

For 6-month roadmap:
- phase 1 -> `1-4`
- phase 2 -> `5-8`
- phase 3 -> `9-12`
- phase 4 -> `13-16`
- phase 5 -> `17-20`
- phase 6 -> `21-24`

### `milestones`

Type:
- array inside phase

#### Milestone Shape

```json
{
  "title": "Understand core LLM app architecture",
  "type": "concept",
  "priority": "high",
  "done": false,
  "resources": [
    {
      "title": "Full Stack LLM Architecture",
      "source": "zeno",
      "key": "concepts/full-stack-llm-architecture"
    },
    {
      "title": "Bridge from current background",
      "source": "model_knowledge"
    }
  ]
}
```

#### Milestone Rules

- `title`: 5-120 chars
- `type`: `"concept"`, `"project"`, or `"skill"`
- `priority`: `"high"`, `"medium"`, `"low"`
- `done`: always `false` in v1 initial generation
- `resources`: max 2

### `resources`

Type:
- array inside milestone

#### Resource Shape

```json
{
  "title": "AI Agents React",
  "source": "zeno",
  "key": "concepts/ai-agents-react"
}
```

or

```json
{
  "title": "Bridge from design to AI builder workflows",
  "source": "model_knowledge"
}
```

Rules:
- `source` must be one of:
  - `"zeno"`
  - `"model_knowledge"`
  - `"user_input"`
- `key` is required if `source = "zeno"`
- `key` omitted otherwise

### `weekly_actions`

Type:
- string array inside phase

Purpose:
- direct weekly execution suggestions

Rules:
- 2-6 items per phase
- action-oriented
- specific enough to guide behavior

### `skill_tree`

Type:
- array of objects

Rules:
- max 8 items

#### Skill Shape

```json
{
  "name": "AI / LLMs",
  "current_level": 2,
  "target_level": 4,
  "category": "ai",
  "unlocks": ["RAG", "Agents", "Tool Calling"]
}
```

#### Skill Rules

- `name`: 2-50 chars
- `current_level`: integer `1-5`
- `target_level`: integer `1-5`
- `target_level >= current_level`
- `category`: one of:
  - `foundation`
  - `ai`
  - `deployment`
  - `product`
  - `design`
  - `business`
- `unlocks`: 0-5 strings

### `coaching_note`

Type:
- string

Purpose:
- short direct coach-style warning or focus note

Rules:
- 40-220 chars
- must be practical

### `reminder_emails`

Type:
- object

Shape:

```json
{
  "day_3": {
    "subject": "Day 3 check-in: Vishal, here's where you should be",
    "preview": "A quick check-in on your roadmap start.",
    "headline": "Day 3 check-in",
    "body_context": "Expected roadmap progress guidance based on the first week.",
    "cta_label": "Open your roadmap",
    "cta_path": "/roadmap/abc"
  },
  "day_6": {
    "subject": "Day 6: Phase 1 is almost done, Vishal",
    "preview": "You're one week into your roadmap.",
    "headline": "Week 1 check-in",
    "body_context": "Expected completion guidance for the first roadmap block.",
    "cta_label": "Continue Phase 1",
    "cta_path": "/roadmap/abc"
  }
}
```

Rules:
- both `day_3` and `day_6` required
- content must refer to expected progress, not tracked progress
- `cta_path` must point to a valid roadmap route shape

### `download_metadata`

Type:
- object

Shape:

```json
{
  "theme": "100x-light",
  "width": 1200,
  "height": 1800,
  "generated_at": "2026-04-23T00:00:00.000Z"
}
```

Rules:
- `theme`: `"100x-light"`
- `width`: `1200`
- `height`: `1800`
- `generated_at`: ISO datetime

### `evidence_used`

Type:
- array

Purpose:
- preserve internal source trace for debugging and future inspection

Shape:

```json
{
  "key": "concepts/ai-agents-react",
  "title": "AI Agents React",
  "source": "zeno"
}
```

Rules:
- no UI requirement
- internal trace only

## 6. Validation Rules

### Structural Validation

- reject if required top-level fields missing
- reject if months/phases mismatch
- reject if more than 8 skills
- reject if any milestone has more than 2 resources
- reject if any resource `source = "zeno"` without `key`

### Content Validation

- reject if roadmap is not AI-domain-specific
- reject if summary is generic or hype-heavy
- reject if reminders imply actual tracked completion
- reject if roadmap does not adapt user background into AI path

### Recovery Strategy

If validation fails:
- retry generation once with validation errors summarized
- if second attempt fails, mark roadmap generation failed

## 7. Rendering Expectations

The SVG renderer will expect:
- `roadmap_title`
- `user_profile.name`
- `target_outcome`
- `summary`
- `phases`
- `skill_tree`
- `coaching_note`
- footer metadata

The SVG should not require:
- `evidence_used`
- exact resource keys
- raw excerpts

## 8. Reminder Expectations

Reminder sender will expect:
- `reminder_emails.day_3`
- `reminder_emails.day_6`
- roadmap URL / CTA path

Reminder sender does not call the LLM in v1.

## 9. Example Minimal Valid Object

```json
{
  "version": "1",
  "roadmap_title": "3-Month Roadmap to Become an AI Engineer",
  "user_profile": {
    "name": "Aarav",
    "goal": "Become an AI engineer",
    "background": "Designer",
    "experience_range": "1-3 years",
    "weak_areas": ["Programming fundamentals", "AI / LLMs"],
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
  "summary": "You already have product intuition and visual thinking, but your roadmap must aggressively close the programming and LLM fundamentals gap first.",
  "target_outcome": "Build and ship 2 practical AI projects and become ready for junior AI engineer roles.",
  "success_metrics": [
    "Ship 2 working AI projects",
    "Understand core LLM app building blocks",
    "Be able to explain RAG, tool calling, and deployment basics"
  ],
  "assumptions": [
    "You can consistently commit 5-8 hours per week"
  ],
  "risks": [
    "You may spend too much time consuming content without building"
  ],
  "next_7_days": [
    "Set up your build environment",
    "Study the basics of full-stack LLM architecture",
    "Start your first small AI app"
  ],
  "phases": [
    {
      "id": "phase-1",
      "title": "Foundation",
      "weeks": "1-4",
      "focus": "Close core programming and LLM app fundamentals gaps.",
      "milestones": [
        {
          "title": "Understand full-stack LLM architecture",
          "type": "concept",
          "priority": "high",
          "done": false,
          "resources": [
            {
              "title": "Full Stack LLM Architecture",
              "source": "zeno",
              "key": "concepts/full-stack-llm-architecture"
            }
          ]
        }
      ],
      "weekly_actions": [
        "Study 100x architecture concepts",
        "Build one small LLM-backed app"
      ]
    },
    {
      "id": "phase-2",
      "title": "Application",
      "weeks": "5-8",
      "focus": "Move from fundamentals into project execution.",
      "milestones": [],
      "weekly_actions": []
    },
    {
      "id": "phase-3",
      "title": "Execution",
      "weeks": "9-12",
      "focus": "Consolidate projects and become role-ready.",
      "milestones": [],
      "weekly_actions": []
    }
  ],
  "skill_tree": [
    {
      "name": "AI / LLMs",
      "current_level": 2,
      "target_level": 4,
      "category": "ai",
      "unlocks": ["RAG", "Tool Calling"]
    }
  ],
  "coaching_note": "Do not hide behind research. Your progress will depend on shipping quickly.",
  "reminder_emails": {
    "day_3": {
      "subject": "Day 3 check-in: Aarav, here's where you should be",
      "preview": "A quick check-in on your roadmap start.",
      "headline": "Day 3 check-in",
      "body_context": "By day 3, you should already be inside Phase 1 and moving through your first setup and study tasks.",
      "cta_label": "Open your roadmap",
      "cta_path": "/roadmap/example"
    },
    "day_6": {
      "subject": "Day 6: Phase 1 is almost done, Aarav",
      "preview": "You're one week into your roadmap.",
      "headline": "Week 1 check-in",
      "body_context": "Before closing your first week, make sure you have moved through the foundational architecture concepts and started a project.",
      "cta_label": "Continue Phase 1",
      "cta_path": "/roadmap/example"
    }
  },
  "download_metadata": {
    "theme": "100x-light",
    "width": 1200,
    "height": 1800,
    "generated_at": "2026-04-23T00:00:00.000Z"
  },
  "evidence_used": [
    {
      "key": "concepts/full-stack-llm-architecture",
      "title": "Full Stack LLM Architecture",
      "source": "zeno"
    }
  ]
}
```

## 10. Build Session Instruction

When implementation starts:
- generate against this schema
- validate against this schema
- do not invent extra fields without updating this document
- if a field is not rendered in SVG, still preserve it if it is part of roadmap intelligence or reminders
