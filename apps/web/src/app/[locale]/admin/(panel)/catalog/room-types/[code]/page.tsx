import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { RoomTypeForm } from '@/features/admin/catalog/room-types';
import { routing } from '@/i18n/routing';

type PageProps = { params: Promise<{ locale: string; code: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: 'AdminCatalog.roomTypes',
  });

  return { title: t('title') };
}

export default function AdminRoomTypePage({ params }: PageProps) {
  const { locale, code } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <RoomTypeForm code={code} />;
}
