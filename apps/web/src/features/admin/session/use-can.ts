'use client';

import { useTranslations } from 'next-intl';
import { useAdminSession } from './context';

export type AdminAction =
  | 'change-password'
  | 'lead-status'
  | 'lead-notes'
  | 'lead-delete'
  | 'settings';

const DEMO_REASONS = {
  'change-password': 'password',
  'lead-status': 'leads',
  'lead-notes': 'leads',
  'lead-delete': 'leads',
  settings: 'settings',
} as const satisfies Record<AdminAction, 'password' | 'leads' | 'settings'>;

export type Can = { allowed: true } | { allowed: false; reason: string };

export function useCan(action: AdminAction): Can {
  const { session } = useAdminSession();
  const t = useTranslations('Admin.demo.reason');
  if (session.status === 'authenticated' && session.me.isDemo) {
    return { allowed: false, reason: t(DEMO_REASONS[action]) };
  }
  return { allowed: true };
}
