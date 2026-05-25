import type { RoleCategory, SkillCluster } from '../types';

const ALL_ROLES: RoleCategory[] = ['pm', 'designer', 'marketer', 'sales', 'engineer', 'student'];

export const SKILL_CLUSTERS: SkillCluster[] = [
  {
    id: 'C1A',
    name: 'Create AI-generated content at scale',
    can_do: 'Ship image + video + voice content without a production team',
    skill_ids: ['S1.1', 'S1.2', 'S1.4', 'S1.3', 'S1.5', 'S1.6', 'S1.7', 'S1.8'],
    module: 'm1',
    roles: ['designer', 'marketer', 'student'],
    checkpoint_hint: 'Produce a full AI content piece: image + video + voiceover for one product or campaign',
  },
  {
    id: 'C2A',
    name: 'Map and automate your work with AI',
    can_do: 'Replace manual repetitive tasks with reliable AI-powered workflows',
    skill_ids: ['S2.1', 'S2.2', 'S2.11'],
    module: 'm2',
    roles: ALL_ROLES,
    checkpoint_hint: 'Build 3 reusable AI prompt templates for your top weekly tasks and document the workflow',
  },
  {
    id: 'C2B',
    name: 'Connect AI to your tools and products',
    can_do: 'Wire Claude and OpenAI APIs directly into your products and internal tools',
    skill_ids: ['S2.3', 'S2.7', 'S2.8'],
    module: 'm2',
    roles: ['engineer', 'pm', 'student'],
    checkpoint_hint: 'Ship a working FastAPI + Claude integration connected to one internal tool or data source',
  },
  {
    id: 'C2C',
    name: 'Make AI know your data and documents',
    can_do: 'Give AI instant access to your company\'s documents, wikis, and databases',
    skill_ids: ['S2.4', 'S2.5', 'S2.6'],
    module: 'm2',
    roles: ['engineer', 'pm', 'sales', 'student'],
    checkpoint_hint: 'Build a RAG chatbot that answers questions from a real document set (company wiki, product docs)',
  },
  {
    id: 'C2D',
    name: 'Fine-tune and optimize AI at scale',
    can_do: 'Cut AI costs and improve output quality with fine-tuned models',
    skill_ids: ['S2.9', 'S2.10'],
    module: 'm2',
    roles: ['engineer', 'student'],
    checkpoint_hint: 'Fine-tune a base model on a custom dataset, evaluate output quality vs base model',
  },
  {
    id: 'C3A',
    name: 'Build autonomous AI agents',
    can_do: 'Deploy AI agents that complete multi-step tasks without human intervention',
    skill_ids: ['S3.1', 'S3.3', 'S3.5'],
    module: 'm3',
    roles: ['engineer', 'pm', 'student'],
    checkpoint_hint: 'Build an autonomous agent that completes a real multi-step task without human intervention',
  },
  {
    id: 'C3B',
    name: 'Automate complex workflows',
    can_do: 'Replace manual workflows with trigger-based automation that runs itself',
    skill_ids: ['S3.2', 'S3.4', 'S3.6'],
    module: 'm3',
    roles: ALL_ROLES,
    checkpoint_hint: 'Automate one end-to-end workflow using n8n that runs on a trigger and requires zero manual steps',
  },
];
