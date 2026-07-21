'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sections, type SectionId } from '@/lib/home/sections';
import { useScrollChoreography } from '@/lib/home/useScrollChoreography';
import Bio from './Bio';
import NameLine from './NameLine';
import Panel from './Panel';
import StaticHome from './StaticHome';

export type PanelState = 'idle' | 'preview' | 'active';

/**
 * Orchestrates the landing → hover ghost → active panel → scroll dock
 * interaction from the Garden Figma. Scroll positions never touch React
 * state; useScrollChoreography writes CSS variables the layers consume.
 */
export default function HomeExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<SectionId | null>(null);
  const [active, setActive] = useState(false);

  const panelState: PanelState = active
    ? 'active'
    : hovered
      ? 'preview'
      : 'idle';
  const tabTarget: SectionId = active ? 'inspiration' : (hovered ?? 'inspiration');

  useScrollChoreography({ rootRef, gridRef, active });

  const deactivate = useCallback(() => {
    window.scrollTo(0, 0);
    setActive(false);
  }, []);

  const select = useCallback(
    (id: SectionId) => {
      if (!sections[id].activatable) return;
      if (active) deactivate();
      else setActive(true);
    },
    [active, deactivate],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') deactivate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, deactivate]);

  return (
    <div ref={rootRef}>
      <div className="layout-choreo">
        <div
          aria-hidden
          style={{
            height: active ? 'calc(100dvh + var(--scroll-range))' : '100dvh',
          }}
        />
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <Bio />
          <Panel
            state={panelState}
            tabTarget={tabTarget}
            hovered={hovered}
            active={active}
            rootRef={rootRef}
            gridRef={gridRef}
            onHover={setHovered}
            onSelect={select}
          />
          <NameLine active={active} onHome={deactivate} />
        </div>
      </div>
      <div className="layout-static">
        <StaticHome active={active} onSelect={select} />
      </div>
    </div>
  );
}
