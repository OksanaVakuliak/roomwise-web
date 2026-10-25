import { SerwistProvider } from '@serwist/turbopack/react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import {
  AppFooter,
  AppHeader,
  ExchangeRateNotice,
  MAIN_ID,
  NoticeStack,
  SkipLink,
} from '@/components/layout';
import {
  PricingDataSync,
  UpdateNotice,
  WarmupStarter,
} from '@/components/system';
import { routing } from '@/i18n/routing';
import { SHORT_NAME, workerUrl } from '@/lib/pwa';
import { QueryProvider } from '@/lib/query';
import { themeInitScript } from '@/lib/theme';
import { caveat, commissioner, tektur } from '../fonts';
import '../../styles/global.css';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
    manifest: `/${locale}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: SHORT_NAME },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const fontClasses = `${tektur.variable} ${commissioner.variable} ${caveat.variable}`;

  return (
    <html lang={locale} className={fontClasses} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static script built from theme constants */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SerwistProvider
          swUrl={workerUrl(
            '/serwist/sw.js',
            process.env.NEXT_PUBLIC_APP_VERSION,
          )}
          disable={process.env.NODE_ENV === 'development'}
          reloadOnOnline={false}
        >
          <NextIntlClientProvider>
            <QueryProvider>
              <WarmupStarter />
              <PricingDataSync />
              <SkipLink />
              <AppHeader />
              <main id={MAIN_ID} tabIndex={-1}>
                {children}
              </main>
              <AppFooter />
              <NoticeStack>
                <ExchangeRateNotice />
                <UpdateNotice />
              </NoticeStack>
            </QueryProvider>
          </NextIntlClientProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
