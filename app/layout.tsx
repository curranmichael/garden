import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import SkyClock from '@/components/SkyClock';
import { soehne, signifier } from '@/lib/fonts';
import { paintSky, SAN_FRANCISCO } from '@/lib/sky';
import './globals.css';

/** Paints the sky before first paint, so the page never flashes the
 *  stylesheet's fallback scheme. */
const skyScript = `(${paintSky.toString()})(${JSON.stringify(SAN_FRANCISCO)})`;

export const metadata: Metadata = {
  title: 'Curran Dwyer',
  description: 'Design engineer based in America and Germany',
};

// The no-JS fallback; paintSky retints these metas to the current sky.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#161615' },
    { media: '(prefers-color-scheme: light)', color: '#fdfdfc' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The sky script writes inline styles on <html> before hydration.
    <html
      lang="en"
      className={`${soehne.variable} ${signifier.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: skyScript }} />
      </head>
      <body>
        {children}
        <SkyClock />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
