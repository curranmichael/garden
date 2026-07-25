import { cn } from '@/lib/cn';
import { SECTION_ORDER, sections, type SectionId } from '@/lib/home/sections';
import BookTile from './BookTile';
import DiaryList from './DiaryList';
import type { ShelfBooks, TileBlocks } from './HomeExperience';
import PoppyAscii from './PoppyAscii';
import Tile from './Tile';
import Underline from './Underline';

interface StaticHomeProps {
  active: SectionId | null;
  blocks: TileBlocks;
  books: ShelfBooks;
  onSelect: (id: SectionId) => void;
}

/**
 * In-flow layout for phones and prefers-reduced-motion: same content and
 * states as the choreographed scene, native scrolling, no parallax.
 */
export default function StaticHome({
  active,
  blocks,
  books,
  onSelect,
}: StaticHomeProps) {
  return (
    <main
      className="min-h-dvh pb-16 pt-20"
      style={{
        paddingLeft: 'calc(var(--gutter) + var(--inset))',
        paddingRight: 'calc(var(--gutter) + var(--inset))',
      }}
    >
      <p className="text-xl leading-[26px]">
        Curran Dwyer, <em className="block">a software designer and founder</em>
      </p>
      <div className="mt-[13px] max-w-[746px] text-xl leading-[26px] text-muted">
        <p>
          Building{' '}
          <a
            href="https://enai.io"
            target="_blank"
            rel="noreferrer"
            className="group relative inline-block"
          >
            Enai
            <Underline src="/underlines/enai.svg" width={45} height={7} />
          </a>
          , a computer that organizes itself for you. I&rsquo;m interested in
          media design as it relates to attention and phenomenology in
          general. How might the computing medium be designed to promote
          deeper attention?
        </p>
      </div>
      <nav className="mt-20 flex flex-col items-center gap-y-5">
        {[SECTION_ORDER.slice(0, 2), SECTION_ORDER.slice(2)].map((row) => (
          <div key={row.join('-')} className="flex gap-x-[50px]">
            {row.map((id) => {
              const section = sections[id];
              const current = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-disabled={!section.activatable || undefined}
                  className={cn(
                    'relative block text-xl leading-[26px] transition-colors duration-200',
                    'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
                    current ? 'text-ink' : 'text-muted',
                    section.activatable ? 'group cursor-pointer' : 'cursor-default',
                  )}
                  onClick={() => onSelect(id)}
                >
                  {section.label}
                  <Underline {...section.underline} active={current} />
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      {active === 'inspiration' && (
        <div className="-mx-5 mt-6 rounded-[4px] bg-panel p-5">
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(var(--cols), minmax(0, 1fr))' }}
          >
            {blocks?.length
              ? blocks.map((block) => <Tile key={block.id} block={block} />)
              : sections.inspiration.tiles.map((tile) => (
                  <Tile key={tile.id} block={null} />
                ))}
          </div>
        </div>
      )}
      {active === 'diary' && (
        <div className="-mx-5 mt-6 rounded-[4px] bg-panel p-5">
          <DiaryList />
        </div>
      )}
      {active === 'reading' && (
        <div className="-mx-5 mt-6 rounded-[4px] bg-panel p-5">
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(var(--cols), minmax(0, 1fr))' }}
          >
            {books?.length
              ? books.map((book) => <BookTile key={book.id} book={book} />)
              : sections.reading.tiles.map((tile) => (
                  <BookTile key={tile.id} book={null} />
                ))}
          </div>
        </div>
      )}
      {/* On the static layout the poppy is a still endpiece — no physics
          (gated off with the choreography), fully in view, page-bottom. */}
      <div className="mt-20 flex justify-center">
        <PoppyAscii style={{ height: 'min(52dvh, 420px)' }} />
      </div>
    </main>
  );
}
