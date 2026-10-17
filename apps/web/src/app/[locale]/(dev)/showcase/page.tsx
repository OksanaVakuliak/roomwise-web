import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { publicEnv } from '@/config/public-env';
import { routing } from '@/i18n/routing';
import { Showcase } from './Showcase';
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

  return <Showcase />;
}
