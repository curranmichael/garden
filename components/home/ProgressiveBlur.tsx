import { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * Progressive (gradient) background blur, the CSS analogue of Figma's
 * progressive blur: stacked backdrop-filter layers, each masked to a band
 * of the gradient axis, blur doubling layer to layer. Pointer-events pass
 * through. Fade it in/out with `visible` — opacity only, so showing it
 * never relayouts the content underneath.
 */
export default function ProgressiveBlur({
  direction = 'to bottom',
  maxBlur = 16,
  layerCount = 5,
  ramp = 1,
  visible = true,
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
  visible?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  // Each layer covers a sliding band [i-1, i+1] of layerCount+1 stops with
  // soft edges; together they approximate a continuous blur ramp. The
  // strongest layer holds to the far edge instead of fading back out.
  const layers = Array.from({ length: layerCount }, (_, i) => {
    const blur = maxBlur / 2 ** (layerCount - 1 - i);
    const stop = (n: number) =>
      `${Math.min(Math.max((n / (layerCount + 1)) * ramp * 100, 0), 100)}%`;
    const mask =
      i === layerCount - 1
        ? `linear-gradient(${direction}, transparent ${stop(i - 1)}, black ${stop(i)}, black 100%)`
        : `linear-gradient(${direction}, transparent ${stop(i - 1)}, black ${stop(i)}, black ${stop(i + 1)}, transparent ${stop(i + 2)})`;
    return { blur, mask };
  });

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={style}
    >
      {layers.map(({ blur, mask }, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        />
      ))}
    </div>
  );
}
