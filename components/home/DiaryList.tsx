import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { diaryEntries, mediumLabel, type DiaryEntry } from '@/lib/diary';

interface DiaryListProps {
  /** Ghost preview rides the darkened tab surface, so text inks light;
   *  on the solid panel (active, and the static layout) it inks dark. */
  ghost?: boolean;
}

/**
 * The diary as a list of rows: title on the left, medium tag on the right.
 * Clicking a title unfolds the entry text in place; hovering the tag (or
 * tapping it on touch) floats a photograph/screenshot of the artifact the
 * entry was written on. Colors transition with the panel surface so the
 * ghost → active flip has no flash.
 */
export default function DiaryList({ ghost = false }: DiaryListProps) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <ul>
      {diaryEntries.map((entry) => (
        <EntryRow
          key={entry.slug}
          entry={entry}
          ghost={ghost}
          open={openSlug === entry.slug}
          onToggle={() =>
            setOpenSlug((current) =>
              current === entry.slug ? null : entry.slug,
            )
          }
        />
      ))}
    </ul>
  );
}

interface EntryRowProps {
  entry: DiaryEntry;
  ghost: boolean;
  open: boolean;
  onToggle: () => void;
}

/** Rough popover card height; used to decide whether to flip it upward. */
const POPOVER_ROOM = 320;

function EntryRow({ entry, ghost, open, onToggle }: EntryRowProps) {
  // Hover (mouse) and pinned (tap/keyboard) both raise the popover; touch
  // browsers fire pointerenter on tap, so hover is gated to mouse pointers.
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  // Rows low in the viewport open the popover upward so it isn't clipped.
  const [flipUp, setFlipUp] = useState(false);
  const popoverOpen = hovering || pinned;

  const placePopover = (tag: HTMLElement) => {
    setFlipUp(
      tag.getBoundingClientRect().bottom + POPOVER_ROOM > window.innerHeight,
    );
  };

  return (
    <li
      className={cn(
        'border-b transition-colors duration-200 last:border-b-0',
        ghost ? 'border-ink/15' : 'border-panel-ink/10',
      )}
    >
      <div className="flex items-baseline justify-between gap-6 py-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className={cn(
            'text-left text-xl leading-[26px] underline-offset-4 transition-colors duration-200 hover:underline',
            ghost ? 'text-ink' : 'text-panel-ink',
            'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4',
            ghost
              ? 'focus-visible:outline-ink/70'
              : 'focus-visible:outline-panel-ink/70',
            open && 'underline',
          )}
        >
          {entry.title}
        </button>
        <span className="relative shrink-0">
          <button
            type="button"
            aria-expanded={popoverOpen}
            aria-label={`Show the ${mediumLabel(entry)} original`}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') {
                placePopover(e.currentTarget);
                setHovering(true);
              }
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') {
                setHovering(false);
                setPinned(false);
              }
            }}
            onClick={(e) => {
              placePopover(e.currentTarget);
              setPinned((p) => !p);
            }}
            onBlur={() => setPinned(false)}
            className={cn(
              'font-sans text-[13px] leading-[26px] tracking-wide transition-colors duration-200',
              ghost
                ? 'text-muted'
                : popoverOpen
                  ? 'text-panel-ink'
                  : 'text-panel-ink/50',
              'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4',
              ghost
                ? 'focus-visible:outline-ink/70'
                : 'focus-visible:outline-panel-ink/70',
            )}
          >
            {mediumLabel(entry)}
          </button>
          {popoverOpen && <MediumPopover entry={entry} flipUp={flipUp} />}
        </span>
      </div>
      {open && (
        <div
          className={cn(
            'max-w-[620px] space-y-4 pb-6 pr-8 text-lg leading-[26px] transition-colors duration-200',
            ghost ? 'text-ink/80' : 'text-panel-ink/80',
          )}
        >
          {entry.body.length ? (
            renderBody(entry.body, ghost)
          ) : (
            <p
              className={cn(
                'italic',
                ghost ? 'text-ink/45' : 'text-panel-ink/45',
              )}
            >
              Coming soon.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Body blocks: plain lines are paragraphs, `# ` marks a section heading,
 * and runs of `- ` lines group into one bulleted list.
 */
function renderBody(body: string[], ghost: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let items: string[] = [];
  const flush = (key: number) => {
    if (!items.length) return;
    out.push(
      <ul key={`list-${key}`} className="list-disc space-y-1 pl-5">
        {items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>,
    );
    items = [];
  };
  body.forEach((block, i) => {
    if (block.startsWith('- ')) {
      items.push(block.slice(2));
      return;
    }
    flush(i);
    if (block.startsWith('# ')) {
      out.push(
        <h3
          key={i}
          className={cn(
            'pt-3 font-normal transition-colors duration-200',
            ghost ? 'text-ink' : 'text-panel-ink',
          )}
        >
          {block.slice(2)}
        </h3>,
      );
    } else {
      out.push(<p key={i}>{block}</p>);
    }
  });
  flush(body.length);
  return out;
}

/**
 * The artifact image, floated below the tag and anchored to its right edge
 * so it grows inward. Shows a plain placeholder square until the image
 * lands (or if the file isn't there yet).
 */
function MediumPopover({
  entry,
  flipUp,
}: {
  entry: DiaryEntry;
  flipUp: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        'absolute right-0 z-30 w-72 rounded-[4px] bg-panel p-1.5 shadow-[0_8px_32px_rgba(22,22,21,0.3)] ring-1 ring-panel-ink/10',
        flipUp ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
      )}
    >
      {(!loaded || failed) && (
        <div className="aspect-[4/3] w-full rounded-[2px] bg-tile" />
      )}
      {!failed && (
        <img
          src={entry.image}
          alt={`${mediumLabel(entry)} original of “${entry.title}”`}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('w-full rounded-[2px]', loaded ? 'block' : 'hidden')}
        />
      )}
    </div>
  );
}
