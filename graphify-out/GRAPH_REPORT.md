# Graph Report - .  (2026-05-28)

## Corpus Check
- 104 files · ~482,621 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 753 nodes · 1270 edges · 60 communities (47 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Roadmap UI Components|Roadmap UI Components]]
- [[_COMMUNITY_Score & Skill API Routes|Score & Skill API Routes]]
- [[_COMMUNITY_ONET API Integration|O*NET API Integration]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Content & Analogy System|Content & Analogy System]]
- [[_COMMUNITY_Roadmap Generation & Testing|Roadmap Generation & Testing]]
- [[_COMMUNITY_FO Score Model|FO Score Model]]
- [[_COMMUNITY_Panel Copy & Delta System|Panel Copy & Delta System]]
- [[_COMMUNITY_Roadmap Validation|Roadmap Validation]]
- [[_COMMUNITY_Schema & Delta Builder|Schema & Delta Builder]]
- [[_COMMUNITY_Assessment UI State|Assessment UI State]]
- [[_COMMUNITY_Role Input UI|Role Input UI]]
- [[_COMMUNITY_Assess Page Logic|Assess Page Logic]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Funnel Flow UI|Funnel Flow UI]]
- [[_COMMUNITY_Validation Issue Codes|Validation Issue Codes]]
- [[_COMMUNITY_Zeno Curriculum Corrections|Zeno Curriculum Corrections]]
- [[_COMMUNITY_Lead & Score API|Lead & Score API]]
- [[_COMMUNITY_Blueprint to Roadmap Transform|Blueprint to Roadmap Transform]]
- [[_COMMUNITY_Blueprint Builder|Blueprint Builder]]
- [[_COMMUNITY_Capability Matrix|Capability Matrix]]
- [[_COMMUNITY_Roadmap Gen Entry Point|Roadmap Gen Entry Point]]
- [[_COMMUNITY_Build Phase Tracking|Build Phase Tracking]]
- [[_COMMUNITY_AAA Framework & North Star|AAA Framework & North Star]]
- [[_COMMUNITY_Curriculum Seed Data|Curriculum Seed Data]]
- [[_COMMUNITY_Dev Roadmap Page|Dev Roadmap Page]]
- [[_COMMUNITY_Blueprint Test Scripts|Blueprint Test Scripts]]
- [[_COMMUNITY_Panel Blueprint Builder|Panel Blueprint Builder]]
- [[_COMMUNITY_API Integration Tests|API Integration Tests]]
- [[_COMMUNITY_Gap Inference Pipeline|Gap Inference Pipeline]]
- [[_COMMUNITY_Supabase Tests|Supabase Tests]]
- [[_COMMUNITY_Database Operations|Database Operations]]
- [[_COMMUNITY_Skill Cluster Inference|Skill Cluster Inference]]
- [[_COMMUNITY_Phase 10 Screenshot Tests|Phase 10 Screenshot Tests]]
- [[_COMMUNITY_Phase 9 Screenshot Tests|Phase 9 Screenshot Tests]]
- [[_COMMUNITY_Phase 9 UI Tests|Phase 9 UI Tests]]
- [[_COMMUNITY_User Work Profile Builder|User Work Profile Builder]]
- [[_COMMUNITY_User Profile & Context|User Profile & Context]]
- [[_COMMUNITY_Core TypeScript Interfaces|Core TypeScript Interfaces]]
- [[_COMMUNITY_Gap Inference Tests|Gap Inference Tests]]
- [[_COMMUNITY_QA & Validation Phases|QA & Validation Phases]]
- [[_COMMUNITY_Bug Catalogue|Bug Catalogue]]
- [[_COMMUNITY_AI Terms Registry|AI Terms Registry]]
- [[_COMMUNITY_App Layout|App Layout]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Pending Build Phases|Pending Build Phases]]
- [[_COMMUNITY_Project Node Types|Project Node Types]]
- [[_COMMUNITY_Learner Action Bug|Learner Action Bug]]
- [[_COMMUNITY_Hallucination Bug|Hallucination Bug]]
- [[_COMMUNITY_Atom Label Bug|Atom Label Bug]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_LLM Architecture Concepts|LLM Architecture Concepts]]
- [[_COMMUNITY_Duplicate Label Fix|Duplicate Label Fix]]
- [[_COMMUNITY_Change Manifest|Change Manifest]]
- [[_COMMUNITY_Hallucination Definition|Hallucination Definition]]
- [[_COMMUNITY_MCP Protocol|MCP Protocol]]
- [[_COMMUNITY_Ship Cycle|Ship Cycle]]

## God Nodes (most connected - your core abstractions)
1. `RoleCategory` - 27 edges
2. `buildUserWorkProfile()` - 19 edges
3. `validateRoadmap()` - 18 edges
4. `compilerOptions` - 16 edges
5. `OnetTask` - 15 edges
6. `buildRoadmapBlueprint()` - 14 edges
7. `TaskWeight` - 14 edges
8. `RoadmapNodeItem` - 13 edges
9. `cn()` - 13 edges
10. `AiFamiliarity` - 13 edges

## Surprising Connections (you probably didn't know these)
- `SocMatchResponse` --references--> `SOCMatch`  [EXTRACTED]
  components/screens/RoleInput.tsx → types/index.ts
- `main()` --calls--> `isGenerationFailed()`  [INFERRED]
  scripts/test-phase8-validation.mjs → lib/llm/panel-copy.ts
- `main()` --calls--> `enrichBlueprintCopy()`  [INFERRED]
  scripts/test-phase8-validation.mjs → lib/llm/panel-copy.ts
- `main()` --calls--> `buildUserWorkProfile()`  [EXTRACTED]
  scripts/test-user-profile.mjs → lib/profile/user-work-profile.mjs
- `ScoreResult` --references--> `ScoreBand`  [EXTRACTED]
  lib/score/calculator.ts → types/index.ts

## Hyperedges (group relationships)
- **End-to-End Roadmap Generation Pipeline** — pipeline_step1_role_input, pipeline_step2_task_sliders, pipeline_step3_score_api, pipeline_step4a_blueprint, pipeline_step4b_enrich, pipeline_step4c_validate, pipeline_step4d_db [EXTRACTED 1.00]
- **Launch Schema TypeScript Interfaces** — codex_roadmap_node_schema, codex_panel_atom_schema, codex_panel_analogy_schema, codex_node_checkpoint_schema, codex_project_checkpoint_schema, codex_terminology_primer [EXTRACTED 1.00]
- **Root Cause: All Bugs Stem From Generated Not Authored System** — findings_root_cause, pipeline_root_cause_disconnected, pipeline_root_cause_template, findings_bug1_cluster_boundary, findings_bug2_role_filter, findings_bug3_glossary_parallel, findings_bug5_node_names [EXTRACTED 1.00]
- **4 Critical Curriculum Errors Found via Zeno Audit** — zeno_opt_correction, zeno_spaorl_correction, zeno_multiagent_correction, zeno_95rule_correction [EXTRACTED 1.00]
- **100x Core Curriculum Frameworks (AAA, OPT, PPT, SPAORL, ReAct)** — zeno_aaa_progression, zeno_opt_framework_detail, zeno_ppt_framework, zeno_spaorl_framework_detail, zeno_react_loop, zeno_two_lever [EXTRACTED 1.00]
- **Build Doc Phases Completed (0, 1, 2)** — builddoc_phase0_new, builddoc_phase1_new, builddoc_phase2_new [EXTRACTED 1.00]
- **Build Doc Phases Pending (3, 4, 5, 6, 7)** — builddoc_phase3_new, builddoc_phase4_new, builddoc_phase5_new, builddoc_phase6_new, builddoc_phase7_new [EXTRACTED 1.00]
- **7 Critical Bugs in Current Pipeline** — pipeline_critical_bug1, pipeline_critical_bug2, pipeline_critical_bug3, pipeline_critical_bug4, pipeline_critical_bug5, pipeline_critical_bug6, pipeline_critical_bug7 [EXTRACTED 1.00]
- **5 Content Teaching Principles** — findings_principle_outcome_first, findings_principle_why_before_what, findings_principle_projects_first, findings_principle_role_analogies, findings_principle_technical_credibility [EXTRACTED 1.00]

## Communities (60 total, 13 thin omitted)

### Community 0 - "Roadmap UI Components"
Cohesion: 0.08
Nodes (36): buildBranchPath(), fallbackPills(), getPills(), NodeExpansionMap(), ROW_Y, NodePanel(), NodePanelProps, RoadmapCanvas() (+28 more)

### Community 1 - "Score & Skill API Routes"
Cohesion: 0.08
Nodes (32): validateSOCCode(), getAllSkills(), buildFallback(), FALLBACK_ANALOGIES, FAMILIARITY_SLICES, OUTPUT_SCHEMA, POST(), rebalance() (+24 more)

### Community 2 - "O*NET API Integration"
Cohesion: 0.08
Nodes (30): getApiKey(), getTasksForSOC(), onetHeaders(), OnetTasksResponse, collectOnetTasks(), CORE_CATEGORY_RANK, dedupeTasks(), getDisplayTasks() (+22 more)

### Community 3 - "Project Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, agentation, @anthropic-ai/sdk, @base-ui/react, class-variance-authority, clsx, framer-motion, lucide-react (+27 more)

### Community 4 - "Content & Analogy System"
Cohesion: 0.07
Nodes (29): Global Journey Analogy (One Per User, AAA-Framed), Terminology Primer Option C: Post-Enrichment Content Scan, Analogy Lenses by Role (Film Production, Architectural Drafting, etc.), Canonical AI Terms Registry (web/lib/roadmap/canonical-ai-terms.mjs), CapabilityGap (Stage 2), LLM Details - Copy Filling (Stage 7), Rebuild North Star: Deterministic Blueprint + LLM Copy, PanelBlueprint - 10 Fixed Atoms (Stage 4) (+21 more)

### Community 5 - "Roadmap Generation & Testing"
Cohesion: 0.12
Nodes (23): ROADMAP_AUDIENCES, DEPTH_LEVELS, __dirname, main(), makeAtom(), makeNode(), makePanel(), makeProfile() (+15 more)

### Community 6 - "FO Score Model"
Cohesion: 0.12
Nodes (20): ADOPTION_MULTIPLIER, DEMAND_ELASTICITY_ADJUSTMENT, FO_FALLBACK_BY_ROLE, HUMAN_NECESSITY_DISCOUNT, LLM_EXPOSURE_BY_SOC, TASK_CATEGORY_EXPOSURE, TASK_CATEGORY_KEYWORDS, BaseScoreSource (+12 more)

### Community 7 - "Panel Copy & Delta System"
Cohesion: 0.13
Nodes (23): AnalogyMappingCopy, analogyMappingCopySchema(), applyDelta(), AtomCopy, atomCopySchema(), buildDeltaSchema(), buildUserPrompt(), callEnrichmentLLM() (+15 more)

### Community 8 - "Roadmap Validation"
Cohesion: 0.14
Nodes (22): addIssue(), bodyContainsTerm(), CHECKPOINT_FIELDS, collectNodes(), DEPTH_LEVELS, escapeRegExp(), GENERIC_NODE_TITLES, hasMeaningfulValue() (+14 more)

### Community 9 - "Schema & Delta Builder"
Cohesion: 0.13
Nodes (23): applyDelta(), audienceDir, buildAtomCopySchema(), buildCpCopySchema(), buildDeltaSchema(), buildEnrichmentPrompt(), buildNodePanelCopySchema(), buildTermCopySchema() (+15 more)

### Community 10 - "Assessment UI State"
Cohesion: 0.09
Nodes (20): AssessmentState, CapabilityGap, DepthLevel, Difficulty, NodeCheckpoint, NodePanelPayload, PanelAnalogy, PanelAnalogyMapping (+12 more)

### Community 11 - "Role Input UI"
Cohesion: 0.20
Nodes (14): cn(), RoleInput(), SocMatchResponse, WORK_CONTEXT_OPTIONS, Button(), buttonVariants, RadioGroup(), RadioGroupItem() (+6 more)

### Community 12 - "Assess Page Logic"
Cohesion: 0.13
Nodes (14): Action, initialState, EmailGate(), FormStatus, ROLE_DISPLAY, GapView(), GapViewProps, ROLE_DISPLAY (+6 more)

### Community 13 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 14 - "Funnel Flow UI"
Cohesion: 0.14
Nodes (14): useCountUp(), Calculating(), LINES, Props, FunnelShell(), FunnelShellProps, BAND, describeArc() (+6 more)

### Community 15 - "Validation Issue Codes"
Cohesion: 0.15
Nodes (16): ISSUE_CODES, CASES, __dirname, invalidDeltaFor(), leadRoutePath, loadPanelCopyExports(), main(), NEGATIVE_FIXTURES (+8 more)

### Community 16 - "Zeno Curriculum Corrections"
Cohesion: 0.13
Nodes (18): Gap Inference System Prompt Skeleton, Agent vs Workflow 64.9% Cost Premium Stat, 95% Rule: Workflow-First Principle Not Guardrail Threshold (Corrected), Corrected System Prompt Curriculum Block (for gap-inference), Downstream Impact Map: Which Errors Touch Which Files, Module 1 Missing Concepts: Suno, AVTV Full Stack, AI Filmmaking 6 Phases, Module 2 Missing Concepts: Chunking Strategies, Embeddings, Re-ranking, Hybrid Search, Module 3 Missing Concepts: HITL Design, Guardrails Taxonomy, Prompt Injection, Agent Failure Cases (+10 more)

### Community 17 - "Lead & Score API"
Cohesion: 0.35
Nodes (15): AssessState, ScoreApiResponse, LeadRequestBody, ScoreRequestBody, VALID_CLUSTER_IDS, EmailGateProps, Props, ScoreRevealProps (+7 more)

### Community 18 - "Blueprint to Roadmap Transform"
Cohesion: 0.16
Nodes (13): allPanelAtoms(), blueprintToRoadmap(), CASES, __dirname, exists(), main(), outputDir, phase10Dir (+5 more)

### Community 19 - "Blueprint Builder"
Cohesion: 0.20
Nodes (14): ANALOGY_LENSES, attachTerminologyTags(), buildIntegrationNode(), buildNodeFromGap(), buildNodeId(), buildProjectCheckpoints(), buildRoadmapBlueprint(), buildTerminologyPrimer() (+6 more)

### Community 20 - "Capability Matrix"
Cohesion: 0.18
Nodes (12): CAPABILITY_MATRIX, escapeRegex(), inferCapabilityGaps(), NON_TECH_ROLES, phraseMatch(), TECH_FORBIDDEN_FOR_NON_TECH, CASES, __dirname (+4 more)

### Community 21 - "Roadmap Gen Entry Point"
Cohesion: 0.17
Nodes (11): isGenerationFailed(), allPanelAtoms(), blueprintToRoadmap(), buildProfileFromLegacyArgs(), generateRoadmap(), RoadmapGenerationError, ROLE_ARCHETYPE, ROLE_DISPLAY (+3 more)

### Community 22 - "Build Phase Tracking"
Cohesion: 0.22
Nodes (13): AAA_PHASE_MAP Fallback (6 Roles, 100x-Grounded), Build Doc Phase 3: Blueprint Overhaul - LEFT, Build Doc Phase 4: Enrichment + Validation Updates - LEFT, Phase 5: Capability Matrix, Phase 6: Deterministic Roadmap Blueprint, Phase 7: LLM Details with Structured Output, File: web/lib/roadmap/blueprint.mjs, File: web/lib/roadmap/capability-matrix.mjs (+5 more)

### Community 23 - "AAA Framework & North Star"
Cohesion: 0.17
Nodes (13): AAA Phase Labels (Assisted / Accelerated / Autonomous), Build Doc North Star: Confidence Artifact, Autonomy Progression (Assisted -> Delegated -> Autonomous), Roadmap as Confidence Artifact (North Star), 6 Non-Technical Target Personas, AI Displacement Risk Calculator, 100x Curriculum Structure (3 Modules), Research Basis (Eloundou, OpenAI, Anthropic, WEF, etc.) (+5 more)

### Community 24 - "Curriculum Seed Data"
Cohesion: 0.20
Nodes (7): CURRICULUM_SEED, supabase, r1, r2, r3, t2Tasks, CurriculumSkill

### Community 25 - "Dev Roadmap Page"
Cohesion: 0.21
Nodes (10): allPanelAtoms(), blueprintToRoadmap(), DevRoadmapPage(), loadPreviewRoadmap(), SUPPORTED_ROLES, toRoadmapNode(), ProjectCheckpoint, RoadmapBlueprint (+2 more)

### Community 26 - "Blueprint Test Scripts"
Cohesion: 0.20
Nodes (10): CASES, __dirname, flattenNodes(), outputDir, repoRoot, reportPath, REQUIRED_ATOM_FIELDS, REQUIRED_CHECKPOINT_FIELDS (+2 more)

### Community 27 - "Panel Blueprint Builder"
Cohesion: 0.33
Nodes (9): ATOM_DEPTH_MAP, buildAppliedAtoms(), buildConceptAtoms(), buildNodeAnalogy(), buildNodeCheckpoint(), buildNodePanel(), getSkillData(), LENS_DOMAIN_TERMS (+1 more)

### Community 28 - "API Integration Tests"
Cohesion: 0.20
Nodes (6): CASES, __dirname, main(), outputDir, repoRoot, reportPath

### Community 29 - "Gap Inference Pipeline"
Cohesion: 0.22
Nodes (9): New Endpoint: /api/gap-inference, Build Doc Phase 0: Foundation (Types, Dead Code) - DONE, Build Doc Phase 1: New Data Files (canonical-ai-terms, aaa-phase-map) - DONE, Build Doc Phase 2: /api/gap-inference Endpoint - DONE, Critical Bug 1: skill_gap and skills_have Never Used in Blueprint, Fix 1: Feed skill_gap and skills_have into Blueprint Selection, Fix 2: Start Roadmap at Right Depth Based on skills_have, Root Cause: Scoring System and Roadmap System Disconnected (+1 more)

### Community 30 - "Supabase Tests"
Cohesion: 0.56
Nodes (8): fail(), pass(), run(), supabase, test12_rowCount(), test13_pmQuery(), test14_engineerAdjacent(), test15_leadInsert()

### Community 31 - "Database Operations"
Cohesion: 0.28
Nodes (5): insertLead(), POST(), supabase, supabaseAdmin, Lead

### Community 32 - "Skill Cluster Inference"
Cohesion: 0.25
Nodes (5): ALL_ROLES, SKILL_CLUSTERS, MODULE_ORDER, SCORE_STOPWORDS, SkillCluster

### Community 33 - "Phase 10 Screenshot Tests"
Cohesion: 0.32
Nodes (7): captureCase(), CASES, __dirname, main(), repoRoot, ssDir, waitForUrl()

### Community 34 - "Phase 9 Screenshot Tests"
Cohesion: 0.36
Nodes (7): captureDesktop(), captureMobile(), __dirname, main(), repoRoot, ssDir, waitForUrl()

### Community 35 - "Phase 9 UI Tests"
Cohesion: 0.29
Nodes (7): __dirname, file(), main(), outputDir, repoRoot, reportPath, webRoot

### Community 36 - "User Work Profile Builder"
Cohesion: 0.43
Nodes (7): buildUserWorkProfile(), buildWeightedTasks(), getDisplayTasks(), INDUSTRY_HINTS, inferIndustryHints(), inferRoleArchetype(), normalizeRoleCategory()

### Community 37 - "User Profile & Context"
Cohesion: 0.33
Nodes (7): work_context Field (startup/MNC/agency/freelance), Phase 3: Preserve Full User Context, Phase 4: O*NET Intake Fix, UserWorkProfile (Stage 1), Pipeline Step 1: Role Input + O*NET SOC Match, Pipeline Step 2: Task Sliders + buildUserWorkProfile(), O*NET Occupation API

### Community 38 - "Core TypeScript Interfaces"
Cohesion: 0.29
Nodes (7): NodeCheckpoint TypeScript Interface, PanelAnalogy TypeScript Interface, PanelAtom TypeScript Interface, Phase 0: Planning Doc, Phase 1: Baseline Audit and Test Fixtures, Phase 2: Types and Schema Contract, RoadmapNode TypeScript Interface

### Community 39 - "Gap Inference Tests"
Cohesion: 0.38
Nodes (6): FAMILIARITY_SLICES, FIXTURES, main(), runFixture(), VALID_SKILL_IDS, validateResult()

### Community 40 - "QA & Validation Phases"
Cohesion: 0.33
Nodes (6): Phase 10: End-to-End Launch QA (in progress), Phase 8: Strict Validator and Retry Contract, Phase 9: Side Panel UI Migration, File: web/lib/roadmap/validate.mjs, Pipeline Step 4c: validateRoadmap() - No LLM, Pipeline Step 4d: Supabase Insert + Brevo Email

### Community 41 - "Bug Catalogue"
Cohesion: 0.33
Nodes (6): All Flaws Catalogue (Pipeline, Structural, Semantic, Architectural), Flexible Atom Count: skill_ids.length x 2 + 2, Critical Bug 2: CAPABILITY_MATRIX Has Only 4 Marketer Rows (Needs 5), Critical Bug 3: Duplicate Atom Labels from Underpopulated skill_ids, Fix 3: Expand CAPABILITY_MATRIX to 5+ Rows Per Role, Root Cause: Blueprint Generates Role-Template Not User-Specific Roadmap

### Community 42 - "AI Terms Registry"
Cohesion: 0.33
Nodes (4): CANONICAL_AI_TERMS, CANONICAL_TERM_NAMES, getCanonicalTerm(), ROLE_TERMS_FALLBACK

### Community 43 - "App Layout"
Cohesion: 0.40
Nodes (3): jetBrainsMono, metadata, spaceGrotesk

### Community 44 - "Home Page"
Cohesion: 0.40
Nodes (3): container, fadeUp, proofItems

### Community 45 - "Pending Build Phases"
Cohesion: 0.50
Nodes (4): Build Doc Phase 5: Terminology Primer Wiring - LEFT, Build Doc Phase 6: API Layer + Context Propagation Cleanup - LEFT, Build Doc Phase 7: UI Rendering Updates - LEFT, 6-Fixture Stress Test Suite

## Knowledge Gaps
- **304 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+299 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RoleCategory` connect `Lead & Score API` to `Roadmap UI Components`, `Score & Skill API Routes`, `Skill Cluster Inference`, `FO Score Model`, `Assessment UI State`, `Role Input UI`, `Assess Page Logic`, `Funnel Flow UI`, `Roadmap Gen Entry Point`, `Dev Roadmap Page`, `Database Operations`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `validateRoadmap()` connect `Roadmap Validation` to `Blueprint to Roadmap Transform`, `Roadmap Generation & Testing`, `Roadmap Gen Entry Point`, `Validation Issue Codes`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `buildUserWorkProfile()` connect `User Work Profile Builder` to `O*NET API Integration`, `Schema & Delta Builder`, `Assess Page Logic`, `Validation Issue Codes`, `Blueprint Builder`, `Capability Matrix`, `Blueprint Test Scripts`, `API Integration Tests`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _304 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Roadmap UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Score & Skill API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.08367071524966262 - nodes in this community are weakly interconnected._
- **Should `O*NET API Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._