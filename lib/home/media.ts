/** Complement of the .layout-static condition in globals.css: the
 *  choreographed scene's media query, shared by components that attach
 *  pointer-driven behavior only while that scene is displayed. */
export const CHOREO_MEDIA =
  '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

/** The static layout's tap-burst window: phones that haven't asked for
 *  reduced motion. Deliberately the intersection complement of
 *  CHOREO_MEDIA, not its negation — reduced-motion users get no bursts
 *  on any width. */
export const STATIC_BURST_MEDIA =
  '(max-width: 767px) and (prefers-reduced-motion: no-preference)';
