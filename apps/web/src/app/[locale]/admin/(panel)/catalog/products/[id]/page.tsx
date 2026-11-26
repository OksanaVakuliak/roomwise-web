import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { ProductForm } from '@/features/admin/catalog/products';
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
    namespace: 'AdminCatalog.products.form',
  });

  return { title: t('title') };
}

export default function AdminProductPage({ params }: PageProps) {
  const { locale, id } = use(params);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <ProductForm productId={id} />;
}
