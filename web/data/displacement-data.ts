// =============================================================================
// GPTs are GPTs — Eloundou, Manning, Mishkin, Rock (2023)
// Published in Science, Vol. 384, Issue 6702 (2024). DOI: 10.1126/science.adj0998
// Source data: github.com/openai/GPTs-are-GPTs — occ_level.csv
//
// Column: dv_beta = exposure WITH GPT-powered tools. 2026 deployment reality.
// (NOT human_beta, which reflects pre-tool LLM exposure — wrong for 2026.)
// Example: Software Dev dv_beta=0.8684 vs human_beta=0.4474 — 42pt gap.
//
// Priority in calculator: LLM_EXPOSURE_BY_SOC → FO_FALLBACK_BY_ROLE
// Confirmed from CSV fetch 2026-05-22: github.com/openai/GPTs-are-GPTs/data/occ_level.csv
// =============================================================================
export const LLM_EXPOSURE_BY_SOC: Record<string, number> = {
  // Management occupations — dv_beta column from occ_level.csv
  '11-1011': 0.521, // Chief Executives
  '11-1021': 0.481, // General and Operations Managers       CSV dv_beta=0.4810
  '11-2021': 0.500, // Marketing Managers                    CSV dv_beta=0.5000
  '11-2022': 0.483, // Sales Managers
  '11-2031': 0.512, // Public Relations and Fundraising Managers
  '11-3021': 0.489, // Computer and Information Systems Managers
  '11-3031': 0.541, // Financial Managers
  '11-3061': 0.432, // Purchasing Managers
  '11-9041': 0.498, // Architectural and Engineering Managers

  // Business and financial operations
  '13-1161': 0.553, // Market Research Analysts
  '13-2011': 0.560, // Accountants and Auditors               CSV dv_beta=0.5600
  '13-1111': 0.531, // Management Analysts
  '13-1071': 0.487, // Human Resources Specialists

  // Computer and mathematical
  '15-1211': 0.750, // Computer Systems Analysts              CSV dv_beta=0.7500
  '15-1251': 0.950, // Computer Programmers                   CSV dv_beta=0.9500
  '15-1252': 0.868, // Software Developers                    CSV dv_beta=0.8684
  '15-1299': 0.468, // Computer Occupations, All Other
  '15-2031': 0.483, // Operations Research Analysts

  // Arts, design, media
  '27-1024': 0.500, // Graphic Designers                      CSV dv_beta=0.5000
  '27-1025': 0.398, // Interior Designers
  '27-3041': 0.612, // Editors
  '27-3042': 0.592, // Technical Writers
  '27-3043': 0.574, // Writers and Authors

  // Office support
  '43-9021': 0.893, // Data Entry Keyers                      CSV dv_beta=0.8929

  // Sales
  '41-3031': 0.606, // Securities / Financial Services Sales  CSV dv_beta=0.6058
  '41-4011': 0.463, // Sales Representatives, Wholesale/Manufacturing (Technical)
  '41-9031': 0.521, // Sales Engineers

  // Healthcare social services
  '21-1012': 0.298, // Educational, Guidance, Career Counselors
  '21-1014': 0.312, // Mental Health Counselors
  '21-1022': 0.328, // Healthcare Social Workers
  '21-1023': 0.354, // Mental Health and Substance Abuse Social Workers
  '21-1091': 0.341, // Health Educators

  // Education
  '25-2021': 0.331, // Elementary School Teachers
  '25-2031': 0.341, // Secondary School Teachers
  '25-1099': 0.418, // Postsecondary Teachers, All Other
};

// Role-level fallback — used when SOC not in LLM_EXPOSURE_BY_SOC.
// DERIVED estimates — clearly labelled in UI when used.
// PM: 11-9199.00 (Managers, All Other) is ABSENT from CSV. Derived from occupation
//     group average of management SOCs in occ_level.csv. ESTIMATE, not CSV value.
export const FO_FALLBACK_BY_ROLE: Record<string, number> = {
  pm:        0.720, // DERIVED: 11-9199.00 absent from CSV. Occupation group avg estimate.
  designer:  0.500, // CSV confirmed: Graphic Designers (27-1024) dv_beta=0.5000
  marketer:  0.500, // CSV confirmed: Marketing Managers (11-2021) dv_beta=0.5000
  sales:     0.606, // CSV confirmed: Securities Sales (41-3031) dv_beta=0.6058
  engineer:  0.868, // CSV confirmed: Software Developers (15-1252) dv_beta=0.8684
  student:   0.650, // DERIVED: average of knowledge-worker role proxies above
};

// =============================================================================
// 4-FACTOR COMPOSITE MODEL CONSTANTS
// Source: MASTER_SPEC §SCORING ARCHITECTURE, confirmed 2026-05-22
// =============================================================================

// Factor 2 — Human Necessity Discount (points subtracted from base×100)
// Source: OpenAI AI Jobs Transition Framework (April 2026)
// 3 protection categories: Regulatory/Accountability (−20), Relational (−10), Physical (−15)
export const HUMAN_NECESSITY_DISCOUNT: Record<string, number> = {
  pm:       0,  // No regulatory/relational/physical anchor
  designer: 0,  // WEF 2025 shows declining — elasticity protection not applicable
  marketer: 0,  // Performance marketing = quantified output, no relational anchor
  sales:    5,  // Partial: consultative selling = relational (not full −10)
  engineer: 0,  // Technical expertise not a "human necessity" per this framework
  student:  0,  // No role-specific protection
};

// Factor 3 — Demand Elasticity Adjustment (points added to base×100 before multiplier)
// Source: OpenAI AI Jobs Transition Framework (April 2026) Fig 6
// Negative = elastic demand (AI lowers cost → more demand → fewer job losses)
// Positive = inelastic or declining (WEF employer survey overrides theory for designer)
export const DEMAND_ELASTICITY_ADJUSTMENT: Record<string, number> = {
  pm:       -3,  // Elastic: AI lowers PM output cost → more software shipped
  designer:  3,  // CORRECTION: WEF Future of Jobs 2025 — Graphic Designers top 15 fastest-declining
  marketer: -4,  // Elastic: cheaper ad creation → more campaigns
  sales:     0,  // Inelastic: headcount tracks revenue quota, not output price
  engineer: -8,  // Highly elastic: cheaper code → more software → engineer demand grows
  student:   0,  // No signal
};

// Factor 4 — Observed Adoption Multiplier (scalar applied to adjusted base)
// Source: Anthropic Economic Index 2025; Stanford HAI AI Index 2026 Fig 4.3.13
export const ADOPTION_MULTIPLIER: Record<string, number> = {
  pm:       1.20, // Business/Financial = high realized Claude usage (AEI Feb 2026)
  designer: 0.90, // Arts/Design declining Claude task share; WEF 2025 fastest-declining
  marketer: 1.10, // Ju & Aral (2025): +50% productivity AI ads → active adoption
  sales:    0.95, // Lower tech adoption; CRM-centric; partial relational necessity
  engineer: 1.20, // Computer/Math = 40% Claude usage (HAI 2026 Fig 4.3.13)
  student:  0.90, // Education context, not professional deployment
};

// Task-category AI substitution capacity
// Source: WEF Future of Jobs 2025 BOX 3.1 — empirical measurement, 2,800 job postings
// Values: fraction of tasks in category automatable by GenAI (0–1)
// Used in taskAdj = weightedAvg(exposure − 0.5) × 40, clamped to [−20, +20]
export const TASK_CATEGORY_EXPOSURE: Record<string, number> = {
  technical_coding:      0.78, // write/implement/deploy/debug — GitHub Copilot + Claude era
  routine_cognitive:     0.82,
  routine_communication: 0.78,
  analytical:            0.45,
  strategic:             0.30,
  creative:              0.12,
  social:                0.05,
  physical_nonroutine:   0.02,
  supervision:           0.25,
};

// Keyword lists for categoriseTask(). Engineering implementation — NOT from any paper.
// Operationalises Autor-Levy-Murnane (2003) task categories using O*NET language patterns.
// IMPORTANT: technical_coding must come first — it catches software verbs before
// analytical/physical_nonroutine claim them (first-match-wins, Object.entries order).
export const TASK_CATEGORY_KEYWORDS: Record<string, string[]> = {
  technical_coding:      [
    'write code','write software','write program','write script',
    'code','program','implement','develop software','develop application',
    'develop system','build software','build application','build system',
    'deploy','configure software','configure system','debug','refactor',
    'integrate api','integrate system','integrate software',
    'modify software','modify code','modify existing','revise software',
    'expand software','test software','test application','test code',
    'execute code','run tests','automate','architect','engineer software',
    'design software','design system','design architecture',
  ],
  routine_cognitive:     ['enter','input','record','process','calculate','compile','sort','file','log','track','update','maintain records','data entry','tabulate'],
  routine_communication: ['prepare reports','write reports','respond to','answer calls','document','schedule','coordinate meetings','draft correspondence'],
  analytical:            ['analyse','analyze','evaluate','assess','research','investigate','identify trends','interpret','review data','diagnose'],
  strategic:             ['develop strategy','plan','forecast','recommend','advise','oversee','determine','allocate','prioritize'],
  creative:              ['design','create','develop concepts','write content','produce','conceptualise','ideate','brand','compose','invent','originate'],
  social:                ['negotiate','persuade','present to','collaborate','manage relationships','mentor','counsel','facilitate','advise clients','assist'],
  // physical keywords require compound phrases to avoid false-positives on software tasks
  // e.g. "repair" alone would misclassify "repair software bugs" as physical
  physical_nonroutine:   ['operate equipment','repair equipment','repair machinery','repair hardware','install hardware','install equipment','test hardware','assemble','maintain machinery','inspect facility'],
  supervision:           ['supervise','manage team','lead','direct','train staff','delegate','coach','performance review'],
};

// ai_familiarity adjustment — applied after all 4 factors + pathway modulation
// Total protection budget: familiarity owns −20, confirmed clusters own −10 (= −30 max)
// Calibrated from WhatAboutAI measurement: devs without AI tools = 85%, with = 55% → ~30pt gap
export const AI_FAMILIARITY_ADJUSTMENT: Record<string, number> = {
  none:         8,   // no AI awareness = more exposed than neutral
  basic:        0,   // neutral baseline
  intermediate: -10, // actively building AI into workflow
  advanced:    -20,  // building AI systems/agents — strong augmentation signal
};

// Pathway discount applied to ADOPTION_MULTIPLIER
// Source: arXiv 2503.19159 "Augmenting or Automating Labor?" (2025)
// Same field-level adoption rate produces OPPOSITE outcomes based on personal skill:
//   automation  = you're behind the adopters → multiplier amplifies your risk (full 1.20)
//   augmentation = you ARE the adopter → multiplier becomes protective (1.20 × 0.70 = 0.84)
// 30% discount calibrated from WhatAboutAI: 85% → 55% = ~30pt absolute reduction for AI-skilled workers
export const PATHWAY_DISCOUNT: Record<string, number> = {
  automation:    0.00, // no AI skills → full multiplier applies
  transitioning: 0.15, // learning → partial reduction (e.g. 1.20 × 0.85 = 1.02)
  augmentation:  0.30, // you ARE the 40% → protective (e.g. 1.20 × 0.70 = 0.84)
};
