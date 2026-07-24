/** Complement of the .layout-static condition in globals.css: the
 *  choreographed scene's media query, shared by components that attach
 *  pointer-driven behavior only while that scene is displayed. */
export const CHOREO_MEDIA =
  '(min-width: 768px) and (prefers-reduced-motion: no-preference)';
