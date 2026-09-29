import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { themeInitScript } from '@/lib/theme';
import { caveat, commissioner, tektur } from './fonts';
import '../styles/global.css';

export const metadata: Metadata = {
  title: 'Roomwise',
  description: 'Roomwise renovation cost configurator',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontClasses = `${tektur.variable} ${commissioner.variable} ${caveat.variable}`;

  return (
    <html lang="en" className={fontClasses} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static script built from theme constants */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
