import { cn } from '@/lib/cn';
import { SECTION_ORDER, type SectionId } from '@/lib/home/sections';
import Bio from './Bio';
import NameLine from './NameLine';
import PoppyAscii from './PoppyAscii';
import SectionLabel from './SectionLabel';

interface StaticHomeProps {
  active: SectionId | null;
  onSelect: (id: SectionId) => void;
  onClose: () => void;
}

/**
 * The mini scene for phones and prefers-reduced-motion: the desktop still
 * re-planted in flow — name and bio up top, nav labels scattered down the
 * left, the poppy right of center and cropped by the screen edge with its
 * stems running past the fold. Placement lives in the --nav-*, --poppy-*
 * and --scene-min-h variables (globals.css), which mirror the
 * choreographed scene at desktop widths. Native scrolling reaches the
 * stem tips; sections open in the SectionOverlay above this scene.
 */
export default function StaticHome({
  active,
  onSelect,
  onClose,
}: StaticHomeProps) {
  return (
    // overflow-clip on both axes: clip (unlike hidden) creates no scroll
    // container, crops the poppy at the right screen edge, and cuts its
    // bleed canvases off at the scene's bottom so the document ends at
    // the stem tips. minHeight is explicit because every child is
    // absolutely positioned.
    <main
      inert={active !== null}
      className="relative overflow-clip"
      style={{ minHeight: 'var(--scene-min-h)' }}
    >
      {/* The header sits where the full-screen veil is at its weakest
          (the ramp only reaches full blur further down), so lightly
          blurred name/bio would collide with the overlay's first rows —
          fade them out under an open section instead. Desktop never has
          this problem: there the header lives outside the veil. The
          poppy and nav labels stay as the ember backdrop; they sit in
          the veil's fully washed zone. */}
      <div
        className={cn(
          'transition-opacity duration-[350ms] ease-out motion-reduce:transition-none',
          active !== null && 'opacity-0',
        )}
      >
        <NameLine active={active !== null} onHome={onClose} />
        <Bio />
      </div>
      <PoppyAscii
        interactive={active === null}
        className="absolute z-[12]"
        style={{
          left: 'var(--poppy-left)',
          top: 'var(--poppy-top)',
          height: 'var(--poppy-h)',
          transform: 'var(--poppy-shift)',
        }}
      />
      {/* Unlike the choreographed layer (pointer-transparent at its root),
          this wrapper must pass taps through itself — an inset-0 nav
          would otherwise swallow every tap, including the poppy's. */}
      <nav
        aria-label="Sections"
        className="pointer-events-none absolute inset-0 z-[13]"
      >
        {SECTION_ORDER.map((id) => (
          <SectionLabel
            key={id}
            id={id}
            current={active === id}
            onSelect={onSelect}
            className="pointer-events-auto absolute"
            style={{
              top: `var(--nav-top-${id})`,
              left: `calc(var(--gutter) + var(--inset) + var(--nav-indent-${id}))`,
            }}
          />
        ))}
      </nav>
    </main>
  );
}
