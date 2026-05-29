'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Hammer, X } from 'lucide-react';
import type { ProjectCheckpoint } from '@/types';

const FILE_SPLIT_RE = /(\b[\w-]+\.(?:py|ts|js|json|md|txt|yaml|yml|sh|env)\b)/g;
const FILE_TEST_RE = /^\b[\w-]+\.(?:py|ts|js|json|md|txt|yaml|yml|sh|env)\b$/;

function highlightFilenames(text: string): React.ReactNode {
  const parts = text.split(FILE_SPLIT_RE);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    FILE_TEST_RE.test(part) ? <em key={i} className="task-filename">{part}</em> : part
  );
}

function renderInlineCode(text: string): React.ReactNode {
  const out: React.ReactNode[] = [];
  const re = /`([^`]+)`/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={k++}>{highlightFilenames(text.slice(last, m.index))}</span>);
    out.push(<code key={k++} className="task-inline-code">{m[1]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={k++}>{highlightFilenames(text.slice(last))}</span>);
  return out.length === 1 ? out[0] : <>{out}</>;
}

const SHELL_RE = /^(pip install|pip3 install|npm install|npx |pnpm |yarn |python |python3 |pytest |curl |node |bash |sh |export |mkdir |cd |touch |docker )/i;

function splitTaskParts(task: string): { label: string; cmd: string | null; verify: string | null } {
  // Extract verify block first
  const verifyM = task.match(/^([\s\S]+?)\s+—\s+verify(?:\s+with)?:?\s+([\s\S]+)$/i);
  const body = verifyM ? verifyM[1] : task;
  const verify = verifyM ? verifyM[2] : null;

  // Detect inline shell command after ": " — only when text after colon is a shell cmd
  const colonIdx = body.indexOf(': ');
  if (colonIdx !== -1) {
    const after = body.slice(colonIdx + 2).trim();
    if (SHELL_RE.test(after)) {
      return { label: body.slice(0, colonIdx), cmd: after, verify };
    }
  }

  return { label: body, cmd: null, verify };
}

function TaskItem({ task, index }: { task: string; index: number }) {
  const { label, cmd, verify } = splitTaskParts(task);
  return (
    <li className="project-task-item">
      <span className="project-task-num">{index + 1}</span>
      <div className="task-body">
        <div className="task-desc">{renderInlineCode(label)}</div>
        {cmd && (
          <div className="task-verify-block task-run-block">
            <span className="task-verify-label">run</span>
            <code className="task-verify-code">{cmd}</code>
          </div>
        )}
        {verify && (
          <div className="task-verify-block">
            <span className="task-verify-label">verify</span>
            <code className="task-verify-code">{verify}</code>
          </div>
        )}
      </div>
    </li>
  );
}

function CoreItem({ text }: { text: string }) {
  const parts = text.split(FILE_SPLIT_RE);
  if (parts.length === 1) return <li>{text}</li>;
  return (
    <li>
      {parts.map((p, i) => FILE_TEST_RE.test(p) ? <code key={i} className="core-filename">{p}</code> : p)}
    </li>
  );
}

interface ProjectSidePanelProps {
  project: ProjectCheckpoint | null;
  onClose: () => void;
}

export function ProjectSidePanel({ project, onClose }: ProjectSidePanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            className="roadmap-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            className="roadmap-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            aria-modal="true"
            role="dialog"
          >
            <button className="panel-close" type="button" aria-label="Close panel" onClick={onClose}>
              <X size={17} />
            </button>

            <div className="panel-body">
              <section className="panel-section panel-explanation">
                <div className="section-title">
                  <Hammer size={13} aria-hidden="true" />
                  {project.type === 'mini_project' ? 'Mini Build' : 'Capstone'}
                </div>
                <h3>{project.title}</h3>
              </section>

              {project.objective && (
                <section className="panel-section">
                  <div className="section-title">Objective</div>
                  <p className="panel-lede">{project.objective}</p>
                </section>
              )}

              {project.scenario && (
                <section className="panel-section">
                  <div className="section-title">Scenario</div>
                  <p className="panel-lede">{project.scenario}</p>
                </section>
              )}

              {project.tasks.length > 0 && (
                <section className="panel-section project-tasks-section">
                  <div className="section-title">Tasks</div>
                  <ol className="project-tasks-list">
                    {project.tasks.map((task, i) => (
                      <TaskItem key={i} task={task} index={i} />
                    ))}
                  </ol>
                </section>
              )}

              {project.what_youll_learn.length > 0 && (
                <section className="panel-section">
                  <div className="section-title">What You&apos;ll Learn</div>
                  <ul className="project-bullet-list">
                    {project.what_youll_learn.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {project.core_components.length > 0 && (
                <section className="panel-section">
                  <div className="section-title">Core Components</div>
                  <ul className="project-spec-list">
                    {project.core_components.map((item, i) => (
                      <CoreItem key={i} text={item} />
                    ))}
                  </ul>
                </section>
              )}

              {project.success_criteria.length > 0 && (
                <section className="panel-section">
                  <div className="section-title">Success Criteria</div>
                  <ul className="project-criteria-list">
                    {project.success_criteria.map((item, i) => (
                      <li key={i}>
                        <span className="project-criteria-check" aria-hidden="true">&#10003;</span>
                        <span>{renderInlineCode(item)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {project.deliverables.length > 0 && (
                <section className="panel-section">
                  <div className="section-title">Deliverables</div>
                  <ul className="project-spec-list">
                    {project.deliverables.map((item, i) => (
                      <CoreItem key={i} text={item} />
                    ))}
                  </ul>
                </section>
              )}

              {project.bonus_challenges && project.bonus_challenges.length > 0 && (
                <section className="panel-section">
                  <div className="section-title">Bonus Challenges</div>
                  <ul className="project-bullet-list">
                    {project.bonus_challenges.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {project.reflection_questions && project.reflection_questions.length > 0 && (
                <section className="panel-section">
                  <div className="section-title">Reflection Questions</div>
                  <ul className="project-bullet-list">
                    {project.reflection_questions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {project.tools.length > 0 && (
                <div className="tool-pills">
                  {project.tools.map(t => <span className="tool-pill" key={t}>{t}</span>)}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
