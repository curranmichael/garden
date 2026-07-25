'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { CHOREO_MEDIA } from '@/lib/home/media';
import { CELL_ASPECT, CHARS, COLORS, PALETTE } from './poppyData';

/**
 * ASCII California poppy. At rest it is a still drawing; under the
 * choreography media query the flower behaves like a just-opened bottle of
 * champagne: the pointer entering is the cork — glyphs pop outward and up,
 * then a slow-blooming pressure wave carries them further while they hang
 * and tumble, and an overdamped spring drifts each one home with no
 * wobble. Dragging through leaves a trail of smaller fizzing bursts.
 * Physics never touches React state — one rAF loop owns the canvas, and it
 * stops whenever the flower settles.
 *
 * The component's frame sizes itself in CSS (dvh-proportional, per the
 * Garden-2 Figma frame) and the physics re-derives the glyph grid from its
 * rendered rect, so the parent positions it like any other element. The
 * canvas inside bleeds BLEED past every edge of the frame so burst glyphs
 * are never clipped mid-flight.
 */

interface Particle {
  char: string;
  color: string;
  /** Home position (cell center, css px). */
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Petal glyphs are light and splash freely; foliage stays planted. */
  petal: boolean;
  /** Deterministic per-glyph variation so the motion isn't uniform. */
  jitter: number;
  spin: 1 | -1;
}

/** One burst: an expanding ring wave in canvas-local px. */
interface Splash {
  x: number;
  y: number;
  age: number;
  /** 0..1, scales both the ring force and how far it carries. */
  strength: number;
}

const FONT = 'ui-monospace, "SF Mono", Menlo, monospace';
/** Spring stiffness (1/s²) and damping (1/s): critically damped (ζ≈1) and
 *  soft, so a burst glyph coasts out under drag, hangs, and drifts home
 *  over a couple of seconds without ever wobbling — champagne, not jello. */
const SPRING = 6;
const DAMP = 5;
/** All px/s and px/s² constants below are at the reference canvas height
 *  and scale with the rendered size so the splash stays proportional. */
const REFERENCE_HEIGHT = 609;
/** Pressure wave: a slow-blooming ring that keeps carrying glyphs outward
 *  after the pop — crest travel speed (px/s), gaussian half-width of the
 *  crest (px), peak radial force at the impact point (px/s²), the distance
 *  over which that force roughly halves as the ring spreads (px), and its
 *  exponential die-off with age (1/s). */
const WAVE_SPEED = 300;
const WAVE_WIDTH = 80;
const WAVE_FORCE = 3000;
const WAVE_ATTENUATION = 300;
const WAVE_DECAY = 1.0;
/** The ring applies almost no force until it's this far (px) from the
 *  impact point — a pocket of calm stays around the pointer while the
 *  expanding ring still catches and carries everything beyond it. */
const WAVE_IGNITION = 60;
/** The cork pop: an instant outward velocity kick (px/s), shell-profiled —
 *  peak at half PLOP_RADIUS, near zero at the very center, so the cursor
 *  keeps close company instead of excavating a hole — with a fraction
 *  aimed upward on petals — the spray. */
const PLOP_KICK = 700;
const PLOP_RADIUS = 0.18; // × flower height
const PLOP_UP = 0.65;
/** Dragging through the flower fizzes off smaller bursts this far apart
 *  (× flower height), at this fraction of a full pop. */
const WAKE_SPACING = 0.15;
const WAKE_STRENGTH = 0.35;
const MAX_SPLASHES = 6;
/** Downward pull (px/s²) on glyphs no wave is pushing, fading out near
 *  home — kept gentle so thrown-up glyphs hang in the air and sink like
 *  spray rather than dropping. GRAVITY/FALL_REF stays well under SPRING so
 *  glyphs still converge exactly home. */
const GRAVITY = 140;
const FALL_REF = 90;
/** Foliage mass: stem and leaves move this factor less than petals. */
const FOLIAGE_MASS = 2;
/** The drawing surface extends this fraction of the frame's *height* past
 *  every edge (the frame itself keeps the flower's exact layout box).
 *  Height-relative on all four sides — the frame is tall and narrow, and a
 *  width-relative side bleed would be thinner than a pop can throw. Sized
 *  to cover the coasting distance of a full-strength pop, PLOP_KICK/DAMP,
 *  plus the wave's carry. */
const BLEED = 0.3;

const ROWS = CHARS.length;
const GRID_COLS = Math.max(...CHARS.map((r) => r.length));
/** Frame width / height, for converting the height-relative BLEED into
 *  the width-relative percentages the horizontal sides need. */
const FRAME_ASPECT = (GRID_COLS * CELL_ASPECT) / ROWS;

/** Orange hues are petals; everything else is stem and leaf. */
function isPetalColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r > g && g > b;
}

interface GlyphTemplate {
  char: string;
  color: string;
  petal: boolean;
  jitter: number;
  spin: 1 | -1;
  col: number;
  row: number;
}

const template: GlyphTemplate[] = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < CHARS[row].length; col++) {
    const char = CHARS[row][col];
    if (char === ' ') continue;
    const color = PALETTE[parseInt(COLORS[row][col], 36)];
    const hash = ((row * GRID_COLS + col) * 2654435761) >>> 0;
    template.push({
      char,
      color,
      petal: isPetalColor(color),
      jitter: 0.85 + (hash / 0xffffffff) * 0.3,
      spin: hash % 2 ? 1 : -1,
      col,
      row,
    });
  }
}

export default function PoppyAscii({
  interactive = true,
  className,
  style,
}: {
  /** While false (a section is open), the cursor is ignored and any
   *  scattered glyphs glide home. */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const interactiveRef = useRef(interactive);
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    interactiveRef.current = interactive;
    if (!interactive) {
      wakeRef.current?.(); // spring anything displaced back home
    }
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    /** The flower's layout box height (the canvas is BLEED larger). */
    let frameH = 0;
    /** Rendered-size factor applied to every speed/force constant. */
    let scale = 1;

    const particles: Particle[] = template.map((t) => ({
      char: t.char,
      color: t.color,
      petal: t.petal,
      jitter: t.jitter,
      spin: t.spin,
      hx: 0,
      hy: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));
    const splashes: Splash[] = [];

    /** Derive the glyph grid from the frame's rendered CSS size, offset
     *  into the bleed canvas; glyphs snap home (resizing mid-burst isn't
     *  worth preserving velocity for). */
    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const box = frame.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      frameH = box.height;
      scale = frameH / REFERENCE_HEIGHT;
      splashes.length = 0; // splash coords are stale at the new size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cellH = box.height / ROWS;
      const cellW = cellH * CELL_ASPECT;
      const offX = box.left - rect.left;
      const offY = box.top - rect.top;
      ctx.font = `${cellH * 0.95}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      particles.forEach((p, i) => {
        p.hx = offX + (template[i].col + 0.5) * cellW;
        p.hy = offY + (template[i].row + 0.5) * cellH;
        p.x = p.hx;
        p.y = p.hy;
        p.vx = 0;
        p.vy = 0;
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const dx = p.x - p.hx;
        const dy = p.y - p.hy;
        const disp = Math.hypot(dx, dy);
        ctx.fillStyle = p.color;
        if (disp < 0.5) {
          ctx.fillText(p.char, p.hx, p.hy);
        } else {
          // Tumble and swell with displacement; both relax to identity
          // as the spring brings the glyph home.
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.max(-0.9, Math.min(0.9, dx * 0.0075)) * p.spin);
          const s = 1 + Math.min(disp / 180, 0.35);
          ctx.scale(s, s);
          ctx.fillText(p.char, 0, 0);
          ctx.restore();
        }
      }
    };

    setup();
    draw();

    // ---- splash physics, gated to the choreographed scene ---------------

    let raf = 0;
    let last = 0;

    const step = (dt: number): boolean => {
      let awake = false;
      if (!interactiveRef.current) splashes.length = 0;
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.age += dt;
        // Gone once the ring has crossed the canvas or died of old age.
        if (s.age * WAVE_SPEED * scale > width + height || s.age > 3) {
          splashes.splice(i, 1);
        }
      }
      if (splashes.length) awake = true;
      for (const p of particles) {
        let fx = 0;
        let fy = 0;
        for (const s of splashes) {
          const dx = p.x - s.x;
          const dy = p.y - s.y;
          const d = Math.hypot(dx, dy);
          const off = (d - s.age * WAVE_SPEED * scale) / (WAVE_WIDTH * scale);
          if (off < -2 || off > 2) continue; // outside the crest
          const ign = d / (WAVE_IGNITION * scale);
          const f =
            ((WAVE_FORCE * scale * s.strength * Math.exp(-off * off) *
              Math.exp(-s.age * WAVE_DECAY) *
              (1 - Math.exp(-ign * ign))) /
              (1 + d / (WAVE_ATTENUATION * scale))) *
            (p.jitter / (p.petal ? 1 : FOLIAGE_MASS));
          fx += (dx / (d || 1)) * f;
          fy += (dy / (d || 1)) * f;
        }
        if (fx === 0 && fy === 0) {
          // No wave under this glyph: fall back into place. Fades toward
          // home so equilibrium stays exactly at (hx, hy).
          const disp = Math.hypot(p.x - p.hx, p.y - p.hy);
          if (disp > 0.5) fy = GRAVITY * scale * Math.min(disp / FALL_REF, 1);
        }
        p.vx += (SPRING * (p.hx - p.x) - DAMP * p.vx + fx) * dt;
        p.vy += (SPRING * (p.hy - p.y) - DAMP * p.vy + fy) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (
          Math.abs(p.x - p.hx) > 0.05 ||
          Math.abs(p.y - p.hy) > 0.05 ||
          Math.abs(p.vx) > 0.5 ||
          Math.abs(p.vy) > 0.5
        ) {
          awake = true;
        }
      }
      return awake;
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const awake = step(dt);
      draw();
      if (awake) {
        raf = requestAnimationFrame(loop);
      } else {
        // Every bubble settled: snap exactly home and go idle.
        for (const p of particles) {
          p.x = p.hx;
          p.y = p.hy;
          p.vx = 0;
          p.vy = 0;
        }
        draw();
        raf = 0;
      }
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    wakeRef.current = wake;

    /** The cork pops: ring wave plus an instant kick near the impact,
     *  petals thrown upward — the spray. */
    const spawnSplash = (x: number, y: number, strength: number) => {
      if (splashes.length >= MAX_SPLASHES) splashes.shift();
      splashes.push({ x, y, age: 0, strength });
      const r0 = frameH * PLOP_RADIUS;
      for (const p of particles) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy);
        if (d >= r0) continue;
        const kick =
          (PLOP_KICK * scale * strength * Math.sin(Math.PI * (d / r0)) *
            p.jitter) /
          (p.petal ? 1 : FOLIAGE_MASS);
        p.vx += (dx / (d || 1)) * kick;
        p.vy += (dy / (d || 1)) * kick - (p.petal ? kick * PLOP_UP : 0);
      }
      wake();
    };

    let wasInside = false;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let wakeDist = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (!interactiveRef.current) return;
      // Coordinates are canvas-local (the physics space), but the trigger
      // zone stays the flower's frame — the bleed margin is drawing-only.
      const rect = canvas.getBoundingClientRect();
      const box = frame.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
      const now = performance.now();
      const traveled = Math.hypot(x - lastX, y - lastY);
      const speed = now > lastT ? (traveled / (now - lastT)) * 1000 : 0;
      if (inside && !wasInside) {
        // Burst strength follows how fast the pointer came in, but even a
        // slow entry pops.
        spawnSplash(x, y, Math.min(0.45 + speed / 2400, 1));
        wakeDist = 0;
      } else if (inside) {
        wakeDist += traveled;
        if (wakeDist > frameH * WAKE_SPACING) {
          wakeDist = 0;
          spawnSplash(x, y, WAKE_STRENGTH * Math.min(0.5 + speed / 2400, 1));
        }
      }
      wasInside = inside;
      lastX = x;
      lastY = y;
      lastT = now;
    };
    // mouseleave on <html> is the reliable "cursor left the viewport"
    // signal; pointerleave doesn't bubble to window.
    const onPointerOut = () => {
      wasInside = false;
    };

    const onResize = () => {
      setup();
      draw();
    };

    const mql = window.matchMedia(CHOREO_MEDIA);
    const sync = () => {
      if (mql.matches) {
        window.addEventListener('pointermove', onPointerMove, {
          passive: true,
        });
        document.documentElement.addEventListener('mouseleave', onPointerOut);
      } else {
        window.removeEventListener('pointermove', onPointerMove);
        document.documentElement.removeEventListener(
          'mouseleave',
          onPointerOut,
        );
        wasInside = false;
      }
    };
    sync();
    mql.addEventListener('change', sync);
    const observer = new ResizeObserver(onResize);
    observer.observe(canvas);
    window.addEventListener('resize', onResize);

    return () => {
      mql.removeEventListener('change', sync);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('mouseleave', onPointerOut);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      wakeRef.current = null;
      if (raf) cancelAnimationFrame(raf);
    };
    // Everything mutable lives in refs; mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={frameRef}
      role="img"
      aria-label="A California poppy, drawn in text characters"
      className={className}
      style={{
        // Proportions from the Garden-2 Figma frame (1280x832): the plant
        // is 73.2% of the viewport tall, clamped so glyphs stay legible.
        height: 'clamp(420px, 73.2dvh, 840px)',
        aspectRatio: `${GRID_COLS * CELL_ASPECT} / ${ROWS}`,
        ...style,
      }}
    >
      {/* The anchor keeps its own positioning so callers can freely set
          the frame's position via className/style. */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          aria-hidden
          style={{
            // Replaced elements don't stretch from opposing insets, so the
            // bleed is spelled out as explicit size + offset.
            position: 'absolute',
            left: `${(-BLEED / FRAME_ASPECT) * 100}%`,
            top: `${-BLEED * 100}%`,
            width: `${(1 + (2 * BLEED) / FRAME_ASPECT) * 100}%`,
            height: `${(1 + 2 * BLEED) * 100}%`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
