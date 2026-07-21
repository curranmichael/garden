import { useEffect, type RefObject } from 'react';
import {
  DOCK_TOP,
  TAB_HEIGHT,
  dockScroll,
  gridY,
  nameY,
  panelRest,
  panelTop,
} from './geometry';

interface Options {
  /** Element that receives the choreography CSS custom properties. */
  rootRef: RefObject<HTMLElement | null>;
  /** Tile grid element, measured to size the post-dock scroll range. */
  gridRef: RefObject<HTMLElement | null>;
  /** Choreography only responds to scroll while a section is active. */
  active: boolean;
}

/**
 * Drives the scroll choreography by writing CSS custom properties inside a
 * rAF-coalesced passive scroll listener. React never re-renders per frame;
 * layers consume the variables with transform-only styles.
 */
export function useScrollChoreography({ rootRef, gridRef, active }: Options) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    history.scrollRestoration = 'manual';

    let rest = panelRest(window.innerHeight);
    let maxGrid = 0;
    let raf = 0;

    const apply = () => {
      const scroll = active ? window.scrollY : 0;
      const panel = panelTop(scroll, rest);
      root.style.setProperty('--panel-top', `${panel}px`);
      root.style.setProperty('--name-y', `${nameY(panel)}px`);
      root.style.setProperty('--grid-y', `${-gridY(scroll, rest, maxGrid)}px`);
    };

    const measure = () => {
      const vh = window.innerHeight;
      rest = panelRest(vh);
      const gridHeight = gridRef.current?.offsetHeight ?? 0;
      maxGrid = Math.max(0, gridHeight - (vh - DOCK_TOP - TAB_HEIGHT));
      root.style.setProperty('--panel-rest', `${rest}px`);
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
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, [rootRef, gridRef, active]);
}
