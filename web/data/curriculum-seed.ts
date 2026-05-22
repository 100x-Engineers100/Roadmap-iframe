import type { CurriculumSkill } from '../types';

// Source: 100x Cohort 7 curriculum (Zeno wiki L01–L14, L18–22, M3)
// Tools = what the cohort explicitly teaches + standard industry tools for that skill.
// Zeno wiki is authoritative for 100x-specific tools; industry tools are included where cohort
// covers the concept but Zeno docs don't list every tool taught.

export const CURRICULUM_SEED: CurriculumSkill[] = [
  // Module 1 — AI Content Creation
  {
    id: 'S1.1', module: 'm1', name_display: 'Generate professional AI images',
    can_do: 'Create on-brand marketing images without a photographer',
    // 100x teaches: ComfyUI (L04), FLUX (L06), FreePik (L09+), SDXL — plus Midjourney/DALL-E taught separately
    tools: ['ComfyUI', 'FLUX', 'FreePik', 'Midjourney', 'DALL-E'],
    roles: ['designer', 'marketer', 'student'],
    roles_adjacent: [],
    difficulty: 'foundational', seq_order: 1,
  },
  {
    id: 'S1.2', module: 'm1', name_display: 'Apply consistent visual style across content',
    can_do: 'Maintain brand/character consistency across all generated images',
    // 100x teaches: IP Adapters (L05), FLUX Redux (L06), ComfyUI ControlNet
    tools: ['ComfyUI', 'IP Adapters', 'FLUX Redux', 'ControlNet'],
    roles: ['designer', 'marketer'],
    roles_adjacent: ['designer'],
    difficulty: 'intermediate', seq_order: 2,
  },
  {
    id: 'S1.3', module: 'm1', name_display: 'Train AI on your brand\'s style or product',
    can_do: '15-25 images → custom AI model for infinite variations',
    // 100x teaches: LoRA training on JavasLabs (L06), AI Toolkit for FLUX, KohyaSS for SDXL
    tools: ['ComfyUI', 'JavasLabs', 'AI Toolkit', 'Replicate'],
    roles: ['designer', 'marketer', 'engineer'],
    roles_adjacent: ['engineer'],
    difficulty: 'intermediate', seq_order: 3,
  },
  {
    id: 'S1.4', module: 'm1', name_display: 'Create AI-generated video clips',
    can_do: 'Generate video from text or image using WAN/Kling',
    // 100x teaches: WAN 2.1/2.2 (L07), Kling, CDance 2.0, VO3 — via ComfyUI and FreePik Spaces
    tools: ['WAN', 'Kling', 'CDance', 'FreePik Spaces', 'ComfyUI'],
    roles: ['designer', 'marketer', 'student'],
    roles_adjacent: [],
    difficulty: 'intermediate', seq_order: 4,
  },
  {
    id: 'S1.5', module: 'm1', name_display: 'Build AI influencer and UGC campaigns',
    can_do: 'Create AI persona that promotes products at scale',
    // 100x teaches (L11): FreePik Spaces 4-column pipeline, Imagen 3 Pro, Kling for animation
    // 9-image reference set → assembly via @ syntax → Kling animation
    tools: ['FreePik Spaces', 'Imagen 3 Pro', 'Kling', 'Midjourney'],
    roles: ['marketer', 'designer'],
    roles_adjacent: [],
    difficulty: 'advanced', seq_order: 5,
  },
  {
    id: 'S1.6', module: 'm1', name_display: 'Create AI video spokesperson',
    can_do: 'HeyGen + ElevenLabs → any language, any script',
    // 100x teaches (L14): HeyGen avatar + ElevenLabs voice clone = full A-roll pipeline
    tools: ['HeyGen', 'ElevenLabs'],
    roles: ['marketer', 'sales', 'student'],
    roles_adjacent: [],
    difficulty: 'intermediate', seq_order: 6,
  },
  {
    id: 'S1.7', module: 'm1', name_display: 'Automate full content production pipeline',
    can_do: 'Script → Avatar → Voice → B-roll → Edit → Publish',
    // 100x AVTV stack (L14): Script(human) → HeyGen(A-roll) → ElevenLabs → FreePik Spaces(B-roll) → Premiere Pro → Suno
    tools: ['HeyGen', 'ElevenLabs', 'FreePik Spaces', 'Premiere Pro', 'Suno'],
    roles: ['marketer', 'designer'],
    roles_adjacent: [],
    difficulty: 'advanced', seq_order: 7,
  },
  {
    id: 'S1.8', module: 'm1', name_display: 'Produce AI short films and ads',
    can_do: '6-phase filmmaking workflow end-to-end',
    // 100x teaches (L12): 6-phase process, FreePik Spaces, WAN/Kling for video, Cinematic Shot node
    tools: ['FreePik Spaces', 'WAN', 'Kling', 'ComfyUI', 'Premiere Pro'],
    roles: ['designer', 'marketer'],
    roles_adjacent: [],
    difficulty: 'advanced', seq_order: 8,
  },

  // Module 2 — Full Stack LLM
  {
    id: 'S2.1', module: 'm2', name_display: 'Map your work to AI automation opportunities',
    can_do: 'Use OPT framework: decompose role → find automatable tasks',
    // OPT framework taught in M2 L1. Claude/ChatGPT as execution tools.
    tools: ['Claude', 'ChatGPT'],
    roles: ['pm', 'designer', 'marketer', 'sales', 'engineer', 'student'],
    roles_adjacent: ['pm', 'engineer'],
    difficulty: 'foundational', seq_order: 9,
  },
  {
    id: 'S2.2', module: 'm2', name_display: 'Write AI prompts that produce reliable output',
    can_do: 'System prompts, few-shot, chain-of-thought for repeated tasks',
    tools: ['Claude', 'ChatGPT', 'Gemini'],
    roles: ['pm', 'designer', 'marketer', 'sales', 'engineer', 'student'],
    roles_adjacent: [],
    difficulty: 'foundational', seq_order: 10,
  },
  {
    id: 'S2.3', module: 'm2', name_display: 'Connect AI to your tools and workflows',
    can_do: 'Wire Claude/OpenAI APIs to products or internal tools via FastAPI',
    // M2 L3-L6: FastAPI + Supabase + LLM API stack
    tools: ['Claude API', 'OpenAI API', 'FastAPI', 'Supabase'],
    roles: ['engineer', 'pm', 'student'],
    roles_adjacent: ['engineer'],
    difficulty: 'foundational', seq_order: 11,
  },
  {
    id: 'S2.4', module: 'm2', name_display: 'Make AI answer from your company\'s documents',
    can_do: 'Naive RAG: chunk, embed, retrieve — AI knows your internal docs',
    // M2 L13-L14: Three levels of RAG. Supabase pgvector, LlamaIndex taught.
    tools: ['LangChain', 'LlamaIndex', 'Supabase pgvector'],
    roles: ['engineer', 'pm', 'sales', 'student'],
    roles_adjacent: [],
    difficulty: 'intermediate', seq_order: 12,
  },
  {
    id: 'S2.5', module: 'm2', name_display: 'Build production-grade knowledge retrieval',
    can_do: 'Advanced RAG: hybrid search, re-ranking, query expansion',
    // M2 L15: Advanced RAG. Pinecone in production stack. LangChain for orchestration.
    tools: ['LangChain', 'Pinecone', 'LlamaIndex'],
    roles: ['engineer', 'pm', 'student'],
    roles_adjacent: ['engineer'],
    difficulty: 'advanced', seq_order: 13,
  },
  {
    id: 'S2.6', module: 'm2', name_display: 'Give AI persistent memory across sessions',
    can_do: 'Memory RAG: AI remembers context from prior conversations',
    // M2 L16: Memory RAG. Redis for caching/memory. LangChain memory module.
    tools: ['Redis', 'LangChain', 'Supabase'],
    roles: ['engineer', 'pm', 'student'],
    roles_adjacent: [],
    difficulty: 'advanced', seq_order: 14,
  },
  {
    id: 'S2.7', module: 'm2', name_display: 'Connect AI to any external service via protocol',
    can_do: 'MCP: one standard wires AI to databases, APIs, CRMs',
    // M2 L11-L12 + L22: MCP taught extensively. Linux Foundation standard.
    tools: ['Claude MCP', 'MCP SDK'],
    roles: ['engineer', 'pm', 'student'],
    roles_adjacent: ['engineer'],
    difficulty: 'intermediate', seq_order: 15,
  },
  {
    id: 'S2.8', module: 'm2', name_display: 'Build AI that takes real actions in systems',
    can_do: 'Tool calling: AI that searches web, updates databases',
    // M2 L11-L12: Function/tool calling. Programmatic tool calling pattern.
    tools: ['Claude', 'OpenAI', 'LangChain'],
    roles: ['engineer', 'pm', 'student'],
    roles_adjacent: ['engineer'],
    difficulty: 'intermediate', seq_order: 16,
  },
  {
    id: 'S2.9', module: 'm2', name_display: 'Train AI on your company\'s writing style',
    can_do: 'LoRA fine-tuning: smaller cheaper model, one task perfectly',
    // M2 L18-22: Axolotl (YAML-based) and LLaMA Factory (GUI) explicitly taught
    tools: ['Axolotl', 'LLaMA Factory', 'Hugging Face', 'JavasLabs'],
    roles: ['engineer', 'student'],
    roles_adjacent: ['engineer'],
    difficulty: 'advanced', seq_order: 17,
  },
  {
    id: 'S2.10', module: 'm2', name_display: 'Run AI at scale without breaking budget',
    can_do: 'Model tiering, caching, prompt efficiency → 60%+ cost reduction',
    // M2: Cost optimization patterns — Redis caching, model tiering, streaming
    tools: ['Redis', 'Claude API', 'OpenAI API'],
    roles: ['engineer', 'pm'],
    roles_adjacent: ['engineer'],
    difficulty: 'intermediate', seq_order: 18,
  },
  {
    id: 'S2.11', module: 'm2', name_display: 'Build working software with AI as co-developer',
    can_do: 'Ship Cycle: PRD → Lovable → Cursor → Claude Code → deployed product',
    // M2 L7-L8: Ship Cycle. Lovable (MVP), Cursor (refinement), Claude Code explicitly taught.
    tools: ['Cursor', 'Lovable', 'Claude Code'],
    roles: ['pm', 'designer', 'marketer', 'sales', 'student'],
    // Engineers already code — vibe coding is a natural extension of existing skills
    roles_adjacent: ['engineer'],
    difficulty: 'foundational', seq_order: 19,
  },

  // Module 3 — AI Agents & Automation
  {
    id: 'S3.1', module: 'm3', name_display: 'Build AI that completes multi-step tasks',
    can_do: 'ReAct agent: autonomous Thought→Action→Observation loop',
    // M3 L2: Built manually in n8n first, then LangChain/LangGraph for code track
    tools: ['n8n', 'LangChain', 'LangGraph', 'Claude'],
    roles: ['engineer', 'pm', 'student'],
    roles_adjacent: ['engineer'],
    difficulty: 'intermediate', seq_order: 20,
  },
  {
    id: 'S3.2', module: 'm3', name_display: 'Build AI automation without writing code',
    can_do: 'n8n: drag-and-drop agent builder for complex workflows',
    // M3 L5: n8n and LangFlow taught for no-code track
    tools: ['n8n', 'LangFlow'],
    roles: ['pm', 'designer', 'marketer', 'sales', 'engineer', 'student'],
    // PMs and marketers who already use workflow tools (Notion automations, etc.) have adjacent skills
    roles_adjacent: ['pm', 'marketer'],
    difficulty: 'foundational', seq_order: 21,
  },
  {
    id: 'S3.3', module: 'm3', name_display: 'Design systems where multiple AI agents collaborate',
    can_do: '6 orchestration patterns: Manager-Worker, Handoff, Routing, etc.',
    // M3 L3-L4: CrewAI, AutoGen, LangGraph all explicitly covered in Zeno
    tools: ['LangGraph', 'CrewAI', 'AutoGen'],
    roles: ['engineer', 'pm'],
    roles_adjacent: ['engineer', 'pm'],
    difficulty: 'advanced', seq_order: 22,
  },
  {
    id: 'S3.4', module: 'm3', name_display: 'Automate your full workflow end-to-end',
    can_do: 'Agentic pipelines: replace multi-step repetitive work with AI',
    tools: ['n8n', 'LangChain', 'Claude'],
    roles: ['pm', 'designer', 'marketer', 'sales', 'engineer', 'student'],
    roles_adjacent: ['pm'],
    difficulty: 'intermediate', seq_order: 23,
  },
  {
    id: 'S3.5', module: 'm3', name_display: 'Make AI agents safe to run in production',
    can_do: 'Guardrails: LlamaGuard, intent classification, iteration limits',
    // M3 L5: LlamaGuard (22M params, 7 categories) explicitly taught. Only confirmed guardrail tool.
    tools: ['LlamaGuard', 'Claude'],
    roles: ['engineer', 'pm'],
    roles_adjacent: ['engineer'],
    difficulty: 'advanced', seq_order: 24,
  },
  {
    id: 'S3.6', module: 'm3', name_display: 'Measure whether your AI is actually working',
    can_do: 'LLM-as-judge: rubric design, eval loops, quality regression detection',
    // M2 L21 + M3: LLM-as-Judge pattern. LangSmith/Langfuse for monitoring. RAGAS/Braintrust NOT taught.
    tools: ['LangSmith', 'Langfuse', 'Claude'],
    roles: ['engineer', 'pm'],
    roles_adjacent: ['pm', 'engineer'],
    difficulty: 'intermediate', seq_order: 25,
  },
];
