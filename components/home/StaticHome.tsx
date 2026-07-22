import { cn } from '@/lib/cn';
import { SECTION_ORDER, sections, type SectionId } from '@/lib/home/sections';
import type { TileBlocks } from './HomeExperience';
import Tile from './Tile';

interface StaticHomeProps {
  active: boolean;
  blocks: TileBlocks;
  onSelect: (id: SectionId) => void;
}

/**
 * In-flow layout for phones and prefers-reduced-motion: same content and
 * states as the choreographed scene, native scrolling, no parallax.
 */
export default function StaticHome({
  active,
  blocks,
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
        Curran Dwyer, <em>a software designer and founder</em>
      </p>
      <div className="mt-[13px] max-w-[746px] text-xl leading-[26px] text-muted">
        <p>
          Building{' '}
          <a
            href="https://enai.io"
            target="_blank"
            rel="noreferrer"
            className="relative inline-block"
          >
            Enai
            <img
              src="/underlines/enai.svg"
              alt=""
              width={45}
              height={7}
              className="underline-stroke pointer-events-none absolute -left-[3px] top-[23px] max-w-none"
            />
          </a>
          , a computer that organizes itself for you. I&rsquo;m interested in
          media design as it relates to attention and phenomenology in
          general. How might the computing medium be designed to promote
          deeper attention?
        </p>
      </div>
      <nav className="mt-20 flex flex-wrap gap-x-[50px] gap-y-5">
        {SECTION_ORDER.map((id) => {
          const section = sections[id];
          const current = active && id === 'inspiration';
          return (
            <button
              key={id}
              type="button"
              aria-disabled={!section.activatable || undefined}
              className={cn(
                'relative block text-xl leading-[26px] transition-colors duration-200',
                'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
                current ? 'text-ink' : 'text-muted',
                section.activatable ? 'cursor-pointer' : 'cursor-default',
              )}
              onClick={() => onSelect(id)}
            >
              {section.label}
              <img
                src={section.underline.src}
                alt=""
                width={section.underline.width}
                height={section.underline.height}
                className="underline-stroke pointer-events-none absolute -left-[3px] top-[23px] max-w-none"
              />
            </button>
          );
        })}
      </nav>
      {active && (
        <div className="-mx-5 mt-6 rounded-[4px] bg-panel p-5">
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(var(--cols), minmax(0, 1fr))' }}
          >
            {sections.inspiration.tiles.map((tile, i) => (
              <Tile key={tile.id} block={blocks?.[i] ?? null} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
