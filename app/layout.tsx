import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { soehne, signifier } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Curran Dwyer',
  description: 'Design engineer based in America and Germany',
};

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
    <html lang="en" className={`${soehne.variable} ${signifier.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
