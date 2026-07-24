import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { diaryEntries, mediumLabel, type DiaryEntry } from '@/lib/diary';

/**
 * The diary as a list of rows: title on the left, medium tag on the right.
 * Clicking a title unfolds the entry text in place; hovering the tag (or
 * tapping it on touch) floats a photograph/screenshot of the artifact the
 * entry was written on. Rendered on the light panel in both layouts, so
 * everything inks in panel-ink.
 */
export default function DiaryList() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <ul className="max-w-[746px]">
      {diaryEntries.map((entry) => (
        <EntryRow
          key={entry.slug}
          entry={entry}
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
  open: boolean;
  onToggle: () => void;
}

function EntryRow({ entry, open, onToggle }: EntryRowProps) {
  // Hover (mouse) and pinned (tap/keyboard) both raise the popover; touch
  // browsers fire pointerenter on tap, so hover is gated to mouse pointers.
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const popoverOpen = hovering || pinned;

  return (
    <li className="border-b border-panel-ink/10 last:border-b-0">
      <div className="flex items-baseline justify-between gap-6 py-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className={cn(
            'text-left text-xl leading-[26px] text-panel-ink underline-offset-4 hover:underline',
            'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-panel-ink/70',
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
              if (e.pointerType === 'mouse') setHovering(true);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') {
                setHovering(false);
                setPinned(false);
              }
            }}
            onClick={() => setPinned((p) => !p)}
            onBlur={() => setPinned(false)}
            className={cn(
              'font-sans text-[13px] leading-[26px] tracking-wide transition-colors duration-200',
              popoverOpen ? 'text-panel-ink' : 'text-panel-ink/50',
              'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-panel-ink/70',
            )}
          >
            {mediumLabel(entry)}
          </button>
          {popoverOpen && <MediumPopover entry={entry} />}
        </span>
      </div>
      {open && (
        <div className="max-w-[620px] space-y-4 pb-6 pr-8 text-lg leading-[26px] text-panel-ink/80">
          {entry.body.length ? (
            renderBody(entry.body)
          ) : (
            <p className="italic text-panel-ink/45">Coming soon.</p>
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
function renderBody(body: string[]): ReactNode[] {
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
        <h3 key={i} className="pt-3 font-normal text-panel-ink">
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
function MediumPopover({ entry }: { entry: DiaryEntry }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-[4px] bg-panel p-1.5 shadow-[0_8px_32px_rgba(22,22,21,0.3)] ring-1 ring-panel-ink/10">
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
