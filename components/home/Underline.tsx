import { cn } from '@/lib/cn';

/**
 * A hand-drawn underline stroke (exported from Figma), rendered through a
 * mask so it inks in the text's own color and follows its transitions.
 * It takes the poppy accent while `active`, and on hover of a `group`
 * parent — so hover accents come only from parents that opt in (the
 * clickable ones). mask-size stretches like the SVG's
 * preserveAspectRatio="none".
 */
export default function Underline({
  src,
  width,
  height,
  active = false,
}: {
  src: string;
  width: number;
  height: number;
  active?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'underline-stroke pointer-events-none absolute -left-[3px] top-[23px] transition-colors duration-300',
        active ? 'bg-accent' : 'bg-current group-hover:bg-accent',
      )}
      style={{
        width,
        height,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
      }}
    />
  );
}
