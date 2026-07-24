import { cn } from '@/lib/cn';
import { sections, type SectionId } from '@/lib/home/sections';

/**
 * The scattered section index from the Garden-2 Figma: labels planted at
 * staggered heights down the left column, like markers in a bed. This is
 * the site's only nav — the open section's label inks bright and its
 * hand-drawn underline takes the poppy's orange.
 */

const PLACEMENT: { id: SectionId; top: string; indent: number }[] = [
  { id: 'diary', top: '44.2dvh', indent: 23 },
  { id: 'inspiration', top: '54.8dvh', indent: 89 },
  { id: 'reading', top: '65.6dvh', indent: 35 },
  { id: 'about', top: '79.8dvh', indent: 138 },
];

/** Underline stroke colors: the SVGs' native near-white, and the sampled
 *  poppy orange the Figma gives the active section. */
const STROKE_REST = '#fdfdfc';
const STROKE_ACTIVE = '#e1671f';

export default function LandingNav({
  active,
  onSelect,
}: {
  active: SectionId | null;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav aria-label="Sections" className="absolute inset-0 z-[13]">
      {PLACEMENT.map(({ id, top, indent }) => {
        const section = sections[id];
        const current = active === id;
        return (
          <button
            key={id}
            type="button"
            aria-expanded={section.activatable ? current : undefined}
            aria-disabled={!section.activatable || undefined}
            className={cn(
              'pointer-events-auto absolute block text-xl leading-[26px] transition-colors duration-200',
              'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
              current ? 'text-ink' : 'text-muted',
              section.activatable
                ? 'cursor-pointer hover:text-ink'
                : 'cursor-default',
            )}
            style={{
              top,
              left: `calc(var(--gutter) + var(--inset) + ${indent}px)`,
            }}
            onClick={() => onSelect(id)}
          >
            {section.label}
            {/* The underline SVG as a mask, so the stroke keeps its
                hand-drawn line but can change color. mask-size stretches
                like the SVG's preserveAspectRatio="none". */}
            <span
              aria-hidden
              className="underline-stroke pointer-events-none absolute -left-[3px] top-[23px] transition-colors duration-300"
              style={{
                width: section.underline.width,
                height: section.underline.height,
                backgroundColor: current ? STROKE_ACTIVE : STROKE_REST,
                maskImage: `url(${section.underline.src})`,
                WebkitMaskImage: `url(${section.underline.src})`,
                maskSize: '100% 100%',
                WebkitMaskSize: '100% 100%',
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
