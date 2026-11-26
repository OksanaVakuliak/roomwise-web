import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { CategoryForm } from '@/features/admin/catalog/categories';
import { routing } from '@/i18n/routing';

type PageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: 'AdminCatalog.categories',
  });

  return { title: t('title') };
}

export default function AdminCategoryPage({ params }: PageProps) {
  const { locale, id } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <CategoryForm categoryId={id} />;
}
