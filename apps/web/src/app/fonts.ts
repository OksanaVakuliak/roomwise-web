import { Caveat, Commissioner, Tektur } from 'next/font/google';

export const tektur = Tektur({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-tektur',
});

export const commissioner = Commissioner({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-commissioner',
});

export const caveat = Caveat({
  subsets: ['latin', 'cyrillic'],
  weight: ['600'],
  display: 'swap',
  variable: '--font-caveat',
});
