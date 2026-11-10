import type { Locator, Page } from '@playwright/test';
import en from '../messages/en.json';
import uk from '../messages/uk.json';

export const catalogs = { en, uk };
export type Locale = keyof typeof catalogs;

async function pressTabUntil(page: Page, reached: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (await reached()) {
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error('The control was not reachable with Tab');
}

const isFocused = (locator: Locator) => () =>
  locator.evaluate((element) => element === document.activeElement);

export async function tabTo(page: Page, locator: Locator) {
  await pressTabUntil(page, isFocused(locator));
}

export async function fillField(page: Page, label: string, value: string) {
  await tabTo(page, page.getByRole('textbox', { name: label, exact: true }));
  await page.keyboard.type(value);
}

export async function press(page: Page, name: string | RegExp) {
  await tabTo(
    page,
    page.getByRole('button', { name, exact: typeof name === 'string' }).first(),
  );
  await page.keyboard.press('Enter');
}

export const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const templateToRegExp = (template: string) =>
  new RegExp(`^${template.split('{name}').map(escapeRegExp).join('(.+)')}$`);
