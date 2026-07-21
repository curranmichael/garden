import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { soehne, signifier } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Curran Dwyer',
  description: 'Design engineer based in America and Germany',
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
