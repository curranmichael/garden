import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type TouchEvent as ReactTouchEvent,
} from 'react';
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
 * Closing: the × in the top band, a tap on any of the layer's own padding
 * (the scroll layer is its own scrim — a separate one underneath could
 * never receive taps), a swipe down from the scroller's top, the open
 * section's label, or Escape via HomeExperience.
 */
const MARGIN = 'var(--gutter) + var(--inset)';

/* The swipe-down dismissal: a single-finger drag that begins with the
 * scroller at its top follows the finger down (with resistance), then
 * either dismisses — continuing down while the fade runs — or springs
 * back. Native scrolling always wins otherwise: any upward, horizontal,
 * or mid-scroll start cancels the gesture for that touch. */
const ENGAGE = 12; // px of downward travel before the drag takes hold
const RESIST = 0.55; // content follows the finger at this rate
const DISMISS_PULL = 72; // px of (post-resistance) pull that closes
const DISMISS_VELOCITY = 0.5; // px/ms flick that closes regardless
const EXIT_TRAVEL = 96; // extra px the content keeps falling on dismiss

interface DragState {
  startX: number;
  startY: number;
  lastY: number;
  lastT: number;
  vy: number;
  engaged: boolean;
  canceled: boolean;
}

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
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef(0);
  const pendingPullRef = useRef(0);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A drag that engaged can still end in a browser-synthesized click;
  // swallow it so a spring-back doesn't read as a padding tap.
  const suppressClickRef = useRef(false);

  // A section always opens at its top, including swaps between sections —
  // and with any leftover swipe offset reset before the entrance runs.
  useEffect(() => {
    if (!active) return;
    const el = scrollRef.current;
    if (!el) return;
    if (settleRef.current) clearTimeout(settleRef.current);
    el.style.transitionProperty = 'none';
    el.style.translate = '';
    el.style.transitionDelay = '';
    void el.offsetHeight; // flush, so the reset itself never animates
    el.style.transitionProperty = '';
    el.scrollTo(0, 0);
  }, [active]);

  useEffect(
    () => () => {
      if (settleRef.current) clearTimeout(settleRef.current);
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const open = active !== null;
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('overlay-open');
    return () => document.documentElement.classList.remove('overlay-open');
  }, [open]);

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!open || event.touches.length !== 1) {
      dragRef.current = null;
      return;
    }
    const touch = event.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastY: touch.clientY,
      lastT: event.timeStamp,
      vy: 0,
      engaged: false,
      // <= 0: iOS reports negative scrollTop while settling at the edge.
      canceled: event.currentTarget.scrollTop > 0,
    };
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.canceled) return;
    const el = event.currentTarget;
    const touch = event.touches[0];
    const dx = touch.clientX - drag.startX;
    const dy = touch.clientY - drag.startY;
    const dt = event.timeStamp - drag.lastT;
    if (dt > 0) drag.vy = (touch.clientY - drag.lastY) / dt;
    drag.lastY = touch.clientY;
    drag.lastT = event.timeStamp;
    if (!drag.engaged) {
      // Upward, sideways, or no-longer-at-the-top: this touch is a
      // scroll, not a dismissal.
      if (dy < 0 || Math.abs(dx) > dy || el.scrollTop > 0) {
        drag.canceled = true;
        return;
      }
      if (dy < ENGAGE) return;
      drag.engaged = true;
      el.style.transitionProperty = 'none';
    }
    // Latest-value throttle: one write per frame, never starved by a
    // dense touchmove stream (cancel-and-reschedule would let each move
    // cancel the previous frame's pending write).
    pendingPullRef.current = Math.max(0, dy - ENGAGE) * RESIST;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        el.style.translate = `0 ${pendingPullRef.current}px`;
      });
    }
  };

  const endDrag = (event: ReactTouchEvent<HTMLDivElement>, dismissable: boolean) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.engaged) return;
    const el = event.currentTarget;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    suppressClickRef.current = true;
    const pull = Math.max(0, drag.lastY - drag.startY - ENGAGE) * RESIST;
    if (dismissable && (pull > DISMISS_PULL || drag.vy > DISMISS_VELOCITY)) {
      // Pin the drag position without animating, resume the class
      // transition, and flip to closed; the exit target lands a frame
      // later so it transitions under the closed state's timing (the
      // open state's 150ms delay would stall the fall).
      el.style.translate = `0 ${pull}px`;
      void el.offsetHeight;
      el.style.transitionProperty = '';
      onClose();
      requestAnimationFrame(() => {
        el.style.translate = `0 ${pull + EXIT_TRAVEL}px`;
      });
      settleRef.current = setTimeout(() => {
        el.style.translate = '';
      }, 500);
    } else {
      // Spring back now — the open state's transition delay would hold
      // the content mid-air for 150ms first.
      el.style.transitionProperty = '';
      el.style.transitionDelay = '0ms';
      el.style.translate = ''; // classes take it back to translate-y-0
      settleRef.current = setTimeout(() => {
        el.style.transitionDelay = '';
      }, 500);
    }
  };

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
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (event.target === event.currentTarget) onClose();
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={(event) => endDrag(event, true)}
        onTouchCancel={(event) => endDrag(event, false)}
        className={cn(
          // overscroll-none (not contain): iOS would still rubber-band
          // the scroller itself at the top edge, doubling the drag.
          'no-scrollbar fixed inset-0 z-[15] overflow-y-auto overscroll-none',
          // The drift lives on the `translate` property (Tailwind 4's
          // translate-y-*), so that is the channel to transition;
          // transition-none (not just dropping the property list) under
          // reduced motion — the duration would otherwise animate `all`.
          'transition-[opacity,translate] ease-out motion-reduce:transition-none',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100 delay-[150ms] duration-[400ms]'
            : 'translate-y-4 opacity-0 delay-0 duration-[200ms]',
        )}
        style={{
          // A taller band than the side margins, so the × keeps a clear
          // row of its own above the first content row; the max() keeps
          // the reduced-motion desktop on its own margin grammar.
          paddingTop: `max(calc(env(safe-area-inset-top, 0px) + 96px), calc(${MARGIN}))`,
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
          top: `calc(env(safe-area-inset-top, 0px) + max(96px, ${MARGIN}) / 2)`,
          right: `calc((${MARGIN}) - 12px)`,
        }}
      >
        ×
      </button>
    </>
  );
}
