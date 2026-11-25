import type { ReactNode } from 'react';
import {
  AppFooter,
  AppHeader,
  ExchangeRateNotice,
  MAIN_ID,
  NoticeStack,
  SkipLink,
} from '@/components/layout';
import { PricingDataSync, UpdateNotice } from '@/components/system';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PricingDataSync />
      <SkipLink />
      <AppHeader />
      <main id={MAIN_ID} tabIndex={-1}>
        {children}
      </main>
      <AppFooter />
      <NoticeStack>
        <ExchangeRateNotice />
        <UpdateNotice />
      </NoticeStack>
    </>
  );
}
