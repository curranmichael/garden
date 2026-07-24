import { cn } from '@/lib/cn';

interface NameLineProps {
  active: boolean;
  onHome: () => void;
}

/**
 * The name line. Sits under the content blur, so its italic tail softens
 * with the bio when a section is open; clicking it closes the section.
 */
export default function NameLine({ active, onHome }: NameLineProps) {
  return (
    <div
      className="absolute inset-x-0 top-0 z-10"
      style={{ transform: 'translateY(var(--name-y))' }}
    >
      <p
        className="text-xl leading-[26px]"
        style={{ marginLeft: 'calc(var(--gutter) + var(--inset))' }}
      >
        <button
          type="button"
          onClick={onHome}
          className={cn(
            'pointer-events-auto text-left',
            'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-muted/70',
            active ? 'cursor-pointer' : 'cursor-default',
          )}
        >
          Curran Dwyer, <em>a software designer and founder</em>
        </button>
      </p>
    </div>
  );
}
