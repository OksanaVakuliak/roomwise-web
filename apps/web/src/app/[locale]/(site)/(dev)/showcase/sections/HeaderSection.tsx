'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Brand, Icon, PrefSwitch } from '@/components/ui';

const noop = () => undefined;

export function HeaderSection() {
  const t = useTranslations('ShowcaseHeader');
  const [language, setLanguage] = useState('uk');
  const [currency, setCurrency] = useState('usd');
  const [choice, setChoice] = useState('uk');

  const languageOption = {
    value: 'uk',
    content: t('prefLangAlt'),
    label: t('prefLanguage'),
  };
  const currencyOption = {
    value: 'usd',
    content: '$',
    label: t('prefCurrency'),
  };
  const themeOption = {
    value: 'theme',
    content: <Icon name="moon" />,
    label: t('prefTheme'),
  };

  return (
    <>
      <h3>{t('brandHeading')}</h3>
      <p>{t('brandMobile')}</p>
      <Brand name={t('brandName')} caption={t('brandCaption')} />
      <p>{t('brandDesktop')}</p>
      <Brand name={t('brandName')} caption={t('brandCaption')} size="desktop" />

      <h3>{t('prefHeading')}</h3>
      <p>{t('prefThree')}</p>
      <PrefSwitch
        label={t('prefGroup')}
        options={[languageOption, currencyOption, themeOption]}
        value={language}
        onChange={setLanguage}
      />
      <p>{t('prefTwo')}</p>
      <PrefSwitch
        label={t('prefGroup')}
        options={[languageOption, currencyOption]}
        value={currency}
        onChange={setCurrency}
      />
      <p>{t('prefSelected')}</p>
      <PrefSwitch
        label={t('prefGroup')}
        options={[languageOption, currencyOption]}
        value="usd"
        onChange={noop}
      />
      <p>{t('prefInteractive')}</p>
      <PrefSwitch
        label={t('prefGroup')}
        options={[
          { value: 'en', content: t('prefLangValue') },
          languageOption,
          currencyOption,
        ]}
        value={choice}
        onChange={setChoice}
      />
    </>
  );
}
