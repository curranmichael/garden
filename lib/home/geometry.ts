/**
 * Scroll-choreography geometry, from the Garden Figma frames (1280x832).
 * Every coordinate the interaction depends on lives here; components and
 * the choreography hook consume these instead of raw numbers.
 */

/** Panel top when fully docked. */
export const DOCK_TOP = 52;
/** Height of the folder tab; the panel body starts this far below panel top. */
export const TAB_HEIGHT = 55;
/** Resting y of the name line. */
export const NAME_REST = 150;
/** Gap the name keeps above the rising panel once it gets pushed. */
export const NAME_PUSH = 39;
/** Fixed y of the bio block (the panel rises over it). */
export const BIO_TOP = 189;
/** Nav baseline offset inside the tab: nav y = panel top + this. */
export const NAV_IN_TAB = 13;
/** First tile row offset from panel top. */
export const GRID_HEAD = 76;
/** Horizontal gap between nav labels. */
export const NAV_GAP = 50;
/** Tab side padding beyond the label on each side. */
export const TAB_PAD = 20;

/** Resting panel top for a given viewport height (mirrors --panel-rest in CSS). */
export function panelRest(viewportHeight: number): number {
  return Math.min(520, Math.max(320, viewportHeight * 0.5));
}

/** Panel top for a scroll offset: rises from rest, docks at DOCK_TOP. */
export function panelTop(scroll: number, rest: number): number {
  return Math.max(DOCK_TOP, rest - scroll);
}

/** Name line y: static until the panel approaches, then pushed up ahead of it. */
export function nameY(panel: number): number {
  return Math.min(NAME_REST, panel - NAME_PUSH);
}

/** Scroll distance needed for the panel to dock. */
export function dockScroll(rest: number): number {
  return rest - DOCK_TOP;
}

/** How far the grid has scrolled inside the docked panel. */
export function gridY(scroll: number, rest: number, max: number): number {
  return Math.min(max, Math.max(0, scroll - dockScroll(rest)));
}
