import { useEffect, type RefObject } from 'react';
import {
  DOCK_TOP,
  NAME_TO_BIO,
  TAB_HEIGHT,
  dockScroll,
  gridY,
  nameRest,
  nameY,
  panelRest,
  panelTop,
} from './geometry';

interface Options {
  /** Element that receives the choreography CSS custom properties. */
  rootRef: RefObject<HTMLElement | null>;
  /** Tile grid element, measured to size the post-dock scroll range. */
  gridRef: RefObject<HTMLElement | null>;
  /** Bio block, measured to center the header above the resting panel. */
  bioRef: RefObject<HTMLElement | null>;
  /** Choreography only responds to scroll while a section is active. */
  active: boolean;
}

/** Complement of the .layout-static condition in globals.css. */
const CHOREO_MEDIA =
  '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

/**
 * Drives the scroll choreography by writing CSS custom properties inside a
 * rAF-coalesced passive scroll listener. React never re-renders per frame;
 * layers consume the variables with transform-only styles.
 */
export function useScrollChoreography({
  rootRef,
  gridRef,
  bioRef,
  active,
}: Options) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const start = () => {
      const prevRestoration = history.scrollRestoration;
      history.scrollRestoration = 'manual';

      let rest = panelRest(window.innerHeight);
      let nameRestY = 0;
      let maxGrid = 0;
      let raf = 0;

      const apply = () => {
        const scroll = active ? window.scrollY : 0;
        const panel = panelTop(scroll, rest);
        root.style.setProperty('--panel-top', `${panel}px`);
        root.style.setProperty('--name-y', `${nameY(panel, nameRestY)}px`);
        root.style.setProperty('--grid-y', `${-gridY(scroll, rest, maxGrid)}px`);
      };

      const measure = () => {
        const vh = window.innerHeight;
        rest = panelRest(vh);
        const bioHeight = bioRef.current?.offsetHeight ?? 78;
        nameRestY = nameRest(rest, NAME_TO_BIO + bioHeight);
        const gridHeight = gridRef.current?.offsetHeight ?? 0;
        maxGrid = Math.max(0, gridHeight - (vh - DOCK_TOP - TAB_HEIGHT));
        root.style.setProperty('--panel-rest', `${rest}px`);
        root.style.setProperty('--bio-top', `${nameRestY + NAME_TO_BIO}px`);
        root.style.setProperty('--scroll-range', `${dockScroll(rest) + maxGrid}px`);
        apply();
      };

      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          apply();
        });
      };

      measure();
      // Signifier loads with display: swap; the bio can rewrap when it lands.
      document.fonts.ready.then(() => measure());
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', measure);
      return () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', measure);
        history.scrollRestoration = prevRestoration;
      };
    };

    // The static layout scrolls natively and keeps the browser's scroll
    // restoration; only run while the choreographed scene is displayed.
    const mql = window.matchMedia(CHOREO_MEDIA);
    let stop: (() => void) | null = null;
    const sync = () => {
      if (mql.matches && !stop) {
        stop = start();
      } else if (!mql.matches && stop) {
        stop();
        stop = null;
      }
    };
    sync();
    mql.addEventListener('change', sync);
    return () => {
      mql.removeEventListener('change', sync);
      stop?.();
    };
  }, [rootRef, gridRef, bioRef, active]);
}
