'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { CHOREO_MEDIA } from '@/lib/home/media';
import { CELL_ASPECT, CHARS, COLORS, PALETTE } from './poppyData';
import {
  createPoppyGlRenderer,
  ROT_COEFF,
  ROT_MAX,
  SWELL_DIV,
  SWELL_MAX,
  TILE_PAD,
} from './poppyGl';

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
 * Rendering is two stacked canvases with a rest/motion handoff. At rest, a
 * 2D canvas shows the poster in native fillText (crisp hinted text, zero
 * per-frame cost). The moment glyphs fly, the poster blanks and a WebGL2
 * layer draws every glyph as an instanced quad from a glyph atlas — the
 * per-frame cost is one small buffer upload, not a full-surface raster,
 * which is what made splashes rendering-bound. On settle the poster
 * repaints and the GL layer presents transparent. Without WebGL2 the 2D
 * canvas animates alone, repainting only the dirty region.
 *
 * The component's frame sizes itself in CSS (dvh-proportional, per the
 * Garden-2 Figma frame) and the physics re-derives the glyph grid from its
 * rendered rect, so the parent positions it like any other element. Both
 * canvases bleed BLEED past every edge of the frame so burst glyphs are
 * never clipped mid-flight.
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
  /** Per-glyph force multiplier: deterministic variation (so the motion
   *  isn't uniform) folded together with the petal/foliage mass. */
  forceScale: number;
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

/** Shared geometry for the two stacked bleed canvases. Replaced elements
 *  don't stretch from opposing insets, so the bleed is spelled out as
 *  explicit size + offset. */
const bleedCanvasStyle: CSSProperties = {
  position: 'absolute',
  left: `${(-BLEED / FRAME_ASPECT) * 100}%`,
  top: `${-BLEED * 100}%`,
  width: `${(1 + (2 * BLEED) / FRAME_ASPECT) * 100}%`,
  height: `${(1 + 2 * BLEED) * 100}%`,
  pointerEvents: 'none',
};

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
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
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
    const glCanvas = glCanvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !glCanvas || !frame) return;
    // The default context flags are load-bearing: the canvas must stay
    // transparent (no alpha:false — the page shows through between the
    // glyphs), and nothing may opt into pixel readback (willReadFrequently,
    // getImageData), which would silently drop the canvas off the GPU path.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const renderer = createPoppyGlRenderer(
      glCanvas,
      template.map((t) => ({ char: t.char, color: t.color })),
      FONT,
    );

    let width = 0;
    let height = 0;
    /** The flower's layout box height (the canvas is BLEED larger). */
    let frameH = 0;
    /** Glyph cell height, for dirty-rect margins in the 2D fallback. */
    let cellHpx = 0;
    /** Rendered-size factor applied to every speed/force constant. */
    let scale = 1;
    /** Backing-store pixel ratio, capped: past ~2.5x the extra pixels cost
     *  clear/fill rate every frame with no visible sharpness gain on glyph
     *  art this size (2x laptops are untouched by the cap). */
    let dpr = 1;
    /** True while the poster is blanked and the GL layer is presenting. */
    let glActive = false;

    const particles: Particle[] = template.map((t) => ({
      char: t.char,
      color: t.color,
      petal: t.petal,
      forceScale: t.jitter / (t.petal ? 1 : FOLIAGE_MASS),
      spin: t.spin,
      hx: 0,
      hy: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));
    const splashes: Splash[] = [];
    /** Per-splash invariants, hoisted out of the particle loop each step;
     *  fixed-size so the hot path allocates nothing. */
    const ringX = new Float64Array(MAX_SPLASHES);
    const ringY = new Float64Array(MAX_SPLASHES);
    const ringR = new Float64Array(MAX_SPLASHES);
    const ringAmp = new Float64Array(MAX_SPLASHES);

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
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cellH = box.height / ROWS;
      const cellW = cellH * CELL_ASPECT;
      cellHpx = cellH;
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
      renderer?.resize(width, height, dpr, cellH);
      if (glActive) {
        glActive = false;
        renderer?.clear();
      }
    };

    /** With ?perf in the URL, rolling per-frame averages for the physics
     *  step and the render are logged every 120 frames. */
    const perfOn = new URLSearchParams(window.location.search).has('perf');
    let perfStep = 0;
    let perfRender = 0;
    let perfFrames = 0;

    /** The resting poster: every glyph at home in native fillText. Painted
     *  on transitions only, never per frame. */
    const paintRest = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillText(p.char, p.hx, p.hy);
      }
    };

    /** 2D motion fallback (no WebGL2, or the context died): repaint only
     *  the union of last frame's and this frame's moving-glyph bounds.
     *  Clipping to that union keeps boundary glyphs from double-painting
     *  their antialiased edges; resting glyphs sliced by the boundary
     *  match their stale outside half exactly. */
    let prevDirty: [number, number, number, number] | null = null;
    const draw2DMotion = () => {
      // Covers a fully swelled, fully rotated tile around either endpoint.
      const margin = cellHpx * TILE_PAD * (1 + SWELL_MAX);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let moving = false;
      for (const p of particles) {
        const dx = p.x - p.hx;
        const dy = p.y - p.hy;
        if (dx * dx + dy * dy < 0.25) continue;
        moving = true;
        // Both endpoints: the glyph must be erased where it was drawn and
        // drawn where it is now.
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        if (p.hx < minX) minX = p.hx;
        if (p.hx > maxX) maxX = p.hx;
        if (p.hy < minY) minY = p.hy;
        if (p.hy > maxY) maxY = p.hy;
      }
      const cur: [number, number, number, number] | null = moving
        ? [
            Math.max(0, minX - margin),
            Math.max(0, minY - margin),
            Math.min(width, maxX + margin),
            Math.min(height, maxY + margin),
          ]
        : null;
      const a = cur ?? prevDirty;
      if (!a) return;
      const b = prevDirty ?? a;
      const x0 = Math.min(a[0], b[0]);
      const y0 = Math.min(a[1], b[1]);
      const x1 = Math.max(a[2], b[2]);
      const y1 = Math.max(a[3], b[3]);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
      for (const p of particles) {
        const hit =
          (p.x > x0 - margin &&
            p.x < x1 + margin &&
            p.y > y0 - margin &&
            p.y < y1 + margin) ||
          (p.hx > x0 - margin &&
            p.hx < x1 + margin &&
            p.hy > y0 - margin &&
            p.hy < y1 + margin);
        if (!hit) continue;
        const dx = p.x - p.hx;
        const dy = p.y - p.hy;
        const dsq = dx * dx + dy * dy;
        ctx.fillStyle = p.color;
        if (dsq < 0.25) {
          ctx.fillText(p.char, p.hx, p.hy);
        } else {
          // Tumble and swell with displacement (shared profile with the
          // GL path); one composed matrix instead of save/rotate/scale.
          const theta =
            Math.max(-ROT_MAX, Math.min(ROT_MAX, dx * ROT_COEFF)) * p.spin;
          const m = (1 + Math.min(Math.sqrt(dsq) / SWELL_DIV, SWELL_MAX)) * dpr;
          const cos = Math.cos(theta) * m;
          const sin = Math.sin(theta) * m;
          ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
          ctx.fillText(p.char, 0, 0);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      }
      ctx.restore(); // pops the clip and any leftover glyph matrix
      prevDirty = cur;
    };

    /** One motion frame: GL when available, dirty-rect 2D otherwise. */
    const render = () => {
      if (renderer && !renderer.lost) {
        if (!glActive) {
          // Handoff to the GL layer: blank the poster in the same frame
          // the first GL image presents, so there is no gap or overlap.
          glActive = true;
          ctx.clearRect(0, 0, width, height);
        }
        renderer.render(particles);
      } else {
        if (glActive) {
          // The GL context died mid-flight: repaint the base and continue
          // on the 2D path for the rest of the component's life.
          glActive = false;
          glCanvas.style.display = 'none';
          paintRest();
          prevDirty = null;
        }
        draw2DMotion();
      }
    };

    setup();
    paintRest();

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
      const live = splashes.length;
      if (live) awake = true;
      // Everything that varies per splash but not per glyph is hoisted out
      // of the particle loop. Only the ignition term depends on the pair,
      // so two exps remain inside the crest window (which most pairs skip).
      const invWidth = 1 / (WAVE_WIDTH * scale);
      const invIgnition = 1 / (WAVE_IGNITION * scale);
      const invAtten = 1 / (WAVE_ATTENUATION * scale);
      for (let j = 0; j < live; j++) {
        const s = splashes[j];
        ringX[j] = s.x;
        ringY[j] = s.y;
        ringR[j] = s.age * WAVE_SPEED * scale;
        ringAmp[j] =
          WAVE_FORCE * scale * s.strength * Math.exp(-s.age * WAVE_DECAY);
      }
      for (const p of particles) {
        let fx = 0;
        let fy = 0;
        for (let j = 0; j < live; j++) {
          const dx = p.x - ringX[j];
          const dy = p.y - ringY[j];
          const d = Math.sqrt(dx * dx + dy * dy);
          const off = (d - ringR[j]) * invWidth;
          if (off < -2 || off > 2) continue; // outside the crest
          const ign = d * invIgnition;
          const f =
            ((ringAmp[j] *
              Math.exp(-off * off) *
              (1 - Math.exp(-ign * ign))) /
              (1 + d * invAtten)) *
            p.forceScale;
          fx += (dx / (d || 1)) * f;
          fy += (dy / (d || 1)) * f;
        }
        if (fx === 0 && fy === 0) {
          // No wave under this glyph: fall back into place. Fades toward
          // home so equilibrium stays exactly at (hx, hy).
          const rx = p.x - p.hx;
          const ry = p.y - p.hy;
          const dsq = rx * rx + ry * ry;
          if (dsq > 0.25) {
            fy = GRAVITY * scale * Math.min(Math.sqrt(dsq) / FALL_REF, 1);
          }
        }
        p.vx += (SPRING * (p.hx - p.x) - DAMP * p.vx + fx) * dt;
        p.vy += (SPRING * (p.hy - p.y) - DAMP * p.vy + fy) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Under half a pixel of offset and a couple px/s the remaining
        // drift is invisible; ending the loop here cuts seconds of tail
        // repaints per burst.
        if (
          Math.abs(p.x - p.hx) > 0.4 ||
          Math.abs(p.y - p.hy) > 0.4 ||
          Math.abs(p.vx) > 2 ||
          Math.abs(p.vy) > 2
        ) {
          awake = true;
        }
      }
      return awake;
    };

    const loop = (now: number) => {
      // Clamp dt for spring stability, but no tighter than 15fps: a lower
      // cap would play the physics in slow motion whenever frames drop.
      const dt = Math.min((now - last) / 1000, 1 / 15);
      last = now;
      const t0 = perfOn ? performance.now() : 0;
      const awake = step(dt);
      const t1 = perfOn ? performance.now() : 0;
      render();
      if (perfOn) {
        perfStep += t1 - t0;
        perfRender += performance.now() - t1;
        if (++perfFrames === 120) {
          const mode = renderer && !renderer.lost ? 'gl' : '2d';
          console.log(
            `[poppy] ms/frame avg of 120 — step ${(perfStep / 120).toFixed(2)}, ` +
              `render ${(perfRender / 120).toFixed(2)} via ${mode}`,
          );
          perfStep = perfRender = 0;
          perfFrames = 0;
        }
      }
      if (awake) {
        raf = requestAnimationFrame(loop);
      } else {
        // Every bubble settled: snap exactly home and hand back to the
        // native-text poster.
        for (const p of particles) {
          p.x = p.hx;
          p.y = p.hy;
          p.vx = 0;
          p.vy = 0;
        }
        if (glActive) {
          glActive = false;
          renderer?.clear();
        }
        prevDirty = null;
        paintRest();
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
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= r0) continue;
        const kick =
          PLOP_KICK *
          scale *
          strength *
          Math.sin(Math.PI * (d / r0)) *
          p.forceScale;
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
      prevDirty = null;
      paintRest();
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
      renderer?.dispose();
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
        {/* Rest layer: the native-text poster. */}
        <canvas ref={canvasRef} aria-hidden style={bleedCanvasStyle} />
        {/* Motion layer: instanced glyph sprites while the flower flies. */}
        <canvas ref={glCanvasRef} aria-hidden style={bleedCanvasStyle} />
      </div>
    </div>
  );
}
