import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { publicEnv } from '@/config/public-env';
import { routing } from '@/i18n/routing';
import { ShowcaseToolbar } from './ShowcaseToolbar';
import { SHOWCASE_SECTIONS } from './sections';
import styles from './showcase.module.css';
import { isShowcaseEnabled } from './showcase-access';

type ShowcaseProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: ShowcaseProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Showcase' });

  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function ShowcasePage({ params }: ShowcaseProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const enabled = isShowcaseEnabled({
    nodeEnv: process.env.NODE_ENV,
    flag: publicEnv.NEXT_PUBLIC_SHOWCASE_ENABLED,
  });

  if (!enabled) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations('Showcase');

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <ShowcaseToolbar />
      </header>
      <nav aria-label={t('navLabel')} className={styles.nav}>
        <ul className={styles.navList}>
          {SHOWCASE_SECTIONS.map((section) => (
            <li key={section}>
              <a href={`#${section}`} className={styles.navLink}>
                {t(`sections.${section}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {SHOWCASE_SECTIONS.map((section) => (
        <section
          key={section}
          id={section}
          aria-labelledby={`${section}-title`}
          className={styles.section}
        >
          <h2 id={`${section}-title`} className={styles.sectionTitle}>
            {t(`sections.${section}`)}
          </h2>
          <p className={styles.empty}>{t('empty')}</p>
        </section>
      ))}
    </main>
  );
}
