import { cn } from '@/lib/cn';
import { sections, type SectionId } from '@/lib/home/sections';
import Underline from './Underline';

/**
 * The scattered section index from the Garden-2 Figma: labels planted at
 * staggered heights down the left column, like markers in a bed. This is
 * the site's only nav — each underline inks with its label, and the open
 * section's takes the poppy's orange.
 */

const PLACEMENT: { id: SectionId; top: string; indent: number }[] = [
  { id: 'diary', top: '44.2dvh', indent: 23 },
  { id: 'inspiration', top: '54.8dvh', indent: 89 },
  { id: 'reading', top: '65.6dvh', indent: 35 },
  { id: 'about', top: '79.8dvh', indent: 138 },
];

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
                ? 'group cursor-pointer hover:text-ink'
                : 'cursor-default',
            )}
            style={{
              top,
              left: `calc(var(--gutter) + var(--inset) + ${indent}px)`,
            }}
            onClick={() => onSelect(id)}
          >
            {section.label}
            <Underline {...section.underline} active={current} />
          </button>
        );
      })}
    </nav>
  );
}
