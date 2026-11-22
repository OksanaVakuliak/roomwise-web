import type { components } from '@/generated/api';
import { adminIds } from './ids';

export type AdminMe = components['schemas']['AdminMeDto_Output'];

export function makeAdminMe(overrides: Partial<AdminMe> = {}): AdminMe {
  return {
    id: adminIds.admin,
    login: 'admin',
    isDemo: false,
    sandbox: null,
    demoLimits: null,
    ...overrides,
  };
}

export function makeDemoMe(overrides: Partial<AdminMe> = {}): AdminMe {
  return {
    id: adminIds.demo,
    login: 'demo',
    isDemo: true,
    sandbox: {
      nextResetAt: '2026-11-22T03:00:00.000Z',
      resetTime: '03:00',
      timezone: 'Europe/Kyiv',
    },
    demoLimits: { writesPerHour: 60, uploadsPerHour: 10 },
    ...overrides,
  };
}
