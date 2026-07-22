'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InspirationBlock } from '@/lib/arena';
import { sections, type SectionId } from '@/lib/home/sections';
import { useScrollChoreography } from '@/lib/home/useScrollChoreography';
import { shuffle } from '@/lib/shuffle';
import Bio from './Bio';
import NameLine from './NameLine';
import Panel from './Panel';
import StaticHome from './StaticHome';

export type PanelState = 'idle' | 'preview' | 'active';
export type TileBlocks = (InspirationBlock | null)[] | null;

/** Random sample of `count` blocks, padded with nulls to `count`. */
function sampleBlocks(
  pool: InspirationBlock[],
  count: number,
): (InspirationBlock | null)[] {
  const out: (InspirationBlock | null)[] = shuffle([...pool]).slice(0, count);
  while (out.length < count) out.push(null);
  return out;
}

/**
 * Orchestrates the landing → hover ghost → active panel → scroll dock
 * interaction from the Garden Figma. Scroll positions never touch React
 * state; useScrollChoreography writes CSS variables the layers consume.
 */
export default function HomeExperience({
  pool,
}: {
  pool: InspirationBlock[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<SectionId | null>(null);
  const [active, setActive] = useState(false);
  // Sampled after mount so SSR and hydration both render the placeholder
  // grid — a fresh random draw on every visit, no mismatch.
  const [blocks, setBlocks] = useState<TileBlocks>(null);

  useEffect(() => {
    setBlocks(sampleBlocks(pool, sections.inspiration.tiles.length));
  }, [pool]);

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
            blocks={blocks}
            rootRef={rootRef}
            gridRef={gridRef}
            onHover={setHovered}
            onSelect={select}
          />
          <NameLine active={active} onHome={deactivate} />
        </div>
      </div>
      <div className="layout-static">
        <StaticHome active={active} blocks={blocks} onSelect={select} />
      </div>
    </div>
  );
}
