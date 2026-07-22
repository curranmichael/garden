import { cn } from '@/lib/cn';

interface NameLineProps {
  active: boolean;
  onHome: () => void;
}

/**
 * Fixed name layer, pushed upward by the rising panel via --name-y.
 * Sits above the panel; clicking it returns to the landing state.
 */
export default function NameLine({ active, onHome }: NameLineProps) {
  return (
    <div
      className="absolute inset-x-0 top-0 z-30 will-change-transform"
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
