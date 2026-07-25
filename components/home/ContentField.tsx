import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { sections, type SectionId } from '@/lib/home/sections';
import BookTile from './BookTile';
import DiaryList from './DiaryList';
import type { ShelfBooks, TileBlocks } from './HomeExperience';
import ProgressiveBlur from './ProgressiveBlur';
import Tile from './Tile';

/**
 * The content surface from the Garden-2 Figma: opening a section washes
 * the scene's right side with a progressive blur, then floats the
 * section's content over it — the veil materializes first and the content
 * fades in on its tail. Closing reverses the order: content leaves first,
 * the veil lifts after. Scrolling happens inside this layer; the page
 * never moves.
 *
 * Geometry: the veil starts at 50%-250px (the 1280x832 frame, anchored to
 * center like the poppy), easing from sharp to soft over its first LEAD
 * px. The content column mirrors the page margin — gutter + inset, the
 * bio's distance from the left edge — against the viewport's right edge,
 * as its own block padding, and on the left measured from the feather's
 * midpoint (its optical edge), so the open scene reads symmetric even
 * though the veil's true start is soft. 40px grid gaps.
 */
const VEIL_LEFT = '50% - 250px';
const MARGIN = 'var(--gutter) + var(--inset)';
const LEAD = 120;

export default function ContentField({
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

  return (
    <>
      <ProgressiveBlur
        direction="to right"
        maxBlur={40}
        ramp={0.55}
        lead={LEAD}
        visible={open}
        fadeDuration={open ? 600 : 450}
        fadeDelay={open ? 0 : 150}
        className="absolute inset-y-0 right-0 z-[14]"
        style={{ left: `calc(${VEIL_LEFT})` }}
      />
      <div
        ref={scrollRef}
        inert={!open}
        className={cn(
          'no-scrollbar absolute inset-y-0 z-[15] overflow-y-auto overscroll-contain',
          'transition-[opacity,transform] ease-out',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100 delay-[200ms] duration-[500ms]'
            : 'translate-y-2 opacity-0 delay-0 duration-[250ms]',
        )}
        style={{
          left: `calc(${VEIL_LEFT} + ${LEAD / 2}px + ${MARGIN})`,
          right: `calc(${MARGIN})`,
          paddingBlock: `calc(${MARGIN})`,
        }}
      >
        {shown === 'diary' ? (
          // -mt-4 cancels the first row's padding so the diary opens on
          // the same optical line the tiles do.
          <div className="-mt-4">
            <DiaryList ghost />
          </div>
        ) : shown === 'reading' ? (
          // Four columns: book covers run 2:3, so the narrower tile keeps
          // row heights close to the inspiration grid's squares.
          <div className="grid grid-cols-4 gap-10">
            {books?.length
              ? books.map((book) => <BookTile key={book.id} book={book} />)
              : sections.reading.tiles.map((tile) => (
                  <BookTile key={tile.id} book={null} />
                ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-10">
            {blocks?.length
              ? blocks.map((block) => <Tile key={block.id} block={block} />)
              : sections.inspiration.tiles.map((tile) => (
                  <Tile key={tile.id} block={null} />
                ))}
          </div>
        )}
      </div>
      {/* Close, centered in the top margin band on the content's right
          edge; fades on the content's own schedule. */}
      <button
        type="button"
        inert={!open}
        onClick={onClose}
        aria-label={`Close ${sections[shown].label}`}
        className={cn(
          'absolute z-[16] -translate-y-1/2 cursor-pointer text-2xl leading-none text-muted',
          'transition-[opacity,color] ease-out hover:text-ink',
          'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
          open
            ? 'pointer-events-auto opacity-100 delay-[200ms] duration-[500ms]'
            : 'opacity-0 delay-0 duration-[250ms]',
        )}
        style={{
          top: `calc((${MARGIN}) / 2)`,
          right: `calc(${MARGIN})`,
        }}
      >
        ×
      </button>
    </>
  );
}
