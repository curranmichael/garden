import 'server-only';

/**
 * Goodreads RSS data layer for the Reading shelf. Goodreads retired its
 * public API, but every shelf still exposes an RSS feed (capped at the
 * last 100 additions — plenty here). We read the `currently-reading` and
 * `read` shelves and surface each book's cover. Every failure path
 * degrades to a smaller (possibly empty) result — this module never
 * throws.
 *
 * The underlying fetches are cached for an hour, so callers can assemble
 * the shelf per request without touching Goodreads each time.
 */

const GOODREADS_USER_ID = '170830135';
const FEED = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}`;

export interface Book {
  id: string;
  title: string;
  author: string;
  imgUrl: string;
  /** The book's Goodreads page. */
  bookUrl: string;
  shelf: 'currently-reading' | 'read';
}

/** Inner text of `<name>` in an item chunk: CDATA unwrapped, entities decoded. */
function tag(chunk: string, name: string): string {
  const match = chunk.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  if (!match) return '';
  return match[1]
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function toBook(chunk: string, shelf: Book['shelf']): Book | null {
  const id = tag(chunk, 'book_id');
  const title = tag(chunk, 'title');
  const imgUrl =
    tag(chunk, 'book_large_image_url') || tag(chunk, 'book_image_url');
  if (!id || !title || !imgUrl) return null;
  return {
    id,
    title,
    author: tag(chunk, 'author_name'),
    imgUrl,
    bookUrl: `https://www.goodreads.com/book/show/${id}`,
    shelf,
  };
}

async function fetchShelf(shelf: Book['shelf']): Promise<Book[]> {
  try {
    const res = await fetch(`${FEED}?shelf=${shelf}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return xml
      .split('<item>')
      .slice(1)
      .map((chunk) => toBook(chunk, shelf))
      .filter((book): book is Book => book !== null);
  } catch {
    return [];
  }
}

/** Currently-reading first, then read; within each, newest additions first. */
export async function getBooks(): Promise<Book[]> {
  const [current, read] = await Promise.all([
    fetchShelf('currently-reading'),
    fetchShelf('read'),
  ]);
  const byId = new Map<string, Book>();
  for (const book of [...current, ...read]) {
    if (!byId.has(book.id)) byId.set(book.id, book);
  }
  return [...byId.values()];
}
