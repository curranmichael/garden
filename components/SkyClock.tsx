'use client';

import { useEffect } from 'react';
import { paintSky, SAN_FRANCISCO } from '@/lib/sky';

/**
 * Keeps the sky current after the layout's blocking script paints it:
 * once a minute, and on returning to the tab (background timers are
 * throttled, so a long-hidden tab catches up in one crossfade).
 */
export default function SkyClock() {
  useEffect(() => {
    const paint = () => paintSky(SAN_FRANCISCO);
    paint();
    const id = setInterval(paint, 60_000);
    document.addEventListener('visibilitychange', paint);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', paint);
    };
  }, []);
  return null;
}
