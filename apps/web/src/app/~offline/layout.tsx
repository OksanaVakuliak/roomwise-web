import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SHORT_NAME } from '@/lib/pwa';
import { themeInitScript } from '@/lib/theme';
import { caveat, commissioner, tektur } from '../fonts';
import '../../styles/global.css';

export const metadata: Metadata = {
  title: SHORT_NAME,
  robots: { index: false, follow: false },
};

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
