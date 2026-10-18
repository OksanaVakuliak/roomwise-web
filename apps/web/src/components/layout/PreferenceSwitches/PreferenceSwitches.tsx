'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { Icon, PrefSwitch } from '@/components/ui';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { currencies } from '@/lib/format';
import { THEME_MODES } from '@/lib/theme';
import { usePreferences } from '@/stores/preferences';
import { usePreferencesHydration } from '@/stores/use-preferences-hydration';

function nextOf<T>(items: readonly T[], current: T): T {
  return items[(items.indexOf(current) + 1) % items.length];
}

export function PreferenceSwitches() {
  const t = useTranslations('Layout');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  usePreferencesHydration();

  const currency = usePreferences((state) => state.currency);
  const theme = usePreferences((state) => state.theme);
  const setLocale = usePreferences((state) => state.setLocale);
  const setCurrency = usePreferences((state) => state.setCurrency);
  const setTheme = usePreferences((state) => state.setTheme);

  const handleChange = useCallback(
    (value: string) => {
      if (value === 'locale') {
        const next = nextOf(routing.locales, locale);
        setLocale(next);
        router.replace(pathname, { locale: next });
      } else if (value === 'currency') {
        setCurrency(nextOf(currencies, currency));
      } else if (value === 'theme') {
        setTheme(nextOf(THEME_MODES, theme));
      }
    },
    [
      currency,
      locale,
      pathname,
      router,
      setCurrency,
      setLocale,
      setTheme,
      theme,
    ],
  );

  const options = useMemo(() => {
    const nextLocale = nextOf(routing.locales, locale);
    const nextCurrency = nextOf(currencies, currency);

    return [
      {
        value: 'locale',
        content: t(`languageCodes.${locale === 'uk' ? 'uk' : 'en'}`),
        label: t('language', { language: t(`languageNames.${nextLocale}`) }),
      },
      {
        value: 'currency',
        content: currency === 'USD' ? '$' : '₴',
        label: t('currency', { currency: nextCurrency }),
      },
      {
        value: 'theme',
        content: (
          <Icon
            name={
              theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'system'
            }
          />
        ),
        label: t('theme', { theme: t(`themes.${theme}`) }),
      },
    ] as const;
  }, [currency, locale, t, theme]);

  return (
    <PrefSwitch
      label={t('prefs')}
      options={options}
      value=""
      onChange={handleChange}
    />
  );
}
