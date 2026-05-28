/**
 * Phase 3 - Panel Blueprint seeder.
 * Builds (skill_ids.length + 1) left + (skill_ids.length + 1) right atoms per node.
 * Total atoms = skill_ids.length × 2 + 2 (range: 6-10).
 * Depth maps to aaa_phase, not hardcoded position index.
 * No per-node analogy — analogy is now global journey_analogy.
 */

// S-ID → skill concept + applied exercise data.
// IMPORTANT: S2.1 OPT = Operating Model→Processes→Tasks (NOT Observe→Profile→Test — Zeno verified)
const SKILL_REGISTRY = {
  'S1.1': {
    concept_label: 'AI Image Generation',
    concept_explanation: 'AI image tools (Midjourney, DALL-E, FLUX) generate professional visuals from text prompts. Prompt precision — style, subject, mood, use case — determines output quality.',
    applied_label: 'Generate AI Images',
    applied_exercise: 'Write a detailed prompt (style, subject, mood, use case) and generate 4+ variants using Midjourney or FLUX.',
    applied_output: '4+ on-brand AI image variants ready for review.',
    primary_tool: 'Midjourney',
    time_est: '45 min',
  },
  'S1.2': {
    concept_label: 'Visual Style Consistency',
    concept_explanation: 'IP Adapters and ControlNet lock a reference style across generated images. FLUX Redux maintains brand consistency so every asset stays on-brand without re-prompting.',
    applied_label: 'Lock Brand Style',
    applied_exercise: 'Apply an IP Adapter or FLUX Redux to generate 4 variants maintaining consistent character or brand style.',
    applied_output: '4 visually consistent brand images from one style reference.',
    primary_tool: 'Midjourney',
    time_est: '1 hr',
  },
  'S1.3': {
    concept_label: 'Brand LoRA Training',
    concept_explanation: '15-25 brand reference images train a LoRA so the model produces infinite on-brand variations without re-prompting every detail. One training run → reusable style forever.',
    applied_label: 'Train Brand LoRA',
    applied_exercise: 'Collect 15+ brand reference images, train a LoRA on JavasLabs or AI Toolkit, and generate 3 test outputs.',
    applied_output: 'A trained brand LoRA that produces on-brand image variants.',
    primary_tool: 'AI Toolkit',
    time_est: '2-3 hrs',
  },
  'S1.4': {
    concept_label: 'AI Video Creation',
    concept_explanation: 'Video generation tools (Kling, WAN) turn a single image or text prompt into a short professional video clip. One asset + one prompt = campaign-ready video.',
    applied_label: 'Create AI Video Clip',
    applied_exercise: 'Use Kling or WAN to generate a 5-10 second video clip from one campaign image.',
    applied_output: 'A 5-10 second AI-generated video clip ready for review.',
    primary_tool: 'Kling',
    time_est: '45 min',
  },
  'S1.5': {
    concept_label: 'AI Influencer Personas',
    concept_explanation: 'A 9-image reference set trains a consistent AI persona in FreePik Spaces that promotes products in any setting without talent coordination.',
    applied_label: 'Build AI Persona',
    applied_exercise: 'Create a 9-image reference set and use FreePik Spaces to generate 5 campaign images of your AI persona.',
    applied_output: '5 campaign images featuring a consistent AI persona.',
    primary_tool: 'FreePik Spaces',
    time_est: '1-2 hrs',
  },
  'S1.6': {
    concept_label: 'AI Spokesperson Pipeline',
    concept_explanation: 'HeyGen + ElevenLabs creates a digital spokesperson who delivers any script in any language from a single session. Replaces talent, studio, and post-production.',
    applied_label: 'Create AI Spokesperson Video',
    applied_exercise: 'Write a 60-second product script and generate an AI spokesperson video using HeyGen.',
    applied_output: 'A 60-second AI spokesperson video ready for distribution.',
    primary_tool: 'HeyGen',
    time_est: '1 hr',
  },
  'S1.7': {
    concept_label: 'AVTV Production Stack',
    concept_explanation: 'The AVTV pipeline (Script → HeyGen+ElevenLabs → FreePik Spaces → Edit(CapCut/Premiere) → Suno → Publish) automates the full content production workflow in one session.',
    applied_label: 'Run AVTV Pipeline',
    applied_exercise: 'Run one piece of content through the full AVTV pipeline: script, spokesperson, voiceover, B-roll, edit, and music.',
    applied_output: 'One fully produced video asset built end-to-end via the AVTV pipeline.',
    primary_tool: 'HeyGen',
    time_est: '2-3 hrs',
  },
  'S1.8': {
    concept_label: 'AI Short Film Workflow',
    concept_explanation: 'The 6-phase AI filmmaking workflow (narrative design → character design → storyboard → scene generation → video assembly → combine/post) produces polished AI short films.',
    applied_label: 'Produce AI Short Film',
    applied_exercise: 'Follow the 6-phase process to produce a 30-second AI short film or ad for one campaign.',
    applied_output: 'A 30-second AI-produced film or ad asset.',
    primary_tool: 'FreePik Spaces',
    time_est: '3-4 hrs',
  },
  'S2.1': {
    concept_label: 'Workflow Mapping (OPT)',
    // Zeno-verified: OPT = Operating Model → Processes → Tasks (NOT Observe→Profile→Test)
    concept_explanation: 'The OPT framework maps your role before you automate it: Operating Model (how your role/business actually runs) → Processes (repeatable workflows inside it) → Tasks (discrete steps AI can own). Cannot automate what you have not mapped.',
    applied_label: 'Map AI Opportunities with OPT',
    applied_exercise: 'Draw your operating model. Identify 3 repeatable processes. Break each into discrete tasks and score each task for AI readiness (can AI do it? should it?).',
    applied_output: 'A prioritised task delegation map showing which tasks go to AI immediately vs later vs never.',
    primary_tool: 'Claude',
    time_est: '45 min',
  },
  'S2.2': {
    concept_label: 'Prompt Engineering',
    concept_explanation: 'System prompts, few-shot examples, chain-of-thought instructions, and structured output formats produce reliable, repeatable AI output. Temperature and context window control quality and consistency.',
    applied_label: 'Write Prompt Templates',
    applied_exercise: 'Write 3 reusable prompt templates for your top weekly tasks: one with a system prompt, one with few-shot examples, one with structured output format.',
    applied_output: '3 tested prompt templates you can reuse daily.',
    primary_tool: 'Claude',
    time_est: '45 min',
  },
  'S2.3': {
    concept_label: 'LLM API Integration',
    concept_explanation: 'FastAPI + Claude/OpenAI API wires AI into any product or internal tool via tool calling and structured JSON output. The API call is the integration point between your system and the model.',
    applied_label: 'Build LLM API Endpoint',
    applied_exercise: 'Build a FastAPI endpoint that calls Claude API with a role-specific system prompt and returns a structured JSON response.',
    applied_output: 'A working FastAPI + Claude API endpoint connected to one real use case.',
    primary_tool: 'FastAPI',
    time_est: '1-2 hrs',
  },
  'S2.4': {
    concept_label: 'Document RAG (Naive)',
    concept_explanation: 'Naive RAG: chunk documents (fixed-size / semantic / recursive strategies) → embed as dense vectors → store in Supabase pgvector → retrieve relevant chunks at query time. AI answers from your actual knowledge base.',
    applied_label: 'Build Document RAG',
    applied_exercise: 'Chunk one internal document using a chunking strategy, embed it with Supabase pgvector, and test 5 questions against it.',
    applied_output: 'A working RAG system that answers questions from one internal document.',
    primary_tool: 'LlamaIndex',
    time_est: '2-3 hrs',
  },
  'S2.5': {
    concept_label: 'Advanced RAG',
    concept_explanation: 'Advanced RAG combines hybrid search (BM25 keyword + vector semantic) and cross-encoder re-ranking to dramatically improve retrieval quality over naive RAG. Query expansion further reduces false negatives.',
    applied_label: 'Upgrade to Advanced RAG',
    applied_exercise: 'Add hybrid search (BM25 + vector) and a re-ranking step to your naive RAG. Compare answer quality on 10 test questions.',
    applied_output: 'An advanced RAG system with measurably better retrieval accuracy.',
    primary_tool: 'Pinecone',
    time_est: '2-3 hrs',
  },
  'S2.6': {
    concept_label: 'AI Memory Systems',
    concept_explanation: 'Memory RAG uses Redis to cache conversation context and episodic memory so AI remembers past interactions and personalizes responses across sessions. Moves from stateless to stateful AI.',
    applied_label: 'Add Persistent Memory',
    applied_exercise: 'Add a Redis-backed memory layer so your RAG system remembers the last 5 conversation turns and user preferences.',
    applied_output: 'A RAG system with persistent cross-session memory.',
    primary_tool: 'Redis',
    time_est: '2-3 hrs',
  },
  'S2.7': {
    concept_label: 'MCP Protocol',
    concept_explanation: 'MCP (Model Context Protocol) is the standard that lets one AI integration connect to any external system — databases, APIs, CRMs — without custom connectors per integration.',
    applied_label: 'Build MCP Server',
    applied_exercise: 'Build an MCP server that exposes one internal tool or data source to Claude via the MCP SDK.',
    applied_output: 'A working MCP server that Claude can query for real data.',
    primary_tool: 'Claude MCP',
    time_est: '1-2 hrs',
  },
  'S2.8': {
    concept_label: 'AI Tool Calling',
    concept_explanation: 'Tool calling lets AI functions search the web, update databases, and trigger workflows based on natural language instructions. Function definitions tell the model what it can do and when.',
    applied_label: 'Wire AI Tool Calling',
    applied_exercise: 'Add 2 tool definitions to a Claude/OpenAI call: one that retrieves data and one that takes an action.',
    applied_output: 'An AI system that can perform real actions using defined tools.',
    primary_tool: 'OpenAI',
    time_est: '1-2 hrs',
  },
  'S2.9': {
    concept_label: 'LoRA Fine-tuning',
    concept_explanation: 'LoRA fine-tuning trains a compact adapter on a base LLM using 50+ examples so it produces your organization\'s exact writing style on one specific task. Fixes Lever 2 (behavior) failures.',
    applied_label: 'Fine-tune Your First Model',
    applied_exercise: 'Prepare 50+ examples of your target style, train a LoRA with Axolotl, and evaluate against the base model on 10 test prompts.',
    applied_output: 'A fine-tuned model that matches your organization\'s writing style on the target task.',
    primary_tool: 'Axolotl',
    time_est: '3-4 hrs',
  },
  'S2.10': {
    concept_label: 'LLM Cost Optimization',
    concept_explanation: 'Model tiering routes simple tasks to cheaper models. Redis caching eliminates redundant API calls. LangSmith/Langfuse traces every call so you see exactly where cost and latency go. Combined: 60%+ cost reduction.',
    applied_label: 'Implement Cost Optimization',
    applied_exercise: 'Profile your current LLM usage, implement model tiering for 2 use cases, and add Redis caching for repeated queries.',
    applied_output: 'A cost-optimized LLM system with measurable cost reduction and full observability.',
    primary_tool: 'LangSmith',
    time_est: '2-3 hrs',
  },
  'S2.11': {
    concept_label: 'Ship Cycle',
    concept_explanation: 'The Ship Cycle (PRD → Lovable → GitHub → Cursor → Claude Code → deploy) turns a product brief into deployed software in hours without waiting on engineering resources.',
    applied_label: 'Run Your First Ship Cycle',
    applied_exercise: 'Write a one-page PRD, generate the MVP in Lovable, refine with Cursor, and deploy using Claude Code.',
    applied_output: 'A deployed working product built entirely through the Ship Cycle.',
    primary_tool: 'Cursor',
    time_est: '2-3 hrs',
  },
  'S3.1': {
    concept_label: 'ReAct Agent Loop',
    concept_explanation: 'ReAct agents interleave Thought (reasoning about what to do) and Action (calling a tool) with Observation (reading the result) until a task completes without human intervention.',
    applied_label: 'Build First ReAct Agent',
    applied_exercise: 'Build a ReAct agent in n8n that completes a 3-step task: search for information, process it, and write an output.',
    applied_output: 'A working ReAct agent that completes a real multi-step task autonomously.',
    primary_tool: 'n8n',
    time_est: '2-3 hrs',
  },
  'S3.2': {
    concept_label: 'No-Code Automation',
    concept_explanation: 'n8n\'s drag-and-drop interface builds complex AI-powered workflows without code. Trigger nodes start the flow, AI nodes process data, output nodes take action — all wired visually.',
    applied_label: 'Build n8n Automation',
    applied_exercise: 'Build an n8n workflow that triggers from one event, processes data with an AI node, and sends an output to a tool you already use.',
    applied_output: 'A live n8n workflow that runs automatically on a trigger.',
    primary_tool: 'n8n',
    time_est: '1-2 hrs',
  },
  'S3.3': {
    concept_label: 'Multi-Agent Orchestration',
    concept_explanation: 'Multi-agent systems use the 6 canonical patterns — Manager-Worker, Handoff, Routing, Parallelization, Orchestrator-Worker, Evaluator-Optimizer — to coordinate specialized agents on complex tasks.',
    applied_label: 'Build 2-Agent System',
    applied_exercise: 'Implement a Manager-Worker pattern where one agent plans and another executes a real multi-step task.',
    applied_output: 'A 2-agent system that completes one complex task through orchestration.',
    primary_tool: 'CrewAI',
    time_est: '2-3 hrs',
  },
  'S3.4': {
    concept_label: 'Agentic Pipeline Design',
    concept_explanation: 'Agentic pipelines replace multi-step repetitive workflows: AI observes a trigger, executes steps via the SPAORL loop (Sense→Plan→Act→Observe→Reflect→Adapt), and produces output without intervention.',
    applied_label: 'Automate Full Workflow',
    applied_exercise: 'Map your most repetitive multi-step workflow and rebuild it as an agentic pipeline in n8n that runs end-to-end on a trigger.',
    applied_output: 'A live agentic pipeline that eliminates one manual repetitive workflow.',
    primary_tool: 'n8n',
    time_est: '1-2 hrs',
  },
  'S3.5': {
    concept_label: 'Agent Safety Guardrails',
    concept_explanation: 'LlamaGuard classifies AI inputs and outputs across 7 safety categories. Input guardrails: prompt injection defense, PII scrubbing. Output guardrails: hallucination check, format validation, toxicity filter.',
    applied_label: 'Add Safety Guardrails',
    applied_exercise: 'Add LlamaGuard intent classification to your agent before every tool call. Test with 10 edge-case inputs including injection attempts.',
    applied_output: 'An agent system with LlamaGuard safety checks on all tool calls.',
    primary_tool: 'LlamaGuard',
    time_est: '1-2 hrs',
  },
  'S3.6': {
    concept_label: 'LLM Evaluation',
    concept_explanation: 'LLM-as-Judge uses a powerful model to evaluate outputs with a rubric (Ragas, BLEU, custom criteria), enabling automated quality regression detection at scale.',
    applied_label: 'Build Evaluation Loop',
    applied_exercise: 'Design a 5-criterion rubric, run 20 test cases through your LLM system, and set a quality threshold that triggers alerts.',
    applied_output: 'An automated evaluation loop with a quality threshold that catches regressions.',
    primary_tool: 'LangSmith',
    time_est: '1-2 hrs',
  },
};

function getSkillData(skillId) {
  return SKILL_REGISTRY[skillId] ?? {
    concept_label: `${skillId} Fundamentals`,
    concept_explanation: `Core concepts and techniques for ${skillId} that apply directly to your daily work.`,
    applied_label: `Apply ${skillId}`,
    applied_exercise: 'Complete a hands-on exercise applying this skill to one real task from your role.',
    applied_output: 'A completed exercise demonstrating this skill in a real work context.',
    primary_tool: 'Claude',
    time_est: '45 min',
  };
}

// Depth per AAA phase — concept and applied atoms share the same depth level
const ATOM_DEPTH_BY_AAA = {
  assisted:    { concept: 'scan',     applied: 'scan' },
  accelerated: { concept: 'practice', applied: 'practice' },
  autonomous:  { concept: 'build',    applied: 'build' },
};

/**
 * Build (skill_ids.length) concept atoms + 1 risk atom = skill_ids.length + 1 left atoms.
 * Orders 1 … (skill_ids.length + 1).
 */
function buildConceptAtoms(gap, nodeId, aaa_phase, allowedTools) {
  const skillIds = gap.skill_ids;
  const depthCfg = ATOM_DEPTH_BY_AAA[aaa_phase] ?? ATOM_DEPTH_BY_AAA.accelerated;
  const atoms = [];

  for (let i = 0; i < skillIds.length; i++) {
    const skillId = skillIds[i];
    const skill = skillId ? getSkillData(skillId) : null;
    const order = i + 1;
    const tool = skill
      ? (allowedTools.includes(skill.primary_tool) ? skill.primary_tool : (allowedTools[0] ?? 'Claude'))
      : (allowedTools[0] ?? 'Claude');

    atoms.push({
      id: `${nodeId}-L${order}`,
      order,
      label: skill ? skill.concept_label : `${gap.capability.split(' ').slice(0, 3).join(' ')} Overview`,
      type: 'concept',
      depth_level: depthCfg.concept,
      depth_reason: i === 0
        ? `First concept: understand what ${skill ? skill.concept_label : 'this capability'} is before applying it.`
        : `Deeper context: see how ${skill ? skill.concept_label : 'this concept'} connects to the node goal.`,
      explanation: skill
        ? skill.concept_explanation
        : `${gap.capability} requires understanding multiple related skills that compound on each other.`,
      learner_action: skill
        ? `Map one place in your current work where ${skill.concept_label} would change your output.`
        : `Review this capability and map it to one task from your role.`,
      output: skill
        ? `A clear mental model of what ${skill.concept_label} means for your work.`
        : 'A summary of how this capability applies to your role.',
      tools: [tool],
      time_est: '20 min',
    });
  }

  // Risk atom — always last on left side
  const riskOrder = skillIds.length + 1;
  atoms.push({
    id: `${nodeId}-L${riskOrder}`,
    order: riskOrder,
    label: 'Common Failure Modes',
    type: 'risk',
    depth_level: 'scan',
    depth_reason: 'Awareness: knowing the failure modes prevents the most common setbacks before they happen.',
    explanation: `The most common mistake when starting with ${gap.capability.split('(')[0].trim().toLowerCase()} is picking tools before mapping the process. ${gap.why_selected ? gap.why_selected.split('.')[0] + '.' : ''}`,
    learner_action: 'Review the three most common failure patterns for this capability and note which one you are most likely to hit first.',
    output: 'A personal risk checklist for this node that you can reference when you hit a blocker.',
    tools: [allowedTools[0] ?? 'Claude'],
    time_est: '15 min',
  });

  return atoms;
}

/**
 * Build (skill_ids.length) applied atoms + 1 mastery atom = skill_ids.length + 1 right atoms.
 * Orders (skill_ids.length + 2) … (skill_ids.length × 2 + 2).
 */
function buildAppliedAtoms(gap, nodeId, aaa_phase, allowedTools) {
  const skillIds = gap.skill_ids;
  const depthCfg = ATOM_DEPTH_BY_AAA[aaa_phase] ?? ATOM_DEPTH_BY_AAA.accelerated;
  const leftCount = skillIds.length + 1; // left atoms occupy orders 1…(skillIds.length+1)
  const atoms = [];

  for (let i = 0; i < skillIds.length; i++) {
    const skillId = skillIds[i];
    const skill = skillId ? getSkillData(skillId) : null;
    const order = leftCount + 1 + i; // right atoms start after left atoms
    const tool = skill
      ? (allowedTools.includes(skill.primary_tool) ? skill.primary_tool : (allowedTools[0] ?? 'Claude'))
      : (allowedTools[0] ?? 'Claude');

    atoms.push({
      id: `${nodeId}-R${i + 1}`,
      order,
      label: skill ? skill.applied_label : 'Apply to Your Role',
      type: i < skillIds.length - 1 ? 'step' : 'output',
      depth_level: depthCfg.applied,
      depth_reason: i === 0
        ? 'Hands-on: complete one role-specific attempt and capture what changed in the output.'
        : `Integration: combine ${skill ? skill.applied_label.toLowerCase() : 'this skill'} with your role context to produce a real output.`,
      explanation: skill
        ? skill.applied_exercise
        : `Complete one full exercise applying the skills from this node to a real task from your work.`,
      learner_action: skill
        ? skill.applied_exercise
        : 'Apply the skills covered in this node to one real task and document your process.',
      output: skill
        ? skill.applied_output
        : 'A completed work output you can show as evidence of this skill.',
      tools: [tool],
      time_est: skill ? skill.time_est : '45 min',
    });
  }

  // Mastery atom — always last on right side
  const masteryOrder = leftCount + 1 + skillIds.length;
  atoms.push({
    id: `${nodeId}-R${skillIds.length + 1}`,
    order: masteryOrder,
    label: 'Proof of Mastery',
    type: 'output',
    depth_level: depthCfg.applied === 'scan' ? 'practice' : depthCfg.applied,
    depth_reason: 'Demonstration: produce one artifact that proves you can apply the full node capability independently.',
    explanation: `Completing this proof artifact confirms you can ${gap.capability.toLowerCase()} without step-by-step guidance.`,
    learner_action: 'Build the mastery artifact by combining all the skills from this node into one deliverable you can show to a peer.',
    output: `A completed ${gap.capability.split(' ').slice(0, 4).join(' ').toLowerCase()} artifact ready for portfolio or work use.`,
    tools: allowedTools.slice(0, 2),
    time_est: '45 min',
  });

  return atoms;
}

/**
 * Build NodeCheckpoint from gap data.
 */
function buildNodeCheckpoint(gap, nodeId) {
  const roleCategory = gap.role_category ?? 'your';
  const primaryTool = gap.allowed_tools[0] ?? 'Claude';
  const capabilityShort = gap.capability.split('(')[0].trim();

  return {
    title: `${capabilityShort} Checkpoint`,
    scenario: `You need to ${gap.capability.toLowerCase()} for a real task from your current ${roleCategory} work. Use the tools from this node to deliver a tangible output.`,
    artifact_to_create: `A completed ${capabilityShort.toLowerCase()} artifact demonstrating independent application of this node's skills.`,
    steps: [
      `Pick one real task from your ${roleCategory} work that this node's skills address.`,
      `Set up ${primaryTool} and configure it for your specific context.`,
      `Complete the task using at least 2 of the skills covered in this node.`,
      `Review your output against the done criteria below.`,
    ],
    done_when: [
      `You produced a tangible artifact without referring back to the tutorial.`,
      `The artifact uses the actual tools listed in this node, not just a description of them.`,
    ],
    tools: gap.allowed_tools.slice(0, 3),
    time_est: '1-2 hrs',
    confidence_check: `Can you explain to a peer what ${capabilityShort.toLowerCase()} means for your specific role and show them a real output?`,
  };
}

/**
 * Build full NodePanelPayload for one node.
 * No per-node analogy — analogy is now global (journey_analogy on RoadmapBlueprint).
 *
 * @param {object} gap - gap-like object: { capability, skill_ids, allowed_tools, why_selected, role_category }
 * @param {string} nodeId - node id string
 * @param {string} aaa_phase - 'assisted' | 'accelerated' | 'autonomous'
 */
export function buildNodePanel(gap, nodeId, aaa_phase) {
  const leftItems = buildConceptAtoms(gap, nodeId, aaa_phase, gap.allowed_tools);
  const rightItems = buildAppliedAtoms(gap, nodeId, aaa_phase, gap.allowed_tools);

  return {
    expansion: {
      center_label: gap.capability.split('(')[0].trim(),
      left_title: 'Concepts',
      right_title: 'Applied',
      left_items: leftItems,
      right_items: rightItems,
    },
    checkpoint: buildNodeCheckpoint(gap, nodeId),
  };
}
