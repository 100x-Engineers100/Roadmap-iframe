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

// Per-role tool and language constraints fed into the LLM prompt
const ROLE_LANG_RULES: Record<RoleCategory, string> = {
  engineer: 'Technical depth expected. Name APIs, frameworks, and code tools explicitly. Exercises may require writing code.',
  pm: 'Business context + light technical literacy. Tools: Claude, Notion AI, Linear AI, Figma AI, ChatGPT. Exercises are workflow-level, not code-level.',
  designer: 'NO code whatsoever. Tools: Midjourney, Canva AI, Adobe Firefly, Figma AI, ElevenLabs, Runway. Exercises are about visuals, brand, and creative output.',
  marketer: 'NO code whatsoever. Tools: ChatGPT, Jasper, Canva AI, HeyGen, Zapier, n8n, Notion AI. Exercises are about campaigns, copy, content, and workflow automation.',
  sales: 'NO code whatsoever. Tools: ChatGPT, Clay, HubSpot AI, Apollo, Gong AI, Lavender. Exercises are about outreach, research, pipeline, and negotiation prep.',
  student: 'Accessible language. Tools: ChatGPT, Claude, Perplexity, Notion AI, Gamma. Build conceptual understanding before specialization. No code unless natural.',
};

// Tone instruction based on how long user has used AI
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
- Glossary: out-of-band key terms only. Never make a glossary term a roadmap node.
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

function formatCluster(c: SkillCluster): string {
  return `  [${c.id}] ${c.name}\n    Benefit: ${c.can_do}\n    Project: ${c.checkpoint_hint}`;
}

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

${stepBlock('STEP 1 — Foundation (Days 1-30)', m1, 'build foundational AI skills for this role')}

${stepBlock('STEP 2 — Applied Workflows (Days 31-60)', m2, 'build applied workflow skills for this role')}

${stepBlock('STEP 3 — Build and Ship (Days 61-90)', m3, 'capstone: demonstrate AI-native work for this role')}

Rules:
- Node names must reflect the SKILL being gained, in plain English, not the technology name.
- Subnodes are concrete exercises: specific tool named, tangible output, action verb in title.
- Populate skill_ids in each node with the cluster IDs (e.g. "C2B") that node closes.
- Checkpoint deliverable must prove the gap clusters for that step are closed.
- Banned node name terms: ${BANNED_CANVAS_TERMS.join(', ')}.
Return only the JSON object.`;
}

function makeNode(
  id: string,
  name: string,
  desc: string,
  covers: string,
  after: string,
  subnodes: RoadmapNode['subnodes'],
  depth: Difficulty,
  role: string,
  nodeKind: RoadmapNode['node_kind'] = 'concept'
): RoadmapNode {
  return {
    id,
    node_kind: nodeKind,
    name_plain: name,
    one_line_desc: desc,
    what_covers: covers,
    what_do_after: after,
    subnodes: subnodes.map(s => ({ tools: [], time_est: '', ...s })),
    concepts_left: ['Input quality', 'Context control', 'Review standards'],
    concepts_right: ['Write a reusable brief', 'Run a guided work session', 'Improve the final output'],
    skill_ids: [],
    analogy: {
      base: 'Moving from random effort to a repeatable operating system',
      role_skin: `Turning everyday ${role} work into a guided AI-supported workflow`,
      bridge_line: 'The value is not one clever prompt — it is a system that makes every task start from a better baseline.',
    },
    depth,
  };
}

function buildFallback(roleCategory: RoleCategory): Roadmap {
  const role = ROLE_DISPLAY[roleCategory];

  const step1: RoadmapStep = {
    label: 'STEP 1 - DAYS 1-30',
    theme: 'Operator Foundation',
    nodes: [
      makeNode(
        'n1', 'Clear Instructions',
        'Get consistent, useful results from any AI tool by giving it the right context.',
        'Goal framing, constraints, examples, and review criteria. Turning vague requests into structured work instructions.',
        'You will write reusable instruction templates for your top daily tasks.',
        [
          { id: 'n1-s1', title: 'Write your first AI brief', description: 'Use ChatGPT or Claude to tackle one real task from your day using a structured goal + context + constraint format.', outcome: 'A completed work task and a saved prompt template.', tools: ['ChatGPT', 'Claude'], time_est: '45 min' },
          { id: 'n1-s2', title: 'Add useful context to your prompts', description: 'Improve the same prompt by adding audience, tone, examples, and format requirements. Compare the outputs.', outcome: 'A before/after prompt pair showing how context changes the result.', tools: ['ChatGPT'], time_est: '30 min' },
          { id: 'n1-s3', title: 'Build a personal prompt library', description: 'Save your 5 best prompts in Notion or a document with labels for when to use each one.', outcome: 'A reusable prompt library for your top 5 work tasks.', tools: ['Notion', 'ChatGPT'], time_est: '1 hr' },
        ],
        'foundational', role
      ),
      makeNode(
        'n2', 'Tool Selection',
        'Stop using one AI tool for everything — match the tool to the task.',
        'When to use chat, document analysis, image generation, search, and workflow tools. Choosing the right tool over forcing a single tool everywhere.',
        'You will have a task-to-tool map for your role.',
        [
          { id: 'n2-s1', title: 'List your repeating tasks', description: 'Write down the 10 tasks you do every week that follow a recognizable pattern.', outcome: 'A ranked list of your top automation and AI-assist candidates.', tools: ['Notion', 'ChatGPT'], time_est: '30 min' },
          { id: 'n2-s2', title: 'Map tasks to AI tools', description: 'For each task, choose the tool category that fits: chat, search, image, automation, or document AI.', outcome: 'A task-to-tool map specific to your role.', tools: ['Notion'], time_est: '45 min' },
          { id: 'n2-s3', title: 'Test one tool per task', description: 'Run each mapped tool against a real version of that task and document what worked and what did not.', outcome: 'A tested toolkit with notes on each tool\'s strengths for your role.', tools: ['ChatGPT', 'Notion AI', 'Perplexity'], time_est: '1-2 hrs' },
        ],
        'foundational', role
      ),
    ],
    checkpoint: {
      title: 'AI-Augmented Workday Sprint',
      goal: 'Run one real workday with AI support on every repeatable task.',
      concepts: ['Task mapping', 'Prompt quality', 'Output review'],
      problem_statement: 'Your day has repeated tasks that drain time without improving your judgment. Build a setup that handles the busywork while keeping you in control.',
      done_criteria: 'A before-and-after work sample for one full day: same tasks, AI-supported, with a written note on what improved.',
      time_est: '3-4 hrs',
    },
  };

  const step2: RoadmapStep = {
    label: 'STEP 2 - DAYS 31-60',
    theme: 'Role Workflows',
    nodes: [
      makeNode(
        'n3', 'Workflow Design',
        `Build a repeatable, AI-supported workflow for your most important ${role} tasks.`,
        'Turning one-off tool use into a reliable sequence: inputs, transformation steps, review gates, final handoff.',
        'You will have a reusable workflow for your highest-value role task.',
        [
          { id: 'n3-s1', title: 'Pick one high-value task', description: 'Choose a task with clear inputs and a valuable output that you repeat at least weekly.', outcome: 'One workflow target with a written success definition.', tools: ['Notion'], time_est: '30 min' },
          { id: 'n3-s2', title: 'Map the task into steps', description: 'Break the task into: collect, think, draft, review. Write each step down with the AI role in each.', outcome: 'A visible workflow skeleton you can follow and improve.', tools: ['Notion', 'ChatGPT'], time_est: '1 hr' },
          { id: 'n3-s3', title: 'Add review gates', description: 'Decide where a human check must happen before the output moves forward. Mark these as mandatory stops.', outcome: 'A safer workflow with review checkpoints built in.', tools: ['Notion'], time_est: '30 min' },
        ],
        'intermediate', role
      ),
      makeNode(
        'n4', 'Quality Control',
        'Learn to judge AI-assisted work before it leaves your hands.',
        'Fact-checking, format consistency, tone matching, and business usefulness. Professional-grade output, not just fast first drafts.',
        'You will review AI-assisted work against a clear quality standard before using it.',
        [
          { id: 'n4-s1', title: 'Create a quality rubric', description: 'Write down what "good" looks like for one specific AI output type in your role. Be specific about format, tone, and accuracy.', outcome: 'A personal quality rubric for your most common AI-assisted task.', tools: ['Notion'], time_est: '30 min' },
          { id: 'n4-s2', title: 'Run a structured review pass', description: 'Take an AI-generated output and go through your rubric item by item. Mark what passes and what needs work.', outcome: 'A marked-up review showing where AI output falls short for your standards.', tools: ['ChatGPT', 'Notion'], time_est: '45 min' },
          { id: 'n4-s3', title: 'Improve one output to final quality', description: 'Take the reviewed draft and raise it to the standard you would actually use or send.', outcome: 'A polished final version with a note on what required human judgment.', tools: ['ChatGPT', 'Claude'], time_est: '1 hr' },
        ],
        'intermediate', role
      ),
    ],
    checkpoint: {
      title: 'Reusable Workflow Document',
      goal: `Document one repeatable AI-supported ${role} workflow another person could follow.`,
      concepts: ['Workflow sequence', 'Human review gates', 'Reusable templates'],
      problem_statement: 'Your team keeps recreating similar work from scratch. Build a workflow that is clear enough for someone else to follow and trust.',
      done_criteria: 'A workflow document with: input format, step-by-step process, review gates, and a final output example.',
      time_est: '4-6 hrs',
    },
  };

  const step3: RoadmapStep = {
    label: 'STEP 3 - DAYS 61-90',
    theme: 'Portfolio Signal',
    nodes: [
      makeNode(
        'n5', 'Automation Systems',
        'Connect tools and handoffs so your work moves with less manual effort.',
        'Trigger-based workflows, file handoffs, summaries, and routine reporting. Connect small pieces before attempting large systems.',
        'You will have a lightweight automation handling at least one real business task.',
        [
          { id: 'n5-s1', title: 'Choose your automation trigger', description: 'Decide what starts your workflow — a new form submission, a calendar event, or a file arriving in a folder.', outcome: 'A clear starting event with a documented trigger condition.', tools: ['Zapier', 'n8n'], time_est: '30 min' },
          { id: 'n5-s2', title: 'Build the automation skeleton', description: 'Set up the trigger and one action in Zapier or n8n. Use a test event to confirm the connection works.', outcome: 'A working 2-step automation you can demonstrate.', tools: ['Zapier', 'n8n'], time_est: '1-2 hrs' },
          { id: 'n5-s3', title: 'Test with real input', description: 'Run the automation against realistic data from your role. Fix anything that breaks or produces wrong output.', outcome: 'A tested automation that runs correctly on real data.', tools: ['Zapier', 'n8n', 'ChatGPT'], time_est: '1 hr' },
        ],
        'advanced', role, 'project'
      ),
      makeNode(
        'n6', 'Capstone Project',
        `Package your AI-supported ${role} work into a visible proof project.`,
        'Selecting a real business problem, solving it with your workflow, and presenting the result clearly for your portfolio.',
        'You will have a portfolio-quality proof of AI-native work in your role.',
        [
          { id: 'n6-s1', title: 'Choose a real problem to solve', description: 'Pick a problem from your actual role that has a measurable outcome — time saved, quality improved, or output volume increased.', outcome: 'A project statement: problem, expected outcome, and success metric.', tools: ['Notion', 'ChatGPT'], time_est: '45 min' },
          { id: 'n6-s2', title: 'Build the proof', description: 'Use your workflow to produce a real, finished deliverable for this problem. Document each step as you go.', outcome: 'A finished work sample you are proud to show.', tools: ['ChatGPT', 'Claude', 'Notion'], time_est: '3-4 hrs' },
          { id: 'n6-s3', title: 'Write the case study', description: 'Explain the problem, your workflow, the result, and the measurable improvement in one page. Use plain language.', outcome: 'A one-page project case study ready for a portfolio or interview.', tools: ['Notion', 'ChatGPT'], time_est: '1 hr' },
        ],
        'advanced', role, 'project'
      ),
    ],
    checkpoint: {
      title: 'AI-Native Portfolio Project',
      goal: `Deliver one high-quality ${role} outcome using an end-to-end AI-supported workflow.`,
      concepts: ['Automation design', 'Quality assurance', 'Business presentation'],
      problem_statement: 'You need a proof project showing you can redesign work around AI — not just use tools casually.',
      done_criteria: 'A polished project page explaining the problem, workflow, result, and measurable improvement.',
      time_est: '6-8 hrs',
    },
  };

  return { step1, step2, step3, glossary: [] };
}

function isValidNode(node: RoadmapNode): boolean {
  const name = node.name_plain.trim();
  const hasBannedTerm = BANNED_CANVAS_TERMS.some((term) => name.includes(term));
  return (
    name.length > 0 &&
    !hasBannedTerm &&
    Array.isArray(node.subnodes) &&
    node.subnodes.length >= 3 &&
    node.subnodes.length <= 4
  );
}

function validateRoadmap(roadmap: Roadmap): Roadmap {
  const steps = [roadmap.step1, roadmap.step2, roadmap.step3];
  for (const step of steps) {
    if (!Array.isArray(step.nodes) || step.nodes.length < 2 || step.nodes.length > 3) {
      throw new Error('Roadmap step must have 2-3 top-level nodes');
    }
    if (!step.nodes.every(isValidNode)) {
      throw new Error('Roadmap node failed validation');
    }
    if (!step.checkpoint?.title || !step.checkpoint.done_criteria) {
      throw new Error('Roadmap checkpoint missing required fields');
    }
  }
  // Ensure tools/time_est defaults on every subnode
  for (const step of steps) {
    for (const node of step.nodes) {
      node.subnodes = node.subnodes.map(s => ({
        tools: [],
        time_est: '',
        ...s,
      }));
    }
  }
  return roadmap;
}

export async function generateRoadmap(
  roleCategory: RoleCategory,
  socTitle: string,
  riskScore: number,
  gapClusters: SkillCluster[],
  haveClusters: SkillCluster[],
  topTasks: string[],
  aiFamiliarity: AiFamiliarity = 'none'
): Promise<Roadmap> {
  try {
    const raw = await callLLM({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(roleCategory, socTitle, riskScore, gapClusters, haveClusters, topTasks, aiFamiliarity),
      maxTokens: 4096,
      temperature: 0.3,
    });

    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return validateRoadmap(JSON.parse(stripped) as Roadmap);
  } catch {
    return buildFallback(roleCategory);
  }
}
