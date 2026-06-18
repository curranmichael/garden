import localFont from 'next/font/local';

export const soehne = localFont({
  src: [
    { path: '../public/fonts/soehne-leicht.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/soehne-buch.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/soehne-kraftig.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/soehne-dreiviertelfett.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-soehne',
  display: 'swap',
});

export const signifier = localFont({
  src: [
    { path: '../public/fonts/signifier-light.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/signifier-light-italic.woff2', weight: '300', style: 'italic' },
    { path: '../public/fonts/signifier-regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/signifier-regular-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-signifier',
  display: 'swap',
});
