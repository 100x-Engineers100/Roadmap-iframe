import { callLLM } from './provider';
import type { AiFamiliarity, Difficulty, Roadmap, RoadmapNode, RoadmapStep, RoleCategory, SkillCluster } from '@/types';

const ROLE_DISPLAY: Record<RoleCategory, string> = {
  pm: 'Product Manager',
  designer: 'Designer',
  marketer: 'Marketer',
  sales: 'Sales Professional',
  engineer: 'Engineer',
  student: 'Student',
};

const BANNED_CANVAS_TERMS = ['RAG', 'MCP', 'ReAct', 'API', 'LLM', 'SPAORL', 'BM25'];

const ROLE_LANG_RULES: Record<RoleCategory, string> = {
  engineer: 'Technical depth expected. Name APIs, frameworks, and code tools explicitly. Exercises may require writing code.',
  pm: 'Business context + light technical literacy. Tools: Claude, Notion AI, Linear AI, Figma AI, ChatGPT. Exercises are workflow-level, not code-level.',
  designer: 'NO code whatsoever. Tools: Midjourney, Canva AI, Adobe Firefly, Figma AI, ElevenLabs, Runway. Exercises are about visuals, brand, and creative output.',
  marketer: 'NO code whatsoever. Tools: ChatGPT, Jasper, Canva AI, HeyGen, Zapier, n8n, Notion AI. Exercises are about campaigns, copy, content, and workflow automation.',
  sales: 'NO code whatsoever. Tools: ChatGPT, Clay, HubSpot AI, Apollo, Gong AI, Lavender. Exercises are about outreach, research, pipeline, and negotiation prep.',
  student: 'Accessible language. Tools: ChatGPT, Claude, Perplexity, Notion AI, Gamma. Build conceptual understanding before specialization. No code unless natural.',
};

const FAMILIARITY_TONE: Record<AiFamiliarity, string> = {
  none: 'User is new to AI tools. Step 1 must be immediately actionable — things they can try today with zero setup. Use plain English throughout. Avoid jargon. Build confidence before complexity.',
  casual: 'User has used tools like ChatGPT casually for 1–6 months. Build from what they already do. Introduce intentional workflows and role-specific patterns. Bridge casual use to deliberate daily practice.',
  building: 'User already integrates AI regularly. Skip fundamentals. Focus on production-grade patterns, deeper integrations, and automation. Go beyond prompt tips — show systems and stacks.',
};

const SYSTEM_PROMPT = `You are a curriculum architect for 100x School of Applied AI.
Generate a personalized 90-day roadmap as valid JSON only. No markdown fences, no explanation.

Critical structure:
- Exactly 3 steps: step1, step2, step3.
- Each step has 2-3 top-level nodes.
- Top-level nodes appear on the main snake roadmap canvas.
- Include 1-3 project nodes (node_kind: "project") for visible build moments.
- Each top-level node has 3-4 static subnodes shown inside the side panel.
- Top-level node names: plain English, 2-4 words, no acronyms, no jargon.
- skill_ids: populate with cluster IDs (e.g. "C2B") from the gap clusters each node addresses.

SUBNODE RULES (non-negotiable):
- title: MUST start with an action verb (Build, Write, Create, Set up, Map, Connect, Generate, Automate, Deploy, Design, Test, Ship, Record, Draft, Configure).
- description: names the EXACT tool being used and what the exercise involves. No vague descriptions.
- outcome: a tangible deliverable the user can see, save, or share after completing.
- tools: array of 1-3 specific tool names used in this exercise (e.g. ["ChatGPT", "Notion AI"]).
- time_est: realistic estimate — "30 min", "45 min", "1 hr", "1-2 hrs", "2-3 hrs", "3-4 hrs".

ANALOGY RULES:
- base: a real-world parallel from the role's own domain (not recipe, chef, toolbox, blueprint, GPS).
- role_skin: how this maps to the user's actual day-to-day work.
- bridge_line: the non-obvious insight that makes the concept click — something they would not have guessed.
- Make it SPECIFIC to this role and THIS skill. Generic analogies are a failure.

LANGUAGE RULES:
- Non-engineering roles (designer, marketer, sales, pm, student): node names and subnode titles must be understandable to someone with no technical background. No code terms in titles.
- All roles: one_line_desc must explain what the person gains in their real work — not what the technology does.
- All roles: glossary terms must define AI concepts in the language of this role's daily work.

GLOSSARY RULES (non-negotiable):
- Include 3-6 terms from THIS roadmap's content that a non-technical person would not understand.
- Pull terms only from node names, subnode titles, and descriptions actually generated above.
- Define each term in 1 sentence using the role's daily work language — no technical jargon in the definition.
- Engineer examples: API (a connection point that lets two software tools talk to each other), RAG (giving AI instant access to your documents so it can answer questions from them), fine-tuning (training an AI model on your specific data to improve its accuracy for your use case), CLI (a text-based terminal interface for running commands).
- Marketer examples: Prompt (the instruction you type to tell an AI tool what to do), AI agent (an AI that completes a multi-step task automatically without you clicking through each step), automation trigger (the event — like a form submission or new email — that starts a workflow running).
- NEVER leave glossary as empty array []. Minimum 3 terms always.
- NEVER define terms that did not appear in the roadmap content.

The JSON must match this TypeScript type exactly:

interface Roadmap {
  step1: RoadmapStep;
  step2: RoadmapStep;
  step3: RoadmapStep;
  glossary?: RoadmapGlossaryTerm[];
}
interface RoadmapStep {
  label: string;
  theme: string;
  nodes: RoadmapNode[];
  checkpoint: {
    title: string;
    goal: string;
    concepts: string[];
    problem_statement: string;
    done_criteria: string;
    time_est: string;
  };
}
interface RoadmapSubnode {
  id: string;
  title: string;
  description: string;
  outcome: string;
  tools: string[];
  time_est: string;
}
interface RoadmapNode {
  id: string;
  node_kind?: "concept" | "project";
  name_plain: string;
  one_line_desc: string;
  what_covers: string;
  what_do_after: string;
  subnodes: RoadmapSubnode[];
  concepts_left: string[];
  concepts_right: string[];
  skill_ids: string[];
  analogy: {
    base: string;
    role_skin: string;
    bridge_line: string;
  };
  depth: "foundational" | "intermediate" | "advanced";
}
interface RoadmapGlossaryTerm {
  term: string;
  definition: string;
  source_node_id?: string;
  group?: string;
}`;

// ── Fallback node specs per cluster ─────────────────────────────────────────

interface ClusterFallbackSpec {
  name: string;
  tools: string[];
  depth: Difficulty;
}

const CLUSTER_FALLBACK_NODES: Record<string, ClusterFallbackSpec> = {
  C1A: { name: 'Create AI-generated content', tools: ['Canva AI', 'Midjourney', 'HeyGen'], depth: 'foundational' },
  C2A: { name: 'Automate your top weekly task', tools: ['ChatGPT', 'Notion AI', 'Zapier'], depth: 'intermediate' },
  C2B: { name: 'Wire your first AI integration', tools: ['FastAPI', 'Claude API', 'Supabase'], depth: 'intermediate' },
  C2C: { name: 'Build a document search tool', tools: ['Supabase', 'Claude API', 'Pinecone'], depth: 'intermediate' },
  C2D: { name: 'Fine-tune a model on your data', tools: ['OpenAI fine-tuning', 'Python', 'W&B'], depth: 'intermediate' },
  C3A: { name: 'Build an autonomous AI agent', tools: ['LangChain', 'Claude API', 'n8n'], depth: 'advanced' },
  C3B: { name: 'Automate an end-to-end workflow', tools: ['n8n', 'Zapier', 'Claude API'], depth: 'advanced' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCluster(c: SkillCluster): string {
  return `  [${c.id}] ${c.name}\n    Benefit: ${c.can_do}\n    Project: ${c.checkpoint_hint}`;
}

function buildClusterNode(cluster: SkillCluster, role: string): RoadmapNode {
  const spec = CLUSTER_FALLBACK_NODES[cluster.id];
  const tools = spec?.tools ?? ['ChatGPT'];
  const name = spec?.name ?? cluster.name;
  const depth = spec?.depth ?? 'intermediate';
  const nodeId = cluster.id.toLowerCase();

  return {
    id: nodeId,
    node_kind: 'concept',
    name_plain: name,
    one_line_desc: cluster.can_do,
    what_covers: cluster.checkpoint_hint,
    what_do_after: cluster.checkpoint_hint,
    subnodes: [
      {
        id: `${nodeId}-s1`,
        title: `Set up ${tools[0]}`,
        description: `Configure ${tools[0]} for your ${role} work and run one test task to confirm it works.`,
        outcome: `A confirmed ${tools[0]} setup producing real output.`,
        tools: [tools[0]],
        time_est: '45 min',
      },
      {
        id: `${nodeId}-s2`,
        title: `Build your first ${name.toLowerCase()} exercise`,
        description: `Use ${tools.slice(0, 2).join(' and ')} to complete one real task from your daily work.`,
        outcome: `A completed exercise you can demonstrate to others.`,
        tools: tools.slice(0, 2),
        time_est: '1-2 hrs',
      },
      {
        id: `${nodeId}-s3`,
        title: `Ship the checkpoint deliverable`,
        description: `Deliver the project: ${cluster.checkpoint_hint}`,
        outcome: cluster.checkpoint_hint,
        tools: tools,
        time_est: '2-3 hrs',
      },
    ],
    concepts_left: ['Setup', 'Core exercise', 'Checkpoint'],
    concepts_right: ['Configure', 'Execute', 'Deliver'],
    skill_ids: [cluster.id],
    analogy: {
      base: `Building ${name.toLowerCase()} as a repeatable skill`,
      role_skin: `Applying it directly to your ${role} daily work`,
      bridge_line: `One complete exercise with a real deliverable is worth more than ten tutorials.`,
    },
    depth,
  };
}

function buildGenericRepairNode(id: string, role: string): RoadmapNode {
  return {
    id,
    node_kind: 'concept',
    name_plain: 'Practice and Apply',
    one_line_desc: `Apply what you have learned to a real task from your ${role} work.`,
    what_covers: 'Consolidating skills through direct application',
    what_do_after: 'Complete one real deliverable using the skills from this step.',
    subnodes: [
      { id: `${id}-s1`, title: 'Pick one real task', description: 'Choose a recurring task from your role and plan how AI can help.', outcome: 'A task selected with a clear AI-assist plan.', tools: ['ChatGPT'], time_est: '30 min' },
      { id: `${id}-s2`, title: 'Execute with AI support', description: 'Complete the task using the AI tools from this step.', outcome: 'A finished work output.', tools: ['ChatGPT'], time_est: '1 hr' },
      { id: `${id}-s3`, title: 'Document the workflow', description: 'Write down the steps so you can repeat this without starting from scratch.', outcome: 'A one-page workflow note for future reuse.', tools: ['Notion'], time_est: '30 min' },
    ],
    concepts_left: ['Select', 'Execute', 'Document'],
    concepts_right: ['Plan', 'Produce', 'Reuse'],
    skill_ids: [],
    analogy: {
      base: 'Consolidating practice into a repeatable system',
      role_skin: `Making ${role} work faster through documented AI patterns`,
      bridge_line: 'Documenting while fresh is what separates a one-time win from a lasting workflow.',
    },
    depth: 'foundational',
  };
}

function buildStepCheckpoint(stepLabel: string, clusters: SkillCluster[], role: string): RoadmapStep['checkpoint'] {
  const clusterNames = clusters.map(c => c.name).join(', ') || `${role} AI skills`;
  return {
    title: `${role} AI Sprint — ${stepLabel}`,
    goal: `Prove you can apply: ${clusterNames}`,
    concepts: clusters.map(c => c.name),
    problem_statement: `Build a real deliverable using ${clusterNames} in your ${role} work context.`,
    done_criteria: clusters.length > 0
      ? clusters[0].checkpoint_hint
      : `A completed project that demonstrates AI-native ${role} output.`,
    time_est: '3-4 hrs',
  };
}

// ── Cluster-aware fallback ───────────────────────────────────────────────────

function buildFallback(roleCategory: RoleCategory, gapClusters: SkillCluster[] = []): Roadmap {
  const role = ROLE_DISPLAY[roleCategory];

  const m1 = gapClusters.filter(c => c.module === 'm1');
  const m2 = gapClusters.filter(c => c.module === 'm2');
  const m3 = gapClusters.filter(c => c.module === 'm3');

  // Zero m1 clusters (e.g. engineer): seed step1 with first 2 m2
  const step1Clusters = m1.length > 0 ? m1.slice(0, 2) : m2.slice(0, 2);
  const step2Clusters = m1.length > 0 ? m2.slice(0, 2) : m2.slice(2, 4);
  const step3Clusters = m3.slice(0, 2);

  function buildStepNodes(clusters: SkillCluster[]): RoadmapNode[] {
    const nodes = clusters.slice(0, 3).map(c => buildClusterNode(c, role));
    while (nodes.length < 2) {
      nodes.push(buildGenericRepairNode(`repair-${roleCategory}-${nodes.length}`, role));
    }
    return nodes;
  }

  const step1: RoadmapStep = {
    label: 'STEP 1 - DAYS 1-30',
    theme: 'Foundation',
    nodes: buildStepNodes(step1Clusters),
    checkpoint: buildStepCheckpoint('Foundation', step1Clusters, role),
  };

  const step2: RoadmapStep = {
    label: 'STEP 2 - DAYS 31-60',
    theme: 'Applied Workflows',
    nodes: buildStepNodes(step2Clusters),
    checkpoint: buildStepCheckpoint('Applied Workflows', step2Clusters, role),
  };

  const step3: RoadmapStep = {
    label: 'STEP 3 - DAYS 61-90',
    theme: 'Build and Ship',
    nodes: buildStepNodes(step3Clusters),
    checkpoint: buildStepCheckpoint('Build and Ship', step3Clusters, role),
  };

  // Role-specific glossary defaults so glossary is never empty
  const defaultGlossary = roleCategory === 'engineer'
    ? [
        { term: 'API', definition: 'A connection point that lets two software tools talk to each other and share data.' },
        { term: 'Claude API', definition: 'Anthropic\'s AI interface that lets you send instructions to Claude and receive AI-generated responses in your own product.' },
        { term: 'Fine-tuning', definition: 'Training an AI model on your specific data so it produces better results for your particular use case.' },
      ]
    : [
        { term: 'Prompt', definition: 'The instruction you type to tell an AI tool what to do.' },
        { term: 'AI agent', definition: 'An AI that completes a multi-step task automatically without you clicking through each step.' },
        { term: 'Automation trigger', definition: 'The event — like a form submission or a new email — that starts a workflow running automatically.' },
      ];

  return { step1, step2, step3, glossary: defaultGlossary };
}

// ── Repair logic (replaces throw-based validateRoadmap) ──────────────────────

function repairNode(node: RoadmapNode, role: string): void {
  // Sanitize banned terms — do NOT reject the node
  for (const term of BANNED_CANVAS_TERMS) {
    if (node.name_plain.includes(term)) {
      node.name_plain = node.name_plain.replace(new RegExp(`\\b${term}\\b`, 'g'), '').replace(/\s+/g, ' ').trim();
      console.warn(JSON.stringify({ event: 'roadmap_repair', issue: 'banned_term_sanitized', term, node_id: node.id }));
    }
  }

  if (!node.name_plain) node.name_plain = 'Apply AI skills';

  if (!Array.isArray(node.subnodes)) node.subnodes = [];

  // Trim excess subnodes
  if (node.subnodes.length > 4) node.subnodes = node.subnodes.slice(0, 4);

  // Pad missing subnodes
  while (node.subnodes.length < 3) {
    const idx = node.subnodes.length + 1;
    node.subnodes.push({
      id: `${node.id}-repair-${idx}`,
      title: `Apply ${node.name_plain} to your work`,
      description: `Practice this skill on a real task from your ${role} work.`,
      outcome: 'A completed exercise you can add to your portfolio.',
      tools: ['ChatGPT'],
      time_est: '30 min',
    });
    console.warn(JSON.stringify({ event: 'roadmap_repair', issue: 'subnode_padded', node_id: node.id }));
  }

  // Apply tools/time_est defaults to all subnodes
  node.subnodes = node.subnodes.map(s => ({ tools: [], time_est: '', ...s }));
}

function repairRoadmap(roadmap: Roadmap, gapClusters: SkillCluster[], role: string): Roadmap {
  const stepKeys: (keyof Roadmap)[] = ['step1', 'step2', 'step3'];

  for (let i = 0; i < stepKeys.length; i++) {
    const step = roadmap[stepKeys[i]] as RoadmapStep;

    if (!Array.isArray(step?.nodes)) step.nodes = [];

    // Trim excess nodes
    if (step.nodes.length > 3) step.nodes = step.nodes.slice(0, 3);

    // Repair each node
    for (const node of step.nodes) repairNode(node, role);

    // Pad missing nodes using cluster data
    if (step.nodes.length < 2) {
      const usedIds = new Set(step.nodes.flatMap(n => n.skill_ids));
      const candidate = gapClusters.find(c => !usedIds.has(c.id));
      const repairNode_ = candidate
        ? buildClusterNode(candidate, role)
        : buildGenericRepairNode(`repair-step${i + 1}-n2`, role);
      step.nodes.push(repairNode_);
      console.warn(JSON.stringify({ event: 'roadmap_repair', issue: 'node_padded', step: i + 1 }));
    }
  }

  // Ensure glossary is not empty
  if (!Array.isArray(roadmap.glossary) || roadmap.glossary.length === 0) {
    roadmap.glossary = [];
  }

  return roadmap;
}

// ── Prompt builders ──────────────────────────────────────────────────────────

function buildUserPrompt(
  roleCategory: RoleCategory,
  socTitle: string,
  riskScore: number,
  gapClusters: SkillCluster[],
  haveClusters: SkillCluster[],
  topTasks: string[],
  aiFamiliarity: AiFamiliarity
): string {
  const role = ROLE_DISPLAY[roleCategory];

  const m1 = gapClusters.filter(c => c.module === 'm1');
  const m2 = gapClusters.filter(c => c.module === 'm2');
  const m3 = gapClusters.filter(c => c.module === 'm3');

  // Zero m1 fix: engineer has no m1 clusters — seed step1 with first 2 m2 as foundation
  const m1Effective = m1.length > 0 ? m1 : m2.slice(0, 2);
  const m2Effective = m1.length > 0 ? m2 : m2.slice(2);

  const taskSection = topTasks.length > 0
    ? `\nHigh-weight daily tasks (what this person actually does):\n${topTasks.map(t => `  - ${t}`).join('\n')}`
    : '';

  const haveSection = haveClusters.length > 0
    ? `\nAlready mastered (do NOT re-teach these):\n${haveClusters.map(formatCluster).join('\n')}`
    : '';

  const stepBlock = (label: string, clusters: SkillCluster[], fallback: string) =>
    `${label}:\n${clusters.length > 0 ? clusters.map(formatCluster).join('\n') : `  (none — ${fallback})`}`;

  return `Role: ${role} — ${socTitle}
AI displacement risk: ${riskScore}/100

AI familiarity level: ${aiFamiliarity}
Tone instruction: ${FAMILIARITY_TONE[aiFamiliarity]}

Role language constraint: ${ROLE_LANG_RULES[roleCategory]}
${taskSection}${haveSection}

SKILL CLUSTERS to close (each roadmap node MUST address at least one):

${stepBlock('STEP 1 — Foundation (Days 1-30)', m1Effective, 'build foundational AI skills for this role')}

${stepBlock('STEP 2 — Applied Workflows (Days 31-60)', m2Effective, 'build applied workflow skills for this role')}

${stepBlock('STEP 3 — Build and Ship (Days 61-90)', m3, 'capstone: demonstrate AI-native work for this role')}

Rules:
- Node names must reflect the SKILL being gained, in plain English, not the technology name.
- Subnodes are concrete exercises: specific tool named, tangible output, action verb in title.
- Populate skill_ids in each node with the cluster IDs (e.g. "C2B") that node closes.
- Checkpoint deliverable must prove the gap clusters for that step are closed.
- Banned node name terms: ${BANNED_CANVAS_TERMS.join(', ')}.
Return only the JSON object.`;
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateRoadmap(
  roleCategory: RoleCategory,
  socTitle: string,
  riskScore: number,
  gapClusters: SkillCluster[],
  haveClusters: SkillCluster[],
  topTasks: string[],
  aiFamiliarity: AiFamiliarity = 'none'
): Promise<Roadmap> {
  const role = ROLE_DISPLAY[roleCategory];

  try {
    const raw = await callLLM({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(roleCategory, socTitle, riskScore, gapClusters, haveClusters, topTasks, aiFamiliarity),
      maxTokens: 4096,
      temperature: 0.3,
    });

    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(stripped) as Roadmap;
    return repairRoadmap(parsed, gapClusters, role);
  } catch (err) {
    console.error(JSON.stringify({
      event: 'roadmap_gen_fallback',
      error: err instanceof Error ? err.message : String(err),
      role: roleCategory,
      gap_cluster_ids: gapClusters.map(c => c.id),
    }));
    return buildFallback(roleCategory, gapClusters);
  }
}
