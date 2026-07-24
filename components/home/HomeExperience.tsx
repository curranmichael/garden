'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InspirationBlock } from '@/lib/arena';
import { dockScroll, panelRest } from '@/lib/home/geometry';
import { sections, type SectionId } from '@/lib/home/sections';
import { useScrollChoreography } from '@/lib/home/useScrollChoreography';
import Bio from './Bio';
import NameLine from './NameLine';
import Panel from './Panel';
import StaticHome from './StaticHome';

export type PanelState = 'idle' | 'preview' | 'active';
export type TileBlocks = InspirationBlock[] | null;

/**
 * Orchestrates the landing → hover ghost → active panel → scroll dock
 * interaction from the Garden Figma. Scroll positions never touch React
 * state; useScrollChoreography writes CSS variables the layers consume.
 */
export default function HomeExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<SectionId | null>(null);
  const [active, setActive] = useState<SectionId | null>(null);
  // Fetched after mount: the server draws a fresh random set per request,
  // and the placeholder grid renders until it arrives — no hydration risk.
  const [blocks, setBlocks] = useState<TileBlocks>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/inspiration', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((draw: InspirationBlock[] | null) => {
        if (draw?.length) setBlocks(draw);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const panelState: PanelState = active
    ? 'active'
    : hovered
      ? 'preview'
      : 'idle';
  // With nothing hovered or active, the tab geometry holds its last target
  // so the ghost fades out in place instead of sliding back to a default.
  const lastTarget = useRef<SectionId>('inspiration');
  const tabTarget: SectionId = active ?? hovered ?? lastTarget.current;
  if (tabTarget !== lastTarget.current) lastTarget.current = tabTarget;

  useScrollChoreography({ rootRef, gridRef, bioRef, active });

  const deactivate = useCallback(() => {
    window.scrollTo(0, 0);
    setActive(null);
  }, []);

  // Clicking the open section's tab closes it; clicking another activatable
  // tab swaps the panel's content in place (the panel itself doesn't move).
  // On a swap, any scroll past the dock point is inside the old content, so
  // clamp back to it — the new section always starts at its top.
  const select = useCallback(
    (id: SectionId) => {
      if (!sections[id].activatable) return;
      if (active === id) {
        deactivate();
      } else {
        if (active) {
          window.scrollTo(
            0,
            Math.min(window.scrollY, dockScroll(panelRest(window.innerHeight))),
          );
        }
        setActive(id);
      }
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

  // Hover-above-to-close only applies while the panel rests at the top;
  // the boundary check flips state at most once per crossing, so scrolling
  // still never causes per-frame React renders.
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    if (!active) {
      setAtTop(true);
      return;
    }
    const onScroll = () => setAtTop(window.scrollY < 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active]);

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
          <Bio ref={bioRef} />
          {/* Hovering above the resting panel closes it; 8px of hysteresis
              keeps grazing the tab's top edge from slamming it shut. */}
          {active !== null && atTop && (
            <div
              className="pointer-events-auto absolute inset-x-0 top-0 z-[15]"
              style={{ height: 'calc(var(--panel-top) - 8px)' }}
              onPointerEnter={deactivate}
            />
          )}
          <Panel
            state={panelState}
            tabTarget={tabTarget}
            hovered={hovered}
            active={active !== null}
            blocks={blocks}
            rootRef={rootRef}
            gridRef={gridRef}
            onHover={setHovered}
            onSelect={select}
          />
          <NameLine active={active !== null} onHome={deactivate} />
        </div>
      </div>
      <div className="layout-static">
        <StaticHome active={active} blocks={blocks} onSelect={select} />
      </div>
    </div>
  );
}
