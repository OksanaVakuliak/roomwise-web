'use client';

import * as Sentry from '@sentry/nextjs';
import { usePathname } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { useEffect } from 'react';
import { routing } from '@/i18n/routing';
import { themeInitScript } from '@/lib/theme';
import en from '../../messages/en.json';
import uk from '../../messages/uk.json';
import '../styles/global.css';
import styles from './global-error.module.css';

const CATALOGS = { en: en.GlobalError, uk: uk.GlobalError };

function reload() {
  window.location.reload();
}

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const segment = usePathname()?.split('/')[1];
  const locale = hasLocale(routing.locales, segment)
    ? segment
    : routing.defaultLocale;
  const t = CATALOGS[locale];

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <title>{t.title}</title>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static script built from theme constants */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={styles.body}>
        <main className={styles.root}>
          <h1>{t.title}</h1>
          <p className={styles.message}>{t.message}</p>
          <button type="button" onClick={reload}>
            {t.reload}
          </button>
        </main>
      </body>
    </html>
  );
}
