'use client';

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ProgressDots } from '@/components/ui/ProgressDots';
import styles from './FunnelShell.module.css';

interface FunnelShellProps {
  current: number;
  total?: number;
  stepLabel: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  width?: 'compact' | 'default' | 'wide';
  children: ReactNode;
  footer?: ReactNode;
  surface?: boolean;
  flushSurface?: boolean;
}

export function FunnelShell({
  current,
  total = 5,
  stepLabel,
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  width = 'default',
  children,
  footer,
  surface = true,
  flushSurface = false,
}: FunnelShellProps) {
  const stageClassName = [
    styles.stage,
    width === 'compact' ? styles.stageCompact : '',
    width === 'wide' ? styles.stageWide : '',
  ].filter(Boolean).join(' ');
  const surfaceClassName = [
    styles.surface,
    flushSurface ? styles.surfaceFlush : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <strong>100x AI Risk</strong>
          <span>Displacement map</span>
        </div>
        <div className={styles.progress}>
          <ProgressDots total={total} current={current} />
        </div>
        {onBack ? (
          <button className={styles.back} type="button" onClick={onBack} aria-label={backLabel}>
            <ArrowLeft size={16} />
            <span>{backLabel}</span>
          </button>
        ) : (
          <div aria-hidden="true" />
        )}
      </header>

      <main className={stageClassName}>
        {(title || subtitle) && (
          <div className={styles.heading}>
            <span className={styles.kicker}>{stepLabel}</span>
            {title && <h1>{title}</h1>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
        {surface ? <section className={surfaceClassName}>{children}</section> : children}
      </main>

      {footer && (
        <div className={styles.bottomBar}>
          <div className={styles.bottomInner}>{footer}</div>
        </div>
      )}
    </div>
  );
}

export const funnelStyles = styles;
