import { getTranslations } from 'next-intl/server';
import { themeInitScript } from '@/lib/theme';
import '../styles/global.css';
import { caveat, commissioner, tektur } from './fonts';

export default async function NotFound() {
  const t = await getTranslations({ locale: 'en', namespace: 'NotFound' });

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
      <body>
        <h1>{t('title')}</h1>
        <p>{t('message')}</p>
      </body>
    </html>
  );
}
