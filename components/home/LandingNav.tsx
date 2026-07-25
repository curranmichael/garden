import { type SectionId } from '@/lib/home/sections';
import SectionLabel from './SectionLabel';

/**
 * The scattered section index from the Garden-2 Figma: labels planted at
 * staggered heights down the left column, like markers in a bed. This is
 * the site's only nav — each underline inks with its label, and the open
 * section's takes the poppy's orange.
 *
 * The static layout's mini scene mirrors these placements through the
 * --nav-top-* / --nav-indent-* variables in globals.css; keep the two
 * tables in step.
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
      {PLACEMENT.map(({ id, top, indent }) => (
        <SectionLabel
          key={id}
          id={id}
          current={active === id}
          onSelect={onSelect}
          className="pointer-events-auto absolute"
          style={{
            top,
            left: `calc(var(--gutter) + var(--inset) + ${indent}px)`,
          }}
        />
      ))}
    </nav>
  );
}
