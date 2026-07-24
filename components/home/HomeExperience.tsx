'use client';

import { useCallback, useEffect, useState } from 'react';
import type { InspirationBlock } from '@/lib/arena';
import { sections, type SectionId } from '@/lib/home/sections';
import Bio from './Bio';
import ContentField from './ContentField';
import LandingNav from './LandingNav';
import NameLine from './NameLine';
import PoppyAscii from './PoppyAscii';
import StaticHome from './StaticHome';

export type TileBlocks = InspirationBlock[] | null;

/**
 * The Garden-2 landing: one still scene. Name, bio, and a scattered
 * section index on the left; the ASCII poppy right of center. Opening a
 * section washes the right side with a progressive blur and floats that
 * section's content over it — the page itself never scrolls or navigates.
 */
export default function HomeExperience() {
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

  // Clicking the open section's label closes it; clicking another
  // activatable label swaps the content in place.
  const select = useCallback((id: SectionId) => {
    if (!sections[id].activatable) return;
    setActive((current) => (current === id ? null : id));
  }, []);

  const deactivate = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') deactivate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, deactivate]);

  return (
    <>
      <div className="layout-choreo">
        <div aria-hidden className="h-dvh" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* Scene floor while a section is open: clicks anywhere outside
              the nav, the name, and the content column close it (Escape
              and the name line do the same). */}
          {active !== null && (
            <div
              aria-hidden
              className="pointer-events-auto absolute inset-0"
              onClick={deactivate}
            />
          )}
          <Bio />
          {/* Petal centroid pinned at 50%+281px / 48.9dvh (the translate is
              in canvas percentages), stems running past the fold. Sits
              below the blur, so an open section softens it to an ember. */}
          <PoppyAscii
            interactive={active === null}
            className="absolute z-[12]"
            style={{
              left: 'calc(50% + 281px)',
              top: '48.9dvh',
              transform: 'translate(-58.2%, -10.2%)',
            }}
          />
          <ContentField active={active} blocks={blocks} onClose={deactivate} />
          <LandingNav active={active} onSelect={select} />
          <NameLine active={active !== null} onHome={deactivate} />
        </div>
      </div>
      <div className="layout-static">
        <StaticHome active={active} blocks={blocks} onSelect={select} />
      </div>
    </>
  );
}
