'use client';

import { useMemo, useState, useCallback } from 'react';
import { BookOpen, ExternalLink, Link } from 'lucide-react';
import { ProjectSidePanel } from '@/components/roadmap/ProjectSidePanel';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { RoadmapGlossaryPanel } from '@/components/roadmap/RoadmapGlossaryPanel';
import { RoadmapSidePanel } from '@/components/roadmap/RoadmapSidePanel';
import roadmapStyles from '@/components/roadmap/RoadmapView.module.css';
import {
  getGlossaryTerms,
  getRoadmapItems,
  ROLE_DISPLAY,
  useIsMobile,
  type RoadmapNodeItem,
} from '@/components/roadmap/roadmapUtils';
import type { ProjectCheckpoint, Roadmap, RoleCategory } from '@/types';

interface Props {
  roadmap: Roadmap;
  roleCategory: RoleCategory;
  socTitle: string;
  shareToken?: string | null;
}

export function RoadmapView({ roadmap, roleCategory, socTitle, shareToken }: Props) {
  const [selected, setSelected] = useState<RoadmapNodeItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectCheckpoint | null>(null);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();
  const roleName = ROLE_DISPLAY[roleCategory];
  const items = useMemo(() => getRoadmapItems(roadmap), [roadmap]);
  const glossaryTerms = useMemo(() => getGlossaryTerms(roadmap, items), [roadmap, items]);
  const projectIconIndices = useMemo(() => {
    const n = items.length;
    if (n < 3) return [];

    const indices = [1]; // first build waypoint sits after node 2
    if (n >= 7) {
      indices.push(4); // second waypoint after 3 more nodes
    } else if (n >= 5) {
      indices.push(3); // compact maps: second waypoint after 2 more nodes
    }

    return indices;
  }, [items.length]);

  const handleCopyLink = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://100x-roadmap.vercel.app';
    const shareUrl = `${baseUrl}/r/${shareToken}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareToken]);

  return (
    <div className={`${roadmapStyles.scope} roadmap-page`}>
      <header className="roadmap-topbar">
        <div className="roadmap-title">
          <h2>Your AI-Native {roleName} Roadmap</h2>
          <p>{socTitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {shareToken && (
            <button
              type="button"
              onClick={handleCopyLink}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(226,191,183,0.8)', background: 'rgba(255,255,255,0.9)', color: '#5a413b', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}
            >
              <Link size={13} />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          )}
          <a className="roadmap-cta" href="https://www.100xengineers.com/" target="_blank" rel="noopener noreferrer">
            <span>Train with 100x</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </header>

      <main className="roadmap-shell">
        <div className="roadmap-heading">
          <span>90-day roadmap</span>
          <h1>How your <strong>{roleName}</strong> role upgrades</h1>
        </div>

        <div className="roadmap-utility-row">
          <button
            className="glossary-trigger"
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              setSelected(null);
              setIsGlossaryOpen(true);
            }}
          >
            <BookOpen size={15} aria-hidden="true" />
            <span>Glossary</span>
            <small>{glossaryTerms.length} key terms</small>
          </button>
        </div>


        <RoadmapCanvas
          items={items}
          selectedId={selected?.node.id ?? null}
          isMobile={isMobile}
          onSelect={setSelected}
          projectIconIndices={projectIconIndices}
        />

        {roadmap.project_checkpoints?.length ? (
          <section className="checkpoint-strip" aria-label="Project checkpoints">
            <div className="primer-strip-head">
              <span>Project cadence</span>
              <strong>Build things. Prove you can do it.</strong>
            </div>
            <div className="checkpoint-strip-grid">
              {roadmap.project_checkpoints.filter(c => c.type === 'mini_project').map((checkpoint, i) => (
                <article
                  key={checkpoint.id}
                  className="checkpoint-card checkpoint-card-mini"
                  data-clickable=""
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelected(null); setSelectedProject(checkpoint); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelected(null); setSelectedProject(checkpoint); } }}
                >
                  <div className="checkpoint-card-tag">Mini Build {i + 1}</div>
                  <h3 className="checkpoint-card-title">{checkpoint.title}</h3>
                  <p className="checkpoint-card-goal">{checkpoint.objective}</p>
                  {checkpoint.tools?.length > 0 && (
                    <div className="checkpoint-card-tools">
                      {checkpoint.tools.map(t => <span key={t} className="tool-pill">{t}</span>)}
                    </div>
                  )}
                </article>
              ))}
            </div>
            {roadmap.project_checkpoints.filter(c => c.type === 'final_project').map(checkpoint => (
              <article
                key={checkpoint.id}
                className="checkpoint-card checkpoint-card-capstone"
                data-clickable=""
                role="button"
                tabIndex={0}
                onClick={() => { setSelected(null); setSelectedProject(checkpoint); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelected(null); setSelectedProject(checkpoint); } }}
              >
                <div className="checkpoint-capstone-header">
                  <div className="checkpoint-card-tag checkpoint-card-tag-capstone">Capstone</div>
                  <h3 className="checkpoint-card-title">{checkpoint.title}</h3>
                  <p className="checkpoint-card-goal">{checkpoint.objective}</p>
                </div>
                <div className="checkpoint-capstone-body">
                  {checkpoint.success_criteria?.length > 0 && (
                    <div className="checkpoint-capstone-criteria">
                      <span>Done when</span>
                      <ul>
                        {checkpoint.success_criteria.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {checkpoint.tools?.length > 0 && (
                    <div className="checkpoint-card-tools">
                      {checkpoint.tools.map(t => <span key={t} className="tool-pill">{t}</span>)}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </main>

      <RoadmapSidePanel
        selected={selected}
        isMobile={isMobile}
        journeyAnalogy={roadmap.journey_analogy}
        onClose={() => setSelected(null)}
      />
      <ProjectSidePanel
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
      <RoadmapGlossaryPanel
        terms={glossaryTerms}
        open={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
