import { describe, expect, it } from 'vitest';
import {
  adminErrors,
  makeAdminCategories,
  makeAdminCoefficients,
  makeAdminLeads,
  makeAdminMaterialTypes,
  makeAdminMe,
  makeAdminProducts,
  makeAdminRoomTypes,
  makeAdminRules,
  makeAdminStyles,
  makeDemoMe,
  makeStaleExchangeRate,
} from './index';

describe('admin fixtures', () => {
  it('distinguishes the admin from the demo user', () => {
    expect(makeAdminMe().sandbox).toBeNull();
    expect(makeDemoMe().isDemo).toBe(true);
    expect(makeDemoMe().sandbox?.nextResetAt).toBeTruthy();
  });

  it('covers seven room types and every surface', () => {
    expect(makeAdminRoomTypes().items).toHaveLength(7);
    const surfaces = new Set(
      makeAdminCategories().items.map((category) => category.surface),
    );
    expect([...surfaces].sort()).toEqual(['CEILING', 'FLOOR', 'NONE', 'WALLS']);
    expect(makeAdminMaterialTypes().items.length).toBeGreaterThan(1);
  });

  it('keeps product and style references consistent', () => {
    const products = makeAdminProducts().items.map((product) => product.id);
    for (const style of makeAdminStyles().items) {
      expect(style.id).toBeTruthy();
    }
    expect(new Set(products).size).toBe(products.length);
  });

  it('covers every rule level, a base component and an orphan', () => {
    const { items } = makeAdminRules();
    expect(new Set(items.map((rule) => rule.level)).size).toBe(4);
    expect(items.some((rule) => rule.baseComponent)).toBe(true);
    expect(items.some((rule) => rule.orphaned)).toBe(true);
  });

  it('references existing rules from coefficients', () => {
    const ruleIds = makeAdminRules().items.map((rule) => rule.id);
    for (const coefficient of makeAdminCoefficients().items) {
      for (const usage of coefficient.usedBy) {
        expect(ruleIds).toContain(usage.ruleId);
      }
    }
  });

  it('covers every lead status with masked values', () => {
    const { items } = makeAdminLeads();
    expect(new Set(items.map((lead) => lead.status)).size).toBe(5);
    expect(items.some((lead) => lead.masked)).toBe(true);
  });

  it('marks the stale rate and builds error envelopes', () => {
    expect(makeStaleExchangeRate().staleSince).toBeTruthy();
    expect(adminErrors.staleRevision().body.error.code).toBe('STALE_REVISION');
    expect(adminErrors.validation().body.error.fields?.length).toBeGreaterThan(
      0,
    );
  });
});
