import { useEffect, useRef, useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';
import { sections, type SectionId } from '@/lib/home/sections';
import BookTile from './BookTile';
import DiaryList from './DiaryList';
import type { ShelfBooks, TileBlocks } from './HomeExperience';
import ProgressiveBlur from './ProgressiveBlur';
import Tile from './Tile';

/**
 * The static layout's section surface: the desktop grammar adapted to a
 * phone. Opening a section washes the whole mini scene with a progressive
 * blur and floats the ghost content over it — veil first, content fading
 * in on its tail, the reverse on closing (ContentField's choreography,
 * turned vertical and full-screen). Content scrolls inside this layer
 * while the page locks underneath (html.overlay-open, globals.css).
 *
 * Closing: the × in the top margin band, a tap on any of the layer's own
 * padding (the scroll layer is its own scrim — a separate one underneath
 * could never receive taps), the open section's label, or Escape via
 * HomeExperience.
 */
const MARGIN = 'var(--gutter) + var(--inset)';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (onChange: () => void) => {
  const mql = window.matchMedia(REDUCED_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};
/** True under prefers-reduced-motion: the veil and content then appear
 *  and leave instantly instead of fading. */
const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );

export default function SectionOverlay({
  active,
  blocks,
  books,
  onClose,
}: {
  active: SectionId | null;
  blocks: TileBlocks;
  books: ShelfBooks;
  onClose: () => void;
}) {
  // Holds the last open section while fading out, so the content doesn't
  // vanish mid-transition.
  const lastRef = useRef<SectionId>('inspiration');
  const shown = active ?? lastRef.current;
  if (shown !== lastRef.current) lastRef.current = shown;

  const scrollRef = useRef<HTMLDivElement>(null);
  // A section always opens at its top, including swaps between sections.
  useEffect(() => {
    if (active) scrollRef.current?.scrollTo(0, 0);
  }, [active]);

  const open = active !== null;
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('overlay-open');
    return () => document.documentElement.classList.remove('overlay-open');
  }, [open]);

  return (
    <>
      {/* Fewer, softer layers than the desktop veil: each one blurs its
          full box before masking, and four full-viewport backdrop passes
          are what a phone GPU can absorb through the radius fade. */}
      <ProgressiveBlur
        direction="to bottom"
        maxBlur={24}
        layerCount={4}
        ramp={0.35}
        lead={80}
        visible={open}
        fadeDuration={reduced ? 0 : open ? 450 : 350}
        fadeDelay={reduced ? 0 : open ? 0 : 120}
        className="fixed inset-0 z-[14]"
      />
      <div
        ref={scrollRef}
        inert={!open}
        role="dialog"
        aria-modal="true"
        aria-label={sections[shown].label}
        // Taps on the layer's own padding bands close; taps on rows and
        // tiles land on children and don't. Scroll flicks never fire
        // click.
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        className={cn(
          'no-scrollbar fixed inset-0 z-[15] overflow-y-auto overscroll-contain',
          // transition-none (not just dropping the property list) — the
          // duration would otherwise still animate `all`.
          'transition-[opacity,transform] ease-out motion-reduce:transition-none',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100 delay-[150ms] duration-[400ms]'
            : 'translate-y-2 opacity-0 delay-0 duration-[200ms]',
        )}
        style={{
          // Even margins all around, like the desktop column mirrors the
          // page margin; the veil's ramp (above) is tuned so the scene is
          // already softened where the first row lands.
          paddingTop: `calc(env(safe-area-inset-top, 0px) + (${MARGIN}))`,
          paddingBottom: `calc(${MARGIN})`,
          paddingLeft: `calc(${MARGIN})`,
          paddingRight: `calc(${MARGIN})`,
        }}
      >
        {shown === 'diary' ? (
          // -mt-4 cancels the first row's padding so the diary opens on
          // the same optical line the tiles do.
          <div className="-mt-4">
            <DiaryList ghost />
          </div>
        ) : shown === 'reading' ? (
          <div
            className="grid gap-5 sm:gap-10"
            style={{
              gridTemplateColumns: 'repeat(var(--cols), minmax(0, 1fr))',
            }}
          >
            {books?.length
              ? books.map((book) => <BookTile key={book.id} book={book} />)
              : sections.reading.tiles.map((tile) => (
                  <BookTile key={tile.id} book={null} />
                ))}
          </div>
        ) : (
          <div
            className="grid gap-5 sm:gap-10"
            style={{
              gridTemplateColumns: 'repeat(var(--cols), minmax(0, 1fr))',
            }}
          >
            {blocks?.length
              ? blocks.map((block) => <Tile key={block.id} block={block} />)
              : sections.inspiration.tiles.map((tile) => (
                  <Tile key={tile.id} block={null} />
                ))}
          </div>
        )}
      </div>
      {/* Close, centered in the top margin band at the content's right
          edge; fades on the content's own schedule. p-3 pads the tap
          target without moving the glyph. */}
      <button
        type="button"
        inert={!open}
        onClick={onClose}
        aria-label={`Close ${sections[shown].label}`}
        className={cn(
          'fixed z-[16] -translate-y-1/2 cursor-pointer p-3 text-2xl leading-none text-muted',
          'hover:text-ink',
          'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
          'transition-[opacity,color] ease-out motion-reduce:transition-none',
          open
            ? 'pointer-events-auto opacity-100 delay-[150ms] duration-[400ms]'
            : 'opacity-0 delay-0 duration-[200ms]',
        )}
        style={{
          top: `calc(env(safe-area-inset-top, 0px) + (${MARGIN}) / 2)`,
          right: `calc((${MARGIN}) - 12px)`,
        }}
      >
        ×
      </button>
    </>
  );
}
