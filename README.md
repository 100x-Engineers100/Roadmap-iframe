# AI Displacement Risk Calculator + Roadmap Generator

A research-backed web tool that helps professionals understand how exposed their role is to AI disruption, then gives them a practical 90-day roadmap to become AI-native in their work.

## Overview

The product turns career uncertainty into a clear learning path.

Users enter their job role, adjust how they spend time across key tasks, receive an AI displacement risk score, see their skill gap, and unlock a personalized roadmap built around applied AI capabilities.

```txt
Role input -> task profile -> risk score -> skill gap -> personalized roadmap
```

## Product Goals

- Help professionals understand their AI exposure in plain English.
- Convert abstract AI risk into specific skill gaps.
- Recommend a practical 90-day path toward AI-native work.
- Support high-intent lead capture for applied AI education.

## User Journey

| Step | User experience | Outcome |
|---|---|---|
| 1 | Enter current job role | Role is matched to a standard occupation profile |
| 2 | Adjust task sliders | The score reflects how the user actually spends time |
| 3 | View risk score | User sees risk level and plain-English explanation |
| 4 | Review skill gap | Transferable strengths and missing skills are separated |
| 5 | Unlock roadmap | User receives a personalized 90-day learning path |

## Input -> Processing -> Output

### Inputs

| Input | Purpose |
|---|---|
| Job description | Identifies the closest occupation profile |
| Task time allocation | Personalizes risk based on actual work patterns |
| Name and email | Unlocks roadmap and enables follow-up |
| Occupation task data | Anchors task analysis in real labor-market data |
| Curriculum skill map | Connects user gaps to teachable applied AI skills |

### Processing

| Stage | What happens |
|---|---|
| Occupation matching | Free-text job input is mapped to a standard occupation code |
| Task analysis | Role tasks are weighted by user-selected Low / Medium / High allocation |
| Risk scoring | A composite model estimates AI displacement risk |
| Skill gap inference | Current role strengths are separated from missing AI-native skills |
| Roadmap generation | A 3-step, 90-day roadmap is generated from score, role, and skill gaps |

### Outputs

| Output | Description |
|---|---|
| Risk score | A 0-100 score with LOW, MODERATE, HIGH, or CRITICAL band |
| Score explanation | Plain-English reasoning behind the score |
| Skill gap view | Green transferable skills and red learning gaps |
| Roadmap | A 90-day applied AI plan with clickable learning nodes |
| Program CTA | A next step toward structured applied AI training |

## Score Model

The calculator uses a 4-factor composite model:

```txt
priorScore = (base_score - human_necessity_discount + demand_elasticity_adjustment) * adoption_multiplier
finalScore = clamp(priorScore + task_adjustment, 0, 100) + market_calibration
```

| Factor | Meaning |
|---|---|
| Base AI exposure | How exposed the occupation is to current AI systems |
| Human necessity | Whether the role requires human accountability, relationship, or physical presence |
| Demand elasticity | Whether AI makes demand for the role grow or shrink |
| Observed adoption | How much AI is already being used in similar work |
| Task adjustment | How the user's actual task mix raises or lowers risk |
| Market calibration | Regional and sector context applied where relevant |

## Score Bands

| Band | Range | Meaning |
|---|---:|---|
| LOW | 0-35 | Role is largely resilient to current AI capabilities |
| MODERATE | 36-60 | Significant exposure; reskilling is recommended |
| HIGH | 61-80 | High substitution risk within 3-5 years |
| CRITICAL | 81-100 | Core tasks are highly exposed to current AI systems |

## Roadmap Experience

The roadmap is designed as a visual learning path, not a static report.

- 3 phases across 90 days.
- 2-3 top-level nodes per phase.
- Snake-style roadmap spine with compact clickable nodes.
- Each node opens a side panel with detailed subnodes.
- Project checkpoints are shown inside the relevant node panel.
- The final phase ends with a portfolio-style capstone project.

## Curriculum Structure

| Module | Focus |
|---|---|
| AI Content Creation | Image generation, video avatars, content workflows |
| Full-Stack AI Applications | Prompting, retrieval, fine-tuning, tool use, app workflows |
| AI Agents and Automation | Workflow automation, agents, guardrails, evaluation |

Role-to-curriculum mapping:

| Role type | Primary curriculum focus |
|---|---|
| Product | AI application workflows and automation |
| Design | AI content creation and automation |
| Marketing | AI content systems and automation |
| Sales | AI content workflows and automation |
| Engineering | AI applications and automation |
| Student | Broad applied AI foundation |

## Research Basis

The scoring model draws from current labor-market, AI exposure, adoption, and productivity research.

| Source | Year | Used for |
|---|---:|---|
| Eloundou et al., "GPTs are GPTs" | 2023 | Base occupation-level AI exposure |
| OpenAI, "AI and the Labor Market: The Jobs Transition Framework" | 2026 | Human necessity and demand elasticity |
| Anthropic Economic Index | 2025-2026 | Observed AI usage by occupation and task |
| Stanford HAI AI Index Report | 2026 | Adoption validation and labor-market signals |
| World Economic Forum, Future of Jobs Report | 2025 | Task exposure, industry automation, regional calibration |
| Brynjolfsson, Li, and Raymond, "Generative AI at Work" | 2023 | Productivity and reskilling narrative |
| Frey and Osborne, "The Future of Employment" | 2013 | Historical fallback automation benchmark |

## Architecture Summary

```txt
Frontend
  Role input
  Task sliders
  Score reveal
  Skill gap view
  Roadmap view

Backend
  Occupation matching
  Task fetching
  Risk scoring
  Lead capture
  Roadmap generation

External systems
  Occupation data
  AI model provider
  Database
  Email platform
```

## Data Captured

For each completed lead, the system stores:

- Name and email
- Matched occupation code and title
- Role category
- Risk score and band
- Task weights
- Skill gap
- Generated roadmap
- Email follow-up status

## Cost Profile

| Operation | Estimated cost |
|---|---:|
| Occupation matching | ~$0.001 |
| Roadmap generation | ~$0.006 |
| Occupation data lookup | Free |
| Database write | < $0.001 |
| Total per completed lead | ~$0.007-0.01 |

## Launch Considerations

Critical before launch:

- Input sanitization for user job descriptions.
- Rate limiting on AI-backed endpoints.
- Server-side validation for all lead submissions.
- Timeout-safe roadmap generation.
- Fallback roadmap if AI generation fails.

Operational improvements:

- Cache repeated occupation matches.
- Cache occupation task lookups.
- Monitor API errors and roadmap generation failures.
- Track roadmap views, node opens, and CTA clicks.

## Status

The product flow covers risk calculation, skill gap discovery, email unlock, and 90-day roadmap generation. The next focus is roadmap UI polish, component cleanup, and production hardening.
