import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { StatusPage } from '@/components/layout';
import { ButtonLink } from '@/components/ui';
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
        <NextIntlClientProvider locale="en" messages={{}}>
          <main>
            <StatusPage title={t('title')} message={t('message')}>
              <ButtonLink href="/">{t('home')}</ButtonLink>
            </StatusPage>
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
