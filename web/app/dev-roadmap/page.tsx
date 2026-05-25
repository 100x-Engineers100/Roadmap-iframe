import { notFound } from 'next/navigation';
import { RoadmapView } from '@/components/screens/RoadmapView';
import type { Roadmap } from '@/types';

const sampleRoadmap: Roadmap = {
  step1: {
    label: 'Phase 1',
    theme: 'Displacement Map',
    nodes: [
      {
        id: 'node-1',
        node_kind: 'concept',
        name_plain: 'Threat Map Audit',
        one_line_desc: 'Find the PM work AI compresses first.',
        what_covers: 'You inventory recurring IT project manager tasks and separate exposure risk from human judgment. The goal is to know which work should be automated, reviewed, or protected.',
        what_do_after: 'You can explain which parts of sprint planning, reporting, vendor follow-up, and risk review are exposed to AI and which still need your judgment.',
        subnodes: [
          { id: 'n1-a', title: 'Task exposure', description: 'List repeated coordination, writing, and reporting tasks.', outcome: 'A ranked exposure map.' },
          { id: 'n1-b', title: 'Judgment zones', description: 'Mark decisions that need business context or stakeholder trust.', outcome: 'Clear human-owned work.' },
          { id: 'n1-c', title: 'Automation boundary', description: 'Draw the line between safe assistance and unsafe delegation.', outcome: 'Safer AI use rules.' },
        ],
        concepts_left: ['Task exposure', 'Judgment zones', 'Automation boundary'],
        concepts_right: ['Task inventory', 'Risk tags', 'Owner review'],
        skill_ids: [],
        analogy: {
          base: 'A threat map works like a pre-mortem for your job.',
          role_skin: 'For an IT PM, it shows which coordination loops AI can copy and which decisions still need context.',
          bridge_line: 'You cannot upgrade work you have not mapped.',
        },
        depth: 'foundational',
      },
      {
        id: 'node-2',
        node_kind: 'concept',
        name_plain: 'Prompt Contract System',
        one_line_desc: 'Turn project context into reliable AI briefs.',
        what_covers: 'You define reusable prompt contracts for sprint updates, dependency summaries, risk notes, and stakeholder emails. Each contract includes context, source material, output format, and review rules.',
        what_do_after: 'You can produce consistent AI-assisted drafts without rewriting the same instructions every day.',
        subnodes: [
          { id: 'n2-a', title: 'Prompt contract', description: 'Define role, context, source limits, and output shape.', outcome: 'Reusable PM brief.' },
          { id: 'n2-b', title: 'Output format', description: 'Lock the sections, tables, and decision fields.', outcome: 'Predictable drafts.' },
          { id: 'n2-c', title: 'Review rubric', description: 'Score clarity, accuracy, risk, and next action quality.', outcome: 'Faster quality checks.' },
        ],
        concepts_left: ['Prompt contract', 'Output format', 'Review rubric'],
        concepts_right: ['Brief template', 'Example bank', 'Acceptance gate'],
        skill_ids: [],
        analogy: {
          base: 'A prompt contract is a job ticket, not a casual request.',
          role_skin: 'It gives the model the same operating context you would give a reliable project coordinator.',
          bridge_line: 'Good contracts make AI output inspectable.',
        },
        depth: 'foundational',
      },
      {
        id: 'node-3',
        node_kind: 'project',
        name_plain: 'Sprint Brief Bot',
        one_line_desc: 'Build a brief generator for sprint planning.',
        what_covers: 'You build a small workflow that turns tickets, notes, blockers, and goals into a sprint brief. The focus is scoped: one input bundle, one output contract, one review pass.',
        what_do_after: 'You can demo a real project artifact that saves planning time without hiding project risk.',
        subnodes: [
          { id: 'n3-a', title: 'Input schema', description: 'Define ticket, owner, blocker, and priority fields.', outcome: 'Clean source packet.' },
          { id: 'n3-b', title: 'Brief generator', description: 'Draft sprint goal, risks, dependencies, and asks.', outcome: 'Usable sprint brief.' },
          { id: 'n3-c', title: 'Test cases', description: 'Run messy, missing, and conflicting inputs.', outcome: 'Known failure modes.' },
        ],
        concepts_left: ['Input schema', 'Failure modes', 'Acceptance gate'],
        concepts_right: ['Brief generator', 'Test packet', 'Demo recording'],
        skill_ids: [],
        analogy: {
          base: 'This project is a small factory cell.',
          role_skin: 'Your raw material is messy sprint context; the output is a brief a team can actually use.',
          bridge_line: 'A visible workflow beats a claim that you use AI well.',
        },
        depth: 'intermediate',
      },
    ],
    checkpoint: {
      title: 'Sprint Planning Workflow',
      goal: 'Ship a repeatable sprint brief workflow.',
      concepts: ['Task exposure', 'Prompt contract', 'Human review'],
      problem_statement: 'Can you turn scattered project context into a sprint brief with clear risks, owners, and asks?',
      done_criteria: 'The workflow accepts a realistic input packet and produces a brief that another PM can review in five minutes.',
      time_est: '4-6 hours',
    },
  },
  step2: {
    label: 'Phase 2',
    theme: 'Operating System',
    nodes: [
      {
        id: 'node-4',
        node_kind: 'concept',
        name_plain: 'Meeting Signal Capture',
        one_line_desc: 'Convert meetings into structured follow-through.',
        what_covers: 'You design a capture loop for decisions, blockers, dependencies, and owner commitments. The outcome is not a transcript summary; it is an action layer for project control.',
        what_do_after: 'You can turn messy meeting notes into follow-up items, risk flags, and stakeholder-ready summaries.',
        subnodes: [
          { id: 'n4-a', title: 'Decision log', description: 'Extract decisions, tradeoffs, and owner names.', outcome: 'Visible decision trail.' },
          { id: 'n4-b', title: 'Dependency scan', description: 'Find blocked work and cross-team asks.', outcome: 'Sharper follow-ups.' },
          { id: 'n4-c', title: 'Action ledger', description: 'Convert discussion into owner, due date, and next step.', outcome: 'Less dropped work.' },
        ],
        concepts_left: ['Decision log', 'Dependency scan', 'Action ledger'],
        concepts_right: ['Meeting parser', 'Owner matrix', 'Follow-up draft'],
        skill_ids: [],
        analogy: {
          base: 'Meeting capture is an air traffic control log.',
          role_skin: 'Every action, dependency, and decision needs to land somewhere visible.',
          bridge_line: 'The value is in follow-through, not prettier notes.',
        },
        depth: 'intermediate',
      },
      {
        id: 'node-5',
        node_kind: 'concept',
        name_plain: 'Risk Review Loop',
        one_line_desc: 'Catch weak AI output before it spreads.',
        what_covers: 'You build review loops for source checks, assumption checks, missing stakeholder context, and escalation triggers. This keeps AI speed from turning into bad project communication.',
        what_do_after: 'You can inspect AI-assisted status, risk, and planning output with a practical PM quality bar.',
        subnodes: [
          { id: 'n5-a', title: 'Source check', description: 'Verify claims against tickets, docs, and meeting notes.', outcome: 'Lower hallucination risk.' },
          { id: 'n5-b', title: 'Assumption list', description: 'Separate known facts from model guesses.', outcome: 'Cleaner escalation.' },
          { id: 'n5-c', title: 'Release gate', description: 'Define what must be true before sharing output.', outcome: 'Safer stakeholder updates.' },
        ],
        concepts_left: ['Source check', 'Assumption list', 'Release gate'],
        concepts_right: ['Evidence packet', 'Risk rubric', 'Escalation note'],
        skill_ids: [],
        analogy: {
          base: 'Risk review is a pre-flight checklist.',
          role_skin: 'It keeps a fast AI draft from becoming a misleading project update.',
          bridge_line: 'The faster the tool, the more explicit the review gate must be.',
        },
        depth: 'intermediate',
      },
      {
        id: 'node-6',
        node_kind: 'project',
        name_plain: 'Status Agent Prototype',
        one_line_desc: 'Create a weekly status workflow with controls.',
        what_covers: 'You prototype a status workflow that reads a prepared project packet, drafts updates for different audiences, and flags missing evidence before output is used.',
        what_do_after: 'You can show a controlled assistant that improves status reporting without pretending to own project judgment.',
        subnodes: [
          { id: 'n6-a', title: 'Audience modes', description: 'Create exec, team, and vendor update variants.', outcome: 'Targeted communication.' },
          { id: 'n6-b', title: 'Evidence packet', description: 'Attach the source set the workflow may use.', outcome: 'Grounded updates.' },
          { id: 'n6-c', title: 'Human review', description: 'Add a final PM approval step.', outcome: 'Controlled release.' },
        ],
        concepts_left: ['Audience modes', 'Evidence packet', 'Human review'],
        concepts_right: ['Status draft', 'Risk flagger', 'Approval checklist'],
        skill_ids: [],
        analogy: {
          base: 'A status agent is a junior analyst with a locked source folder.',
          role_skin: 'It drafts the update, but you decide what is true, sensitive, or politically risky.',
          bridge_line: 'Control is what makes the prototype credible.',
        },
        depth: 'advanced',
      },
    ],
    checkpoint: {
      title: 'Controlled Status Workflow',
      goal: 'Demo an AI-assisted weekly status update with review gates.',
      concepts: ['Decision log', 'Evidence packet', 'Release gate'],
      problem_statement: 'Can your workflow turn real project inputs into audience-specific status updates and expose missing evidence before sharing?',
      done_criteria: 'The demo includes source packet, generated updates, risk flags, and a human approval checklist.',
      time_est: '5-7 hours',
    },
  },
  step3: {
    label: 'Phase 3',
    theme: 'Career Signal',
    nodes: [
      {
        id: 'node-7',
        node_kind: 'concept',
        name_plain: 'Impact Metrics Story',
        one_line_desc: 'Prove the AI workflow changed real work.',
        what_covers: 'You measure before and after effort, cycle time, update quality, missed follow-ups, and stakeholder clarity. The goal is practical evidence, not vague productivity claims.',
        what_do_after: 'You can explain the measurable lift from your AI-supported PM workflow.',
        subnodes: [
          { id: 'n7-a', title: 'Baseline metric', description: 'Measure the current manual process.', outcome: 'Before-state proof.' },
          { id: 'n7-b', title: 'Quality signal', description: 'Pick review scores and missed-risk indicators.', outcome: 'Better evidence.' },
          { id: 'n7-c', title: 'Result narrative', description: 'Tell the change story with numbers and examples.', outcome: 'Credible case study.' },
        ],
        concepts_left: ['Baseline metric', 'Quality signal', 'Result narrative'],
        concepts_right: ['Before after', 'Time saved', 'Risk caught'],
        skill_ids: [],
        analogy: {
          base: 'Impact metrics are the scoreboard.',
          role_skin: 'They show whether AI improved project control instead of only making drafts faster.',
          bridge_line: 'Without measurement, the project is just a nice demo.',
        },
        depth: 'advanced',
      },
      {
        id: 'node-8',
        node_kind: 'concept',
        name_plain: 'Team Adoption Playbook',
        one_line_desc: 'Make your workflow usable by other PMs.',
        what_covers: 'You package prompts, templates, review standards, examples, and misuse warnings into a playbook another project manager can run.',
        what_do_after: 'You can hand off the AI workflow without being the only person who understands it.',
        subnodes: [
          { id: 'n8-a', title: 'Usage rules', description: 'State when the workflow should and should not be used.', outcome: 'Safer adoption.' },
          { id: 'n8-b', title: 'Example runs', description: 'Show good, weak, and failed workflow examples.', outcome: 'Faster training.' },
          { id: 'n8-c', title: 'Operating ritual', description: 'Attach the workflow to weekly PM habits.', outcome: 'Repeatable team use.' },
        ],
        concepts_left: ['Usage rules', 'Example runs', 'Operating ritual'],
        concepts_right: ['Prompt library', 'Training page', 'Review ritual'],
        skill_ids: [],
        analogy: {
          base: 'Adoption is productizing your own workflow.',
          role_skin: 'Other PMs need a reliable operating guide, not your private prompt collection.',
          bridge_line: 'A workflow becomes valuable when the team can repeat it.',
        },
        depth: 'advanced',
      },
      {
        id: 'node-9',
        node_kind: 'project',
        name_plain: 'Portfolio Case Study',
        one_line_desc: 'Package proof that you are AI-native.',
        what_covers: 'You turn the threat map, prompt contracts, workflow prototype, metrics, and playbook into a concise case study that shows how you redesigned PM work around AI.',
        what_do_after: 'You can show managers, recruiters, or clients a concrete AI-native project management system.',
        subnodes: [
          { id: 'n9-a', title: 'Problem frame', description: 'Explain the displacement risk and project workflow pain.', outcome: 'Sharp opening.' },
          { id: 'n9-b', title: 'System walkthrough', description: 'Show inputs, controls, outputs, and review gates.', outcome: 'Visible skill.' },
          { id: 'n9-c', title: 'Proof package', description: 'Include demo, metrics, playbook, and next version.', outcome: 'Portfolio-ready artifact.' },
        ],
        concepts_left: ['Problem frame', 'System walkthrough', 'Proof package'],
        concepts_right: ['Case study', 'Demo clip', 'Metrics page'],
        skill_ids: [],
        analogy: {
          base: 'The case study is a launch page for your upgraded work.',
          role_skin: 'It proves you can redesign IT project management workflows instead of only using AI tools casually.',
          bridge_line: 'A shipped proof project changes the career signal.',
        },
        depth: 'advanced',
      },
    ],
    checkpoint: {
      title: 'AI-Native PM Portfolio',
      goal: 'Package the full workflow transformation.',
      concepts: ['Impact metrics', 'Team playbook', 'Portfolio proof'],
      problem_statement: 'Can you present a real AI-assisted project management system with evidence, controls, and repeatable team use?',
      done_criteria: 'The final case study includes problem, workflow, safeguards, demo artifact, metrics, and adoption notes.',
      time_est: '6-8 hours',
    },
  },
  glossary: [
    { term: 'Prompt contract', definition: 'A reusable instruction pattern that locks role, context, source limits, examples, and output format.', source_node_id: 'node-2', group: 'Prompt Contract System' },
    { term: 'Task exposure', definition: 'The parts of a job that AI can compress because they are repetitive, text-heavy, or pattern-based.', source_node_id: 'node-1', group: 'Threat Map Audit' },
    { term: 'Judgment zones', definition: 'Decisions that still need human context, stakeholder trust, or business accountability.', source_node_id: 'node-1', group: 'Threat Map Audit' },
    { term: 'Acceptance gate', definition: 'A pass or fail checkpoint before AI-assisted work becomes a shared project artifact.', source_node_id: 'node-3', group: 'Sprint Brief Bot' },
    { term: 'Decision log', definition: 'A concise record of choices, tradeoffs, owners, and follow-up commitments from project discussions.', source_node_id: 'node-4', group: 'Meeting Signal Capture' },
    { term: 'Evidence packet', definition: 'The source set an AI workflow is allowed to use when drafting, summarizing, or flagging risk.', source_node_id: 'node-6', group: 'Status Agent Prototype' },
    { term: 'Human review', definition: 'A deliberate approval step where the PM checks facts, risk, tone, and business sensitivity.', source_node_id: 'node-6', group: 'Status Agent Prototype' },
    { term: 'Baseline metric', definition: 'The before measurement used to prove whether the workflow improved time, quality, or control.', source_node_id: 'node-7', group: 'Impact Metrics Story' },
    { term: 'Operating ritual', definition: 'The recurring team habit that keeps an AI workflow used, reviewed, and improved.', source_node_id: 'node-8', group: 'Team Adoption Playbook' },
    { term: 'Proof package', definition: 'The artifacts, metrics, demo, and explanation that make an AI-native workflow visible to others.', source_node_id: 'node-9', group: 'Portfolio Case Study' },
  ],
};

export default function DevRoadmapPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <RoadmapView
      roadmap={sampleRoadmap}
      roleCategory="engineer"
      socTitle="Information Technology Project Managers"
    />
  );
}
