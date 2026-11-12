/**
 * The page's colors follow the sky over San Francisco. Each palette is
 * pinned to a solar elevation, and the page takes the blend for where the
 * sun stands right now: sand-dark night, a blue hour around sunset and
 * sunrise, a warm cream at golden hour, sand-light by day. The light/dark
 * flip happens at the official horizon (-0.833°, refraction plus the
 * sun's radius), so each side stays legible across its whole ramp.
 *
 * The sun's elevation at a fixed place depends only on the instant, so
 * the visitor's own timezone and DST never enter the math.
 */

type Palette = Record<'page' | 'ink' | 'muted' | 'tile', string>;

interface SkyStop {
  /** Solar elevation (degrees) at which this palette holds in full. */
  at: number;
  palette: Palette;
}

export interface Sky {
  lat: number;
  lon: number;
  /** Elevation of the light/dark flip. */
  horizon: number;
  /** Ascending stops below the horizon (dark pages)… */
  below: SkyStop[];
  /** …and above it (light pages). */
  above: SkyStop[];
}

export const SAN_FRANCISCO: Sky = {
  lat: 37.7749,
  lon: -122.4194,
  horizon: -0.833,
  below: [
    // Night from the end of nautical twilight: the original sandDark
    // scheme.
    {
      at: -12,
      palette: { page: '#161615', ink: '#ededec', muted: '#a1a09a', tile: '#d9d9d9' },
    },
    // Blue hour, held through civil twilight to the horizon.
    {
      at: -4,
      palette: { page: '#181c27', ink: '#eceef3', muted: '#a2a7b5', tile: '#d6d9e1' },
    },
  ],
  above: [
    // Golden hour, from the moment the sun clears the horizon.
    {
      at: -0.833,
      palette: { page: '#fbf0e2', ink: '#231b13', muted: '#78685a', tile: '#3a3027' },
    },
    // Full day: the original light sand scheme.
    {
      at: 10,
      palette: { page: '#fdfdfc', ink: '#1b1b18', muted: '#706f6c', tile: '#2e2e2b' },
    },
  ],
};

/**
 * Paints the current sky onto <html> as inline custom properties, plus
 * color-scheme and the theme-color metas. Self-contained (no module
 * scope) because the layout also inlines its source as a blocking
 * script, so the first paint already has the right colors.
 *
 * `?at=HH:MM` previews that San Francisco wall-clock time today.
 */
export function paintSky(sky: Sky): void {
  let now = Date.now();
  const at = /^(\d{1,2}):(\d{2})$/.exec(
    new URLSearchParams(location.search).get('at') ?? '',
  );
  if (at) {
    const [h, m] = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .format(now)
      .split(':')
      .map(Number);
    now += (+at[1] * 60 + +at[2] - (h * 60 + m)) * 60000;
  }

  // Solar elevation, low-precision almanac (~0.01°): days since J2000,
  // the sun's ecliptic longitude, then equatorial coordinates and the
  // local hour angle.
  const rad = Math.PI / 180;
  const d = now / 86400000 - 10957.5;
  const g = (357.529 + 0.98560028 * d) * rad;
  const lambda =
    (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) *
    rad;
  const tilt = (23.439 - 0.00000036 * d) * rad;
  const ra = Math.atan2(Math.cos(tilt) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(tilt) * Math.sin(lambda));
  const gmst = (280.46061837 + 360.98564736629 * d) * rad;
  const hourAngle = gmst + sky.lon * rad - ra;
  const lat = sky.lat * rad;
  const elevation =
    Math.asin(
      Math.sin(lat) * Math.sin(dec) +
        Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle),
    ) / rad;

  // Blend between the two stops bracketing the sun, eased so each
  // palette lingers near its own elevation.
  const stops = elevation < sky.horizon ? sky.below : sky.above;
  let i = 0;
  while (i < stops.length - 2 && elevation > stops[i + 1].at) i++;
  const lo = stops[i];
  const hi = stops[Math.min(i + 1, stops.length - 1)];
  const span = hi.at - lo.at;
  const x = span ? Math.min(Math.max((elevation - lo.at) / span, 0), 1) : 0;
  const t = x * x * (3 - 2 * x);
  const mix = (a: string, b: string) =>
    '#' +
    [1, 3, 5]
      .map((k) => {
        const ca = parseInt(a.slice(k, k + 2), 16);
        const cb = parseInt(b.slice(k, k + 2), 16);
        return Math.round(ca + (cb - ca) * t)
          .toString(16)
          .padStart(2, '0');
      })
      .join('');

  const root = document.documentElement;
  for (const key of ['page', 'ink', 'muted', 'tile'] as const) {
    root.style.setProperty(`--${key}`, mix(lo.palette[key], hi.palette[key]));
  }
  root.style.colorScheme = elevation < sky.horizon ? 'dark' : 'light';
  const page = root.style.getPropertyValue('--page');
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => (meta.content = page));
}
