import { getCanonicalTerm } from './canonical-ai-terms.mjs';

export const ROADMAP_AUDIENCES = [
  'marketer',
  'designer',
  'sales',
  'founder_pm',
  'engineer',
  'student',
];

export const ISSUE_CODES = {
  ROADMAP_NOT_OBJECT: 'roadmap_not_object',
  MISSING_STEP: 'missing_step',
  STEP_NODES_INVALID: 'step_nodes_invalid',
  DUPLICATE_NODE_ID: 'duplicate_node_id',
  DUPLICATE_NODE_TITLE: 'duplicate_node_title',
  MISSING_NODE_TITLE: 'missing_node_title',
  GENERIC_NODE_TITLE: 'generic_node_title',
  EMPTY_SKILL_IDS: 'empty_skill_ids',
  MISSING_FLOW_FIELDS: 'missing_flow_fields',
  FLOW_ORDER_INVALID: 'flow_order_invalid',
  MISSING_DEPTH_FIELDS: 'missing_depth_fields',
  DEPTH_LEVEL_INVALID: 'depth_level_invalid',
  MISSING_PANEL: 'missing_panel',
  PANEL_ATOM_COUNT_INVALID: 'panel_atom_count_invalid',
  PANEL_ATOM_MISSING_FIELD: 'panel_atom_missing_field',
  PANEL_ATOM_ORDER_INVALID: 'panel_atom_order_invalid',
  NON_TECH_CODE_TOOL: 'non_tech_code_tool',
  ANALOGY_MAPPING_COUNT_LOW: 'analogy_mapping_count_low',
  CHECKPOINT_INCOMPLETE: 'checkpoint_incomplete',
  TERMINOLOGY_PRIMER_MISSING: 'terminology_primer_missing',
  TERMINOLOGY_TERM_COUNT_LOW: 'terminology_term_count_low',
  TERMINOLOGY_TERM_INCOMPLETE: 'terminology_term_incomplete',
  TERMINOLOGY_SURFACE_TERM: 'terminology_surface_term',
  TERMINOLOGY_TERM_NOT_USED: 'terminology_term_not_used',
  TECH_TERM_MISSING_FROM_PRIMER: 'tech_term_missing_from_primer',
  TERMINOLOGY_DEFINITION_INVALID: 'terminology_definition_invalid',
  BANNED_COPY_PATTERN: 'banned_copy_pattern',
  PROJECT_CADENCE_INVALID: 'project_cadence_invalid',
  FALLBACK_OR_REPAIR_MARKER: 'fallback_or_repair_marker',
};

// These codes mean the roadmap is structurally broken and cannot be rendered.
// All other codes are quality warnings — logged but don't block delivery.
const BLOCKING_CODES = new Set([
  'roadmap_not_object',
  'missing_step',
  'step_nodes_invalid',
  'duplicate_node_id',
  'missing_node_title',
  'missing_panel',
  'fallback_or_repair_marker',
]);

const STEP_KEYS = ['step1', 'step2', 'step3'];
const GENERIC_NODE_TITLES = new Set([
  'Practice and Apply',
  'Clear Instructions',
  'Tool Selection',
  'Workflow Design',
  'Quality Control',
  'Automation Systems',
  'Capstone Project',
]);

const SURFACE_TERMS = new Set([
  'AI Content Creation',
  'Workflow Automation',
  'Content Creation',
  'Email Campaign',
  'Workflow',
]);

const TECH_TERMS = [
  'SPOARA',
  'ReAct',
  '95% rule',
  'API',
  'RAG',
  'MCP',
  'AI agent',
  'trigger',
  'token',
  'context window',
  'LLM',
  'embedding',
  'fine-tuning',
];

const NON_TECH_AUDIENCES = new Set(['marketer', 'designer', 'sales', 'founder_pm', 'student']);
const CODE_TOOL_PATTERN = /\b(API|SDK|server|backend|FastAPI|Docker|CLI|Python|SQL|Postgres|Supabase|LangChain|endpoint|repository|database)\b/i;
const DEPTH_LEVELS = new Set(['scan', 'practice', 'build', 'operate']);
const REQUIRED_ATOM_FIELDS = ['order', 'depth_level', 'depth_reason', 'explanation', 'learner_action', 'output', 'time_est'];
const CHECKPOINT_FIELDS = ['title', 'scenario', 'artifact_to_create', 'steps', 'done_when', 'tools', 'time_est', 'confidence_check'];
const PROJECT_FIELDS = ['id', 'type', 'after_node_ids', 'title', 'goal', 'description', 'concepts_checked', 'artifact_to_build', 'steps', 'done_when', 'tools', 'time_est'];
const TERMINOLOGY_FIELDS = ['term', 'appears_in_node_ids', 'plain_definition', 'role_example', 'analogy_hook', 'why_it_matters'];
const BANNED_EXPLANATION_START = /^(learn|learn how|you will learn|understand|understand the)\b/i;
const BANNED_GENERIC_COPY = /\b(practice this skill|apply your knowledge|work through the exercise|complete the task|capstone project)\b/i;

function text(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(text).join(' ');
  if (typeof value === 'object') return Object.values(value).map(text).join(' ');
  return String(value);
}

function hasMeaningfulValue(value) {
  return Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim().length > 0 : value != null;
}

function addIssue(issues, code, message, path, details = {}) {
  issues.push({ code, severity: BLOCKING_CODES.has(code) ? 'blocking' : 'warning', message, path, ...details });
}

function validateCopyQuality(value, path, issues) {
  if (typeof value !== 'string') return;
  const trimmed = value.trim();
  if (BANNED_EXPLANATION_START.test(trimmed)) {
    addIssue(issues, ISSUE_CODES.BANNED_COPY_PATTERN, 'Copy starts with a banned weak learning phrase.', path, {
      value: trimmed.slice(0, 120),
    });
  }
  if (BANNED_GENERIC_COPY.test(trimmed)) {
    addIssue(issues, ISSUE_CODES.BANNED_COPY_PATTERN, 'Copy contains a banned generic learning phrase.', path, {
      value: trimmed.slice(0, 120),
    });
  }
}

function collectNodes(roadmap, issues) {
  const nodes = [];
  for (const stepKey of STEP_KEYS) {
    const step = roadmap?.[stepKey];
    if (!step) {
      addIssue(issues, ISSUE_CODES.MISSING_STEP, `${stepKey} is missing.`, stepKey);
      continue;
    }
    if (!Array.isArray(step.nodes)) {
      addIssue(issues, ISSUE_CODES.STEP_NODES_INVALID, `${stepKey}.nodes must be an array.`, `${stepKey}.nodes`);
      continue;
    }
    step.nodes.forEach((node, index) => nodes.push({ node, stepKey, index }));
  }
  return nodes;
}

function validatePanel(node, path, issues) {
  if (!node.panel || typeof node.panel !== 'object') {
    addIssue(issues, ISSUE_CODES.MISSING_PANEL, 'Node is missing launch panel payload.', `${path}.panel`, {
      node_id: node.id,
      title: node.title ?? node.name_plain,
    });
    return;
  }

  const left = node.panel?.expansion?.left_items;
  const right = node.panel?.expansion?.right_items;
  const expectedAtomCount = (node.skill_ids?.length ?? 4) + 1;
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== expectedAtomCount || right.length !== expectedAtomCount) {
    addIssue(issues, ISSUE_CODES.PANEL_ATOM_COUNT_INVALID, `Panel expansion must have exactly ${expectedAtomCount} atoms per side.`, `${path}.panel.expansion`, {
      left_count: Array.isArray(left) ? left.length : null,
      right_count: Array.isArray(right) ? right.length : null,
      expected: expectedAtomCount,
    });
  }

  const atoms = [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])];
  const orders = atoms.map(atom => atom?.order).filter(order => Number.isInteger(order));
  const expectedOrders = Array.from({ length: atoms.length }, (_, index) => index + 1);
  const sequential = orders.length === atoms.length && expectedOrders.every(order => orders.includes(order));
  if (atoms.length > 0 && !sequential) {
    addIssue(issues, ISSUE_CODES.PANEL_ATOM_ORDER_INVALID, 'Panel atom order must be sequential without gaps or duplicates.', `${path}.panel.expansion`);
  }

  atoms.forEach((atom, atomIndex) => {
    for (const field of REQUIRED_ATOM_FIELDS) {
      if (!hasMeaningfulValue(atom?.[field])) {
        addIssue(issues, ISSUE_CODES.PANEL_ATOM_MISSING_FIELD, `Panel atom is missing ${field}.`, `${path}.panel.atom[${atomIndex}].${field}`, {
          node_id: node.id,
          atom_id: atom?.id,
        });
      }
    }
    if (hasMeaningfulValue(atom?.depth_level) && !DEPTH_LEVELS.has(atom.depth_level)) {
      addIssue(issues, ISSUE_CODES.DEPTH_LEVEL_INVALID, 'Panel atom depth_level must be scan, practice, build, or operate.', `${path}.panel.atom[${atomIndex}].depth_level`, {
        node_id: node.id,
        atom_id: atom?.id,
        depth_level: atom.depth_level,
      });
    }
    validateCopyQuality(atom?.explanation, `${path}.panel.atom[${atomIndex}].explanation`, issues);
    validateCopyQuality(atom?.learner_action, `${path}.panel.atom[${atomIndex}].learner_action`, issues);
    validateCopyQuality(atom?.depth_reason, `${path}.panel.atom[${atomIndex}].depth_reason`, issues);
  });

  const checkpoint = node.panel?.checkpoint;
  for (const field of CHECKPOINT_FIELDS) {
    if (!hasMeaningfulValue(checkpoint?.[field])) {
      addIssue(issues, ISSUE_CODES.CHECKPOINT_INCOMPLETE, `Node checkpoint is missing ${field}.`, `${path}.panel.checkpoint.${field}`, {
        node_id: node.id,
      });
    }
  }
}

function validateTerminology(roadmap, bodyText, issues) {
  const primer = roadmap.terminology_primer;
  const terms = primer?.terms;
  if (!primer || !Array.isArray(terms)) {
    addIssue(issues, ISSUE_CODES.TERMINOLOGY_PRIMER_MISSING, 'Roadmap is missing terminology_primer.terms.', 'terminology_primer');
    return new Set();
  }

  if (terms.length < 5) {
    addIssue(issues, ISSUE_CODES.TERMINOLOGY_TERM_COUNT_LOW, 'Terminology primer must include at least 5 terms.', 'terminology_primer.terms', {
      count: terms.length,
    });
  }

  const primerTerms = new Set();
  for (const [index, entry] of terms.entries()) {
    const term = entry?.term;
    if (term) primerTerms.add(term.toLowerCase());
    for (const field of TERMINOLOGY_FIELDS) {
      if (!hasMeaningfulValue(entry?.[field])) {
        addIssue(issues, ISSUE_CODES.TERMINOLOGY_TERM_INCOMPLETE, `Terminology term is missing ${field}.`, `terminology_primer.terms[${index}].${field}`, { term });
      }
    }
    if (SURFACE_TERMS.has(term)) {
      addIssue(issues, ISSUE_CODES.TERMINOLOGY_SURFACE_TERM, 'Terminology primer defines a self-evident surface term.', `terminology_primer.terms[${index}]`, { term });
    }
    if (term && !bodyText.toLowerCase().includes(term.toLowerCase())) {
      addIssue(issues, ISSUE_CODES.TERMINOLOGY_TERM_NOT_USED, 'Terminology term does not appear later in roadmap content.', `terminology_primer.terms[${index}]`, { term });
    }
    const canonical = term ? getCanonicalTerm(term) : null;
    if (canonical) {
      const definition = entry?.plain_definition ?? '';
      for (const phrase of canonical.required_phrases ?? []) {
        if (!definition.includes(phrase)) {
          addIssue(issues, ISSUE_CODES.TERMINOLOGY_DEFINITION_INVALID, 'Terminology definition is missing required canonical phrase.', `terminology_primer.terms[${index}].plain_definition`, { term, phrase });
        }
      }
      for (const phrase of canonical.forbidden_phrases ?? []) {
        if (definition.includes(phrase)) {
          addIssue(issues, ISSUE_CODES.TERMINOLOGY_DEFINITION_INVALID, 'Terminology definition contains a known wrong phrase.', `terminology_primer.terms[${index}].plain_definition`, { term, phrase });
        }
      }
    }
  }
  return primerTerms;
}

function validateProjectCadence(roadmap, nodeCount, issues) {
  const projects = roadmap.project_checkpoints;
  if (!Array.isArray(projects)) {
    addIssue(issues, ISSUE_CODES.PROJECT_CADENCE_INVALID, 'Roadmap is missing project_checkpoints.', 'project_checkpoints');
    return;
  }

  const miniProjects = projects.filter(project => project?.type === 'mini_project');
  const finalProjects = projects.filter(project => project?.type === 'final_project');
  if (nodeCount >= 6 && nodeCount <= 8 && (miniProjects.length !== 2 || finalProjects.length !== 1)) {
    addIssue(issues, ISSUE_CODES.PROJECT_CADENCE_INVALID, 'A 6-8 node roadmap needs 2 mini projects and 1 final project.', 'project_checkpoints', {
      mini_project_count: miniProjects.length,
      final_project_count: finalProjects.length,
    });
  }

  projects.forEach((project, index) => {
    for (const field of PROJECT_FIELDS) {
      if (!hasMeaningfulValue(project?.[field])) {
        addIssue(issues, ISSUE_CODES.PROJECT_CADENCE_INVALID, `Project checkpoint is missing ${field}.`, `project_checkpoints[${index}].${field}`);
      }
    }
    if (project?.type === 'mini_project') {
      const attachedCount = Array.isArray(project.after_node_ids) ? project.after_node_ids.length : 0;
      if (attachedCount < 2 || attachedCount > 3) {
        addIssue(issues, ISSUE_CODES.PROJECT_CADENCE_INVALID, 'Mini project must attach after 2-3 completed nodes.', `project_checkpoints[${index}].after_node_ids`, {
          attached_count: attachedCount,
        });
      }
    }
  });
}

function sameStringArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && expected.every((value, index) => actual[index] === value);
}

function primerCoversTerm(primerTerms, term) {
  const normalized = term.toLowerCase();
  return primerTerms.has(normalized)
    || (normalized === 'trigger' && primerTerms.has('automation trigger'));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bodyContainsTerm(bodyText, term) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(term.toLowerCase())}([^a-z0-9]|$)`, 'i').test(bodyText);
}

export function validateRoadmap(roadmap, options = {}) {
  const audience = options.audience ?? 'unknown';
  const issues = [];

  if (!roadmap || typeof roadmap !== 'object' || Array.isArray(roadmap)) {
    addIssue(issues, ISSUE_CODES.ROADMAP_NOT_OBJECT, 'Roadmap must be an object.', '');
    return { valid: false, issues };
  }

  const nodes = collectNodes(roadmap, issues);
  const seenIds = new Map();
  const seenTitles = new Map();

  for (const { node, stepKey, index } of nodes) {
    const path = `${stepKey}.nodes[${index}]`;
    const nodeId = node?.id;
    const title = node?.title ?? node?.name_plain;
    const searchable = text(node);

    if (!hasMeaningfulValue(node?.title)) {
      addIssue(issues, ISSUE_CODES.MISSING_NODE_TITLE, 'Node must include launch schema title.', `${path}.title`, {
        node_id: nodeId,
        legacy_title: node?.name_plain,
      });
    }

    if (nodeId) {
      if (seenIds.has(nodeId)) {
        addIssue(issues, ISSUE_CODES.DUPLICATE_NODE_ID, 'Duplicate node id.', `${path}.id`, {
          node_id: nodeId,
          first_path: seenIds.get(nodeId),
        });
      } else {
        seenIds.set(nodeId, `${path}.id`);
      }
    }

    if (title) {
      const normalizedTitle = title.toLowerCase();
      if (seenTitles.has(normalizedTitle)) {
        addIssue(issues, ISSUE_CODES.DUPLICATE_NODE_TITLE, 'Duplicate node title.', `${path}.title`, {
          title,
          first_path: seenTitles.get(normalizedTitle),
        });
      } else {
        seenTitles.set(normalizedTitle, `${path}.title`);
      }
      if (GENERIC_NODE_TITLES.has(title)) {
        addIssue(issues, ISSUE_CODES.GENERIC_NODE_TITLE, 'Generic or fallback node title is banned.', `${path}.title`, { title });
      }
    }

    if (!Array.isArray(node?.skill_ids) || node.skill_ids.length === 0) {
      addIssue(issues, ISSUE_CODES.EMPTY_SKILL_IDS, 'Node must have non-empty skill_ids.', `${path}.skill_ids`, {
        node_id: nodeId,
        title,
      });
    }

    if (!Array.isArray(node?.prerequisite_node_ids) || !Array.isArray(node?.unlocks_node_ids)) {
      addIssue(issues, ISSUE_CODES.MISSING_FLOW_FIELDS, 'Node must declare prerequisite_node_ids and unlocks_node_ids.', path, {
        node_id: nodeId,
        title,
      });
    }

    if (!hasMeaningfulValue(node?.depth_level) || !hasMeaningfulValue(node?.depth_reason)) {
      addIssue(issues, ISSUE_CODES.MISSING_DEPTH_FIELDS, 'Node must include depth_level and depth_reason.', path, {
        node_id: nodeId,
        title,
      });
    }
    if (hasMeaningfulValue(node?.depth_level) && !DEPTH_LEVELS.has(node.depth_level)) {
      addIssue(issues, ISSUE_CODES.DEPTH_LEVEL_INVALID, 'Node depth_level must be scan, practice, build, or operate.', `${path}.depth_level`, {
        node_id: nodeId,
        title,
        depth_level: node.depth_level,
      });
    }

    validatePanel(node, path, issues);

    if (NON_TECH_AUDIENCES.has(audience) && CODE_TOOL_PATTERN.test(searchable)) {
      addIssue(issues, ISSUE_CODES.NON_TECH_CODE_TOOL, 'Non-tech audience received code/API/server tooling.', path, {
        audience,
        title,
      });
    }

    if (/repair|fallback|Practice and Apply/i.test(`${nodeId ?? ''} ${title ?? ''} ${searchable}`)) {
      addIssue(issues, ISSUE_CODES.FALLBACK_OR_REPAIR_MARKER, 'Roadmap contains fallback or repair marker.', path, {
        node_id: nodeId,
        title,
      });
    }
  }

  nodes.forEach(({ node, stepKey, index }, orderedIndex) => {
    if (!Array.isArray(node?.prerequisite_node_ids) || !Array.isArray(node?.unlocks_node_ids)) return;
    const prevId = nodes[orderedIndex - 1]?.node?.id;
    const nextId = nodes[orderedIndex + 1]?.node?.id;
    const expectedPrerequisites = prevId ? [prevId] : [];
    const expectedUnlocks = nextId ? [nextId] : [];

    if (!sameStringArray(node.prerequisite_node_ids, expectedPrerequisites)) {
      addIssue(issues, ISSUE_CODES.FLOW_ORDER_INVALID, 'Node prerequisite flow does not match roadmap sequence.', `${stepKey}.nodes[${index}].prerequisite_node_ids`, {
        node_id: node.id,
        expected: expectedPrerequisites,
        actual: node.prerequisite_node_ids,
      });
    }
    if (!sameStringArray(node.unlocks_node_ids, expectedUnlocks)) {
      addIssue(issues, ISSUE_CODES.FLOW_ORDER_INVALID, 'Node unlock flow does not match roadmap sequence.', `${stepKey}.nodes[${index}].unlocks_node_ids`, {
        node_id: node.id,
        expected: expectedUnlocks,
        actual: node.unlocks_node_ids,
      });
    }
  });

  const bodyText = STEP_KEYS.map(stepKey => text(roadmap[stepKey])).join(' ');
  const primerTerms = validateTerminology(roadmap, bodyText, issues);
  validateProjectCadence(roadmap, nodes.length, issues);

  for (const term of TECH_TERMS) {
    if (bodyContainsTerm(bodyText, term) && !primerCoversTerm(primerTerms, term)) {
      addIssue(issues, ISSUE_CODES.TECH_TERM_MISSING_FROM_PRIMER, 'Technical term appears without terminology primer coverage.', 'terminology_primer.terms', {
        term,
      });
    }
  }

  const blocking = issues.filter(i => i.severity === 'blocking');
  const warnings = issues.filter(i => i.severity === 'warning');
  return { valid: blocking.length === 0, blocking, warnings, issues };
}
