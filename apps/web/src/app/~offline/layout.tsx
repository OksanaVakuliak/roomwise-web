import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { THEME_COLORS, themeInitScript } from '@/lib/theme';
import { caveat, commissioner, tektur } from '../fonts';
import '../../styles/global.css';

export const metadata: Metadata = {
  title: 'Roomwise',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: THEME_COLORS.light };

export default function OfflineLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${tektur.variable} ${commissioner.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static script built from theme constants */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
