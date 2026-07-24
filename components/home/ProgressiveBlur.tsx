import { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * Progressive (gradient) background blur, the CSS analogue of Figma's
 * progressive blur: stacked backdrop-filter layers, each masked to a band
 * of the gradient axis, blur doubling layer to layer. Pointer-events pass
 * through.
 *
 * Fading animates the blur radii themselves (0 → full), not a wrapper
 * opacity: an ancestor with opacity < 1 becomes a backdrop root, which
 * cuts backdrop-filter off from the page behind it — the veil would hold
 * empty through the fade and pop in when opacity lands on 1. Radius also
 * reads better: the wash materializes instead of crossfading. While
 * hidden, visibility drops the layers from paint so the idle scene isn't
 * compositing dormant backdrop filters.
 */
export default function ProgressiveBlur({
  direction = 'to bottom',
  maxBlur = 16,
  layerCount = 5,
  ramp = 1,
  lead = 0,
  visible = true,
  fadeDuration = 500,
  fadeDelay = 0,
  className,
  style,
}: {
  /** Gradient axis: blur grows toward this side. */
  direction?: 'to top' | 'to bottom' | 'to left' | 'to right';
  /** Blur radius (px) at the strong end. */
  maxBlur?: number;
  layerCount?: number;
  /** Fraction of the axis over which the ramp completes; the rest holds
   *  the maximum. */
  ramp?: number;
  /** Width (px) of the sharp-to-soft feather at the leading edge; 0 keeps
   *  it proportional to the axis like the other bands. */
  lead?: number;
  visible?: boolean;
  /** Radius fade timing (ms); hiding waits for the fade to finish. */
  fadeDuration?: number;
  fadeDelay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  // Layer i fades in over one stop band, holds two, and releases; every
  // layer — including the first — ramps from zero, so the veil's leading
  // edge never steps. The first layer's fade-in can be pinned to `lead`
  // px (that feather is the edge the eye actually meets). The strongest
  // layer holds to the far edge instead of fading back out.
  const layers = Array.from({ length: layerCount }, (_, i) => {
    const blur = visible ? maxBlur / 2 ** (layerCount - 1 - i) : 0;
    const stop = (n: number) =>
      `${Math.min((n / (layerCount + 1)) * ramp * 100, 100)}%`;
    const fadeIn = i === 0 && lead > 0 ? `${lead}px` : stop(i + 1);
    const mask =
      i === layerCount - 1
        ? `linear-gradient(${direction}, transparent ${stop(i)}, black ${fadeIn}, black 100%)`
        : `linear-gradient(${direction}, transparent ${stop(i)}, black ${fadeIn}, black ${stop(i + 2)}, transparent ${stop(i + 3)})`;
    return { blur, mask };
  });

  const fade = `${fadeDuration}ms ease ${fadeDelay}ms`;

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none', className)}
      style={{
        visibility: visible ? 'visible' : 'hidden',
        transition: visible
          ? undefined
          : `visibility 0s ${fadeDelay + fadeDuration}ms`,
        ...style,
      }}
    >
      {layers.map(({ blur, mask }, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            transition: `backdrop-filter ${fade}, -webkit-backdrop-filter ${fade}`,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      ))}
    </div>
  );
}
