'use client';

import { useMemo, useState, useCallback } from 'react';
import { BookOpen, ExternalLink, Download } from 'lucide-react';
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
import type { Roadmap, RoleCategory } from '@/types';

interface Props {
  roadmap: Roadmap;
  roleCategory: RoleCategory;
  socTitle: string;
}

export function RoadmapView({ roadmap, roleCategory, socTitle }: Props) {
  const [selected, setSelected] = useState<RoadmapNodeItem | null>(null);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const isMobile = useIsMobile();
  const roleName = ROLE_DISPLAY[roleCategory];
  const items = useMemo(() => getRoadmapItems(roadmap), [roadmap]);
  const glossaryTerms = useMemo(() => getGlossaryTerms(roadmap, items), [roadmap, items]);

  const handleDownload = useCallback(() => {
    const json = JSON.stringify(roadmap, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${roleCategory}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [roleCategory, roadmap]);

  return (
    <div className={`${roadmapStyles.scope} roadmap-page`}>
      <header className="roadmap-topbar">
        <div className="roadmap-title">
          <h2>Your AI-Native {roleName} Roadmap</h2>
          <p>{socTitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(226,191,183,0.8)', background: 'rgba(255,255,255,0.9)', color: '#5a413b', fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer' }}
          >
            <Download size={13} />
            <span>Download</span>
          </button>
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
        />
      </main>

      <RoadmapSidePanel
        selected={selected}
        total={items.length}
        isMobile={isMobile}
        onClose={() => setSelected(null)}
      />
      <RoadmapGlossaryPanel
        terms={glossaryTerms}
        open={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
