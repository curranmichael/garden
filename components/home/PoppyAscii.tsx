'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { CHOREO_MEDIA } from '@/lib/home/media';
import { CELL_ASPECT, CHARS, COLORS, PALETTE } from './poppyData';

/**
 * ASCII California poppy. At rest it is a still drawing; under the
 * choreography media query each glyph becomes a particle that the cursor
 * scatters and a spring pulls home. Physics never touches React state —
 * one rAF loop owns the canvas, and it stops whenever the flower settles.
 *
 * The canvas sizes itself in CSS (dvh-proportional, per the Garden-2 Figma
 * frame) and the physics re-derives the glyph grid from its rendered rect,
 * so the parent positions it like any other element.
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
  /** Petal glyphs are light and scatter outward; foliage stays planted. */
  petal: boolean;
  /** Deterministic per-glyph variation so the motion isn't uniform. */
  jitter: number;
  spin: 1 | -1;
}

const FONT = 'ui-monospace, "SF Mono", Menlo, monospace';
/** Spring stiffness (1/s²) and damping (1/s): underdamped, ~1.5Hz return
 *  with one soft overshoot — wind, not confetti. */
const SPRING = 90;
const DAMP = 10;
/** Peak cursor repulsion (px/s²) at the reference canvas height; scaled by
 *  actual height so equilibrium displacement stays proportional. */
const REPULSE = 2600;
const REFERENCE_HEIGHT = 609;
/** How much displacement steers away from the bloom's center instead of the
 *  cursor — the flower scatters like petals, not like iron filings. */
const BLOOM_BIAS_PETAL = 0.45;
const BLOOM_BIAS_FOLIAGE = 0.15;
/** Foliage mass: stem and leaves move this factor less than petals. */
const FOLIAGE_MASS = 1.6;

const ROWS = CHARS.length;
const GRID_COLS = Math.max(...CHARS.map((r) => r.length));

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

/** Bloom center — the petal centroid, origin of the outward scatter —
 *  as fractions of the grid, resolved to px once the canvas has a size. */
const petals = template.filter((t) => t.petal);
const BLOOM_CX =
  petals.reduce((s, t) => s + t.col + 0.5, 0) / petals.length / GRID_COLS;
const BLOOM_CY =
  petals.reduce((s, t) => s + t.row + 0.5, 0) / petals.length / ROWS;

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
  const interactiveRef = useRef(interactive);
  const wakeRef = useRef<(() => void) | null>(null);
  const cursorRef = useRef<{ cx: number; cy: number } | null>(null);

  useEffect(() => {
    interactiveRef.current = interactive;
    if (!interactive) {
      cursorRef.current = null;
      wakeRef.current?.(); // spring anything displaced back home
    }
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let radius = 0;
    let repulse = REPULSE;

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
    let bloomX = 0;
    let bloomY = 0;

    /** Derive the glyph grid from the rendered CSS size; glyphs snap home
     *  (resizing mid-scatter isn't worth preserving velocity for). */
    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      radius = height * 0.2;
      repulse = (REPULSE * height) / REFERENCE_HEIGHT;
      bloomX = BLOOM_CX * width;
      bloomY = BLOOM_CY * height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cellH = height / ROWS;
      const cellW = cellH * CELL_ASPECT;
      ctx.font = `${cellH * 0.95}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      particles.forEach((p, i) => {
        p.hx = (template[i].col + 0.5) * cellW;
        p.hy = (template[i].row + 0.5) * cellH;
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
          ctx.rotate(dx * 0.008 * p.spin);
          const s = 1 + Math.min(disp / 160, 0.15);
          ctx.scale(s, s);
          ctx.fillText(p.char, 0, 0);
          ctx.restore();
        }
      }
    };

    setup();
    draw();

    // ---- hover physics, gated to the choreographed scene ----------------

    let raf = 0;
    let last = 0;

    const step = (dt: number): boolean => {
      let awake = false;
      let local: { x: number; y: number } | null = null;
      const cursor = cursorRef.current;
      if (cursor) {
        const rect = canvas.getBoundingClientRect();
        local = { x: cursor.cx - rect.left, y: cursor.cy - rect.top };
      }
      for (const p of particles) {
        let fx = 0;
        let fy = 0;
        if (local) {
          const dx = p.x - local.x;
          const dy = p.y - local.y;
          const d = Math.hypot(dx, dy);
          if (d < radius) {
            const strength =
              (repulse * (1 - d / radius) ** 2 * p.jitter) /
              (p.petal ? 1 : FOLIAGE_MASS);
            // Blend "away from cursor" with "outward from the bloom" so a
            // disturbance reads as petals scattering, not iron filings.
            const bias = p.petal ? BLOOM_BIAS_PETAL : BLOOM_BIAS_FOLIAGE;
            const bx = p.hx - bloomX;
            const by = p.hy - bloomY;
            const bd = Math.hypot(bx, by) || 1;
            const ax = (dx / (d || 1)) * (1 - bias) + (bx / bd) * bias;
            const ay = (dy / (d || 1)) * (1 - bias) + (by / bd) * bias;
            const ad = Math.hypot(ax, ay) || 1;
            fx = (ax / ad) * strength;
            fy = (ay / ad) * strength;
            awake = true;
          }
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
        // Settled with the cursor away: snap exactly home and go idle.
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

    const onPointerMove = (event: PointerEvent) => {
      if (!interactiveRef.current) return;
      cursorRef.current = { cx: event.clientX, cy: event.clientY };
      const rect = canvas.getBoundingClientRect();
      const dist = Math.max(
        rect.left - event.clientX,
        event.clientX - rect.right,
        rect.top - event.clientY,
        event.clientY - rect.bottom,
        0,
      );
      if (dist < radius) wake();
    };
    // mouseleave on <html> is the reliable "cursor left the viewport"
    // signal; pointerleave doesn't bubble to window.
    const onPointerOut = () => {
      cursorRef.current = null;
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
        cursorRef.current = null;
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
    <canvas
      ref={canvasRef}
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
    />
  );
}
