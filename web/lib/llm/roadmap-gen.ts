import { callLLM } from './provider';
import type { Difficulty, Roadmap, RoadmapNode, RoadmapStep, RoleCategory } from '@/types';

const ROLE_DISPLAY: Record<RoleCategory, string> = {
  pm: 'Product Manager',
  designer: 'Designer',
  marketer: 'Marketer',
  sales: 'Sales Professional',
  engineer: 'Engineer',
  student: 'Student',
};

const BANNED_CANVAS_TERMS = ['RAG', 'MCP', 'ReAct', 'API', 'LLM', 'SPAORL', 'BM25'];

const SYSTEM_PROMPT = `You are a curriculum architect for 100x School of Applied AI.
Generate a personalized 90-day roadmap as valid JSON only. No markdown fences, no explanation.

Critical structure:
- Exactly 3 steps: step1, step2, step3.
- Each step has 2-3 top-level nodes.
- Top-level nodes are what appear on the main snake roadmap.
- Each top-level node has 3-4 static subnodes. These appear only inside the side panel.
- Project checkpoints appear only inside the side panel for a clicked node.
- Top-level node names must be plain English, 2-4 words, no acronyms.

The JSON must match this TypeScript type:

interface Roadmap {
  step1: RoadmapStep;
  step2: RoadmapStep;
  step3: RoadmapStep;
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
}
interface RoadmapNode {
  id: string;
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
}`;

function buildUserPrompt(
  roleCategory: RoleCategory,
  socTitle: string,
  riskScore: number,
  gapSkillIds: string[],
  haveSkillIds: string[]
): string {
  return `Role: ${ROLE_DISPLAY[roleCategory]} (${socTitle})
AI displacement risk score: ${riskScore}
Skills to build: ${gapSkillIds.join(', ') || 'general applied AI literacy'}
Skills already present: ${haveSkillIds.join(', ') || 'none identified'}

Generate a focused 90-day roadmap that closes the top gaps and maps to 100x Applied AI training.
Avoid these exact terms in top-level node names: ${BANNED_CANVAS_TERMS.join(', ')}.
Return only the JSON object matching the Roadmap interface.`;
}

function makeNode(
  id: string,
  name: string,
  desc: string,
  covers: string,
  after: string,
  subnodes: RoadmapNode['subnodes'],
  depth: Difficulty,
  role: string
): RoadmapNode {
  return {
    id,
    name_plain: name,
    one_line_desc: desc,
    what_covers: covers,
    what_do_after: after,
    subnodes,
    concepts_left: ['Input quality', 'Context control', 'Review standards'],
    concepts_right: ['Write a reusable brief', 'Run a guided work session', 'Improve the final output'],
    skill_ids: [],
    analogy: {
      base: 'Moving from random effort to a repeatable operating system',
      role_skin: `Turning everyday ${role} work into a guided applied AI workflow`,
      bridge_line: 'The value is not one clever prompt; it is a repeatable way to produce better work.',
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
        'n1',
        'Clear Instructions',
        'Learn to brief AI tools with enough context to get useful work back.',
        'This node covers goal framing, constraints, examples, and review criteria. The focus is turning vague requests into structured work instructions.',
        'You will be able to create reusable instruction templates for daily work.',
        [
          { id: 'n1-s1', title: 'Define the outcome', description: 'Write the exact result you want before choosing a tool.', outcome: 'A one-line success target for each task.' },
          { id: 'n1-s2', title: 'Add useful context', description: 'Provide audience, inputs, tone, limits, and examples.', outcome: 'A complete brief that reduces back-and-forth.' },
          { id: 'n1-s3', title: 'Set review rules', description: 'Create simple checks for accuracy, format, and usefulness.', outcome: 'A checklist for accepting or rejecting output.' },
        ],
        'foundational',
        role
      ),
      makeNode(
        'n2',
        'Tool Habits',
        'Map everyday tasks to the right kind of AI help.',
        'This node covers when to use chat, document analysis, search, image generation, and workflow tools. The focus is choosing the right tool for the work instead of forcing one tool everywhere.',
        'You will be able to match common work tasks to practical AI workflows.',
        [
          { id: 'n2-s1', title: 'List repeated tasks', description: 'Identify the work you do every week that follows a pattern.', outcome: 'A ranked list of automation candidates.' },
          { id: 'n2-s2', title: 'Choose the helper', description: 'Pick the tool category that fits each task type.', outcome: 'A task-to-tool map for your role.' },
          { id: 'n2-s3', title: 'Save the pattern', description: 'Document the setup so the workflow can be reused.', outcome: 'A reusable workflow note.' },
        ],
        'foundational',
        role
      ),
    ],
    checkpoint: {
      title: 'AI-Augmented Workday Sprint',
      goal: 'Run one real workday with AI support on every repeatable task.',
      concepts: ['Task mapping', 'Brief quality', 'Output review'],
      problem_statement: 'Your day has repeated tasks that drain time without improving judgment. Build a repeatable setup that helps with the busywork while keeping you in control.',
      done_criteria: 'A before-and-after work sample showing faster completion and a better review process.',
      time_est: '3-4 hours',
    },
  };

  const step2: RoadmapStep = {
    label: 'STEP 2 - DAYS 31-60',
    theme: 'Role Workflows',
    nodes: [
      makeNode(
        'n3',
        'Workflow Design',
        `Build repeatable AI-supported workflows for ${role} tasks.`,
        'This node turns one-off tool use into a sequence of steps. You define inputs, transformation steps, review points, and final handoff.',
        'You will be able to build a reusable workflow for a high-value role task.',
        [
          { id: 'n3-s1', title: 'Pick one job', description: 'Choose a task with clear inputs and a valuable output.', outcome: 'One workflow target with success criteria.' },
          { id: 'n3-s2', title: 'Break the steps', description: 'Split the task into collection, reasoning, drafting, and review.', outcome: 'A visible workflow spine.' },
          { id: 'n3-s3', title: 'Add checkpoints', description: 'Place human review where mistakes would be expensive.', outcome: 'A safer workflow with review gates.' },
        ],
        'intermediate',
        role
      ),
      makeNode(
        'n4',
        'Quality Control',
        'Learn to judge and improve AI-assisted work before using it.',
        'This node covers fact checks, format checks, tone matching, and business usefulness. The goal is professional-grade output, not fast first drafts.',
        'You will be able to review AI-assisted work with a clear quality bar.',
        [
          { id: 'n4-s1', title: 'Create a rubric', description: 'Define what good means for this output.', outcome: 'A simple scoring rubric.' },
          { id: 'n4-s2', title: 'Find weak spots', description: 'Check for missing facts, vague claims, and bad structure.', outcome: 'A marked-up review pass.' },
          { id: 'n4-s3', title: 'Improve the draft', description: 'Use your judgment to raise the output quality.', outcome: 'A polished final version.' },
        ],
        'intermediate',
        role
      ),
    ],
    checkpoint: {
      title: 'Reusable Workflow Document',
      goal: `Document one repeatable AI-supported ${role} workflow.`,
      concepts: ['Workflow sequence', 'Human review', 'Reusable templates'],
      problem_statement: 'Your team keeps recreating similar work from scratch. Build a workflow that another person can follow and trust.',
      done_criteria: 'A workflow document with input format, steps, review gates, and final output example.',
      time_est: '4-6 hours',
    },
  };

  const step3: RoadmapStep = {
    label: 'STEP 3 - DAYS 61-90',
    theme: 'Portfolio Signal',
    nodes: [
      makeNode(
        'n5',
        'Automation Systems',
        'Connect tools and handoffs so work moves with less manual effort.',
        'This node covers trigger-based workflows, file handoffs, summaries, and routine reporting. It stays practical: connect small pieces before attempting large systems.',
        'You will be able to design a lightweight automation for a real business task.',
        [
          { id: 'n5-s1', title: 'Choose the trigger', description: 'Decide what starts the workflow.', outcome: 'A clear starting event.' },
          { id: 'n5-s2', title: 'Define the handoff', description: 'Specify what data moves between steps.', outcome: 'A clean handoff map.' },
          { id: 'n5-s3', title: 'Test with real input', description: 'Run the workflow against realistic material.', outcome: 'A tested automation draft.' },
        ],
        'advanced',
        role
      ),
      makeNode(
        'n6',
        'Capstone Project',
        `Package your AI-native ${role} work into a visible proof project.`,
        'This node focuses on selecting a real business problem, solving it with your new workflow, and presenting the result clearly. The outcome is a portfolio-quality proof of work.',
        'You will be able to show a concrete AI-native project for your role.',
        [
          { id: 'n6-s1', title: 'Pick the problem', description: 'Choose a problem that matters in your role.', outcome: 'A practical project statement.' },
          { id: 'n6-s2', title: 'Build the proof', description: 'Use your workflow to produce a real deliverable.', outcome: 'A finished work sample.' },
          { id: 'n6-s3', title: 'Explain the lift', description: 'Show how the workflow changed speed, quality, or scope.', outcome: 'A clear project case study.' },
        ],
        'advanced',
        role
      ),
    ],
    checkpoint: {
      title: 'AI-Native Portfolio Project',
      goal: `Deliver one high-quality ${role} outcome using an end-to-end AI-supported workflow.`,
      concepts: ['Automation design', 'Quality assurance', 'Business presentation'],
      problem_statement: 'You need a proof project that shows you can redesign work around AI instead of only using tools casually.',
      done_criteria: 'A polished project page or document that explains the problem, workflow, result, and measurable improvement.',
      time_est: '6-8 hours',
    },
  };

  return { step1, step2, step3 };
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
      throw new Error('Roadmap node failed nested-node validation');
    }
    if (!step.checkpoint?.title || !step.checkpoint.done_criteria) {
      throw new Error('Roadmap checkpoint missing required fields');
    }
  }
  return roadmap;
}

export async function generateRoadmap(
  roleCategory: RoleCategory,
  socTitle: string,
  riskScore: number,
  gapSkillIds: string[],
  haveSkillIds: string[]
): Promise<Roadmap> {
  try {
    const raw = await callLLM({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(roleCategory, socTitle, riskScore, gapSkillIds, haveSkillIds),
      maxTokens: 2400,
      temperature: 0.3,
    });

    return validateRoadmap(JSON.parse(raw) as Roadmap);
  } catch {
    return buildFallback(roleCategory);
  }
}
