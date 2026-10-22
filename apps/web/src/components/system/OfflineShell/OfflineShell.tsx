'use client';

import { hasLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Brand, Button, EmptyState } from '@/components/ui';
import { routing } from '@/i18n/routing';
import catalogs from '../../../../messages/offline.json';
import styles from './OfflineShell.module.css';

function reload() {
  window.location.reload();
}

function detectLocale() {
  const segment = window.location.pathname.split('/')[1];
  if (hasLocale(routing.locales, segment)) {
    return segment;
  }
  const primary = navigator.language.split('-')[0].toLowerCase();
  return hasLocale(routing.locales, primary) ? primary : routing.defaultLocale;
}

export function OfflineShell() {
  const [locale, setLocale] = useState(routing.defaultLocale);
  const t = catalogs[locale];

  useEffect(() => {
    const detected = detectLocale();
    setLocale(detected);
    document.documentElement.lang = detected;
    document.title = catalogs[detected].title;
  }, []);

  return (
    <>
      <header className={styles.header}>
        <Brand name={t.brandName} caption={t.brandCaption} />
      </header>
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
    </>
  );
}
