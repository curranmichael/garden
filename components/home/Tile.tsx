import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { InspirationBlock } from '@/lib/arena';

interface TileProps {
  block: InspirationBlock | null;
}

/**
 * One grid tile. Without a block (or after an image failure) it renders the
 * plain placeholder square. With a block: the image, a stretched link to the
 * block's source, and a channel-name overlay — hidden until hover/focus on
 * hover-capable devices, persistently visible on touch. The two links are
 * siblings, never nested.
 */
export default function Tile({ block }: TileProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!block || failed) {
    return <div className="aspect-square rounded-[2px] bg-tile" />;
  }

  return (
    <div
      className={cn(
        'group relative aspect-square overflow-hidden rounded-[2px] transition-colors duration-200',
        // Grey only until the image lands; after that the image floats on
        // the panel at its natural proportions.
        !loaded && 'bg-tile',
      )}
    >
      <img
        src={block.imgUrl}
        alt={block.alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className="pointer-events-none absolute inset-0 size-full object-contain"
      />
      <a
        href={block.blockUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={
          block.alt ? `Open source of “${block.alt}”` : 'Open block source'
        }
        className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-ink/70"
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-page/80 via-page/40 to-transparent px-2 pb-1.5 pt-6',
          'transition-opacity duration-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          // No hover, no channel name: display:none keeps the invisible
          // link from intercepting taps meant for the image.
          '[@media(hover:none)]:hidden',
        )}
      >
        <a
          href={block.channelUrl}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto line-clamp-2 break-words font-serif text-sm font-light leading-snug text-ink underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/70"
        >
          {block.channelTitle}
        </a>
      </div>
    </div>
  );
}
