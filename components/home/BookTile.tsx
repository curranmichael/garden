import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Book } from '@/lib/goodreads';

interface BookTileProps {
  book: Book | null;
}

/**
 * One shelf tile: a book cover in a 2:3 frame, a stretched link to the
 * book's Goodreads page, and a title–author overlay — hidden until
 * hover/focus on hover-capable devices, hidden entirely on touch (the
 * cover itself is the link there).
 */
export default function BookTile({ book }: BookTileProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!book || failed) {
    return <div className="aspect-[2/3] rounded-[2px] bg-tile" />;
  }

  return (
    <div
      className={cn(
        'group relative aspect-[2/3] overflow-hidden rounded-[2px] transition-colors duration-200',
        // Grey only until the cover lands; after that it floats on the
        // panel at its natural proportions.
        !loaded && 'bg-tile',
      )}
    >
      <img
        src={book.imgUrl}
        alt={`${book.title} by ${book.author}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className="pointer-events-none absolute inset-0 size-full object-contain"
      />
      <a
        href={book.bookUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open “${book.title}” on Goodreads`}
        className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-ink/70"
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-page/80 via-page/40 to-transparent px-2 pb-1.5 pt-6',
          'transition-opacity duration-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          '[@media(hover:none)]:hidden',
        )}
      >
        <p className="line-clamp-2 break-words font-serif text-sm font-light leading-snug text-ink">
          {book.title}
          {book.author && <span className="text-muted"> — {book.author}</span>}
        </p>
      </div>
    </div>
  );
}
