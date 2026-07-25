import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { sections, type SectionId } from '@/lib/home/sections';
import Underline from './Underline';

/**
 * One nav label: the section's name over its hand-drawn underline, inked
 * muted at rest and bright while open. Shared by the choreographed scene's
 * scattered index and the static layout's mini scene — the caller supplies
 * placement via className/style.
 */
export default function SectionLabel({
  id,
  current,
  onSelect,
  className,
  style,
}: {
  id: SectionId;
  current: boolean;
  onSelect: (id: SectionId) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const section = sections[id];
  return (
    <button
      type="button"
      aria-expanded={section.activatable ? current : undefined}
      aria-disabled={!section.activatable || undefined}
      className={cn(
        'block text-xl leading-[26px] transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
        current ? 'text-ink' : 'text-muted',
        section.activatable
          ? 'group cursor-pointer hover:text-ink'
          : 'cursor-default',
        className,
      )}
      style={style}
      onClick={() => onSelect(id)}
    >
      {section.label}
      <Underline {...section.underline} active={current} />
    </button>
  );
}
