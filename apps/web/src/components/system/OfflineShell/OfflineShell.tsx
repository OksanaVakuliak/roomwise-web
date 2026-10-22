'use client';

import { hasLocale, type Locale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Brand, Button, EmptyState } from '@/components/ui';
import { routing } from '@/i18n/routing';
import catalogs from '../../../../messages/offline.json';
import styles from './OfflineShell.module.css';

function reload() {
  window.location.reload();
}

const LOCALE_COOKIE = 'NEXT_LOCALE';

function readCookie(name: string) {
  const prefix = `${name}=`;
  const entry = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix));
  return entry?.slice(prefix.length);
}

function detectLocale() {
  const candidates = [
    window.location.pathname.split('/')[1],
    readCookie(LOCALE_COOKIE),
    navigator.language.split('-')[0].toLowerCase(),
  ];
  return (
    candidates.find((candidate) => hasLocale(routing.locales, candidate)) ??
    routing.defaultLocale
  );
}

export function OfflineShell() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const t = catalogs[locale ?? routing.defaultLocale];

  useEffect(() => {
    const detected = detectLocale() as Locale;
    setLocale(detected);
    document.documentElement.lang = detected;
    document.title = catalogs[detected].title;
  }, []);

  useEffect(() => {
    window.addEventListener('online', reload);
    return () => window.removeEventListener('online', reload);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <Brand name={t.brandName} caption={locale ? t.brandCaption : ''} />
      </header>
      {locale ? (
        <main className={styles.main}>
          <div role="status">
            <EmptyState
              icon="link"
              title={t.title}
              text={t.message}
              headingLevel={2}
              action={
                <Button kind="fill" onClick={reload}>
                  {t.retry}
                </Button>
              }
            />
          </div>
        </main>
      ) : null}
    </>
  );
}
