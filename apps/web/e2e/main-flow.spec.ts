import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  makeEngineering,
  makeProductCard,
  makeRoomTypes,
  makeStyles,
  productIds,
} from '@/test/fixtures';
import en from '../messages/en.json';
import uk from '../messages/uk.json';
import { installMockApi } from './mock-api';

const catalogs = { en, uk };
type Locale = keyof typeof catalogs;

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

async function tabTo(page: Page, locator: Locator) {
  await pressTabUntil(page, isFocused(locator));
}

async function fillField(page: Page, label: string, value: string) {
  await tabTo(page, page.getByRole('textbox', { name: label, exact: true }));
  await page.keyboard.type(value);
}

async function press(page: Page, name: string | RegExp) {
  await tabTo(
    page,
    page.getByRole('button', { name, exact: typeof name === 'string' }),
  );
  await page.keyboard.press('Enter');
}

test('keyboard-only main flow', async ({ page, browser }) => {
  const locale = test.info().project.name as Locale;
  const messages = catalogs[locale];
  const object = messages.ObjectStep;
  const store = await installMockApi(page.context());
  const livingRoom = makeRoomTypes().items[0].name;

  await page.goto(`/${locale}/configurator/object`);
  await tabTo(page, page.getByRole('radio', { name: object.form.finishRough }));
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('radio', { name: object.form.finishPre }),
  ).toBeChecked();
  await fillField(page, object.form.totalArea, '60');
  await press(page, object.rooms.add);
  await expect(
    page.getByRole('combobox', { name: object.rooms.type }),
  ).toBeFocused();
  await page.keyboard.type(livingRoom);
  await fillField(page, object.rooms.length, '5');
  await fillField(page, object.rooms.width, '4');
  await fillField(page, object.rooms.height, '2.7');
  await press(page, messages.Configurator.next);
  await expect(page).toHaveURL(/\/configurator\/engineering$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const [ac] = makeEngineering().options;
  const airConditioner = page.getByRole('switch', { name: ac.name });
  await tabTo(page, airConditioner);
  await page.keyboard.press('Space');
  await expect(airConditioner).toBeChecked();
  await press(page, messages.Configurator.next);
  await expect(page).toHaveURL(/\/configurator\/style$/);
  const [modern] = makeStyles().items;
  await press(
    page,
    messages.StyleStep.chooseLabel.replace('{name}', modern.name),
  );
  await press(page, messages.Configurator.next);
  await expect(page).toHaveURL(/\/configurator\/interior$/);
  const tile = makeProductCard(productIds.tile);
  await press(page, new RegExp(makeProductCard().name));
  await press(
    page,
    messages.ProductShowcase.chooseLabel.replace('{name}', tile.name),
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    page.getByRole('button', { name: new RegExp(tile.name) }),
  ).toBeVisible();
  await press(page, messages.Configurator.next);
  await expect(page).toHaveURL(/\/configurator\/result$/);
  await press(page, messages.SaveCalculation.save);
  const snapshotLink = page.getByRole('link', {
    name: messages.SavedLink.open,
  });
  await expect(snapshotLink).toBeVisible();
  const snapshotPath = await snapshotLink.getAttribute('href');
  expect(snapshotPath).toContain(`/${locale}/calculations/`);

  const fresh = await browser.newContext({
    locale,
    viewport: page.viewportSize() ?? undefined,
  });
  await installMockApi(fresh, store);
  const snapshotPage = await fresh.newPage();
  await snapshotPage.goto(snapshotPath as string);
  await expect(
    snapshotPage.getByRole('heading', {
      level: 1,
      name: messages.CalculationPage.heading,
    }),
  ).toBeVisible();
  await expect(
    snapshotPage.getByRole('heading', {
      level: 2,
      name: new RegExp(messages.CalculationPage.totalLabel),
    }),
  ).toBeVisible();
  await expect(
    snapshotPage.getByText(makeProductCard().name).first(),
  ).toBeVisible();
  await fresh.close();

  const lead = messages.Lead;
  await press(page, lead.open);
  await fillField(page, lead.form.name, 'Olena Kovalenko');
  await fillField(page, lead.form.phone, '+380501234567');
  await tabTo(page, page.getByRole('checkbox', { name: lead.form.consent }));
  await page.keyboard.press('Space');
  const leadNumber = String(store.leadCount + 1);
  await press(page, lead.form.submit);
  await expect(
    page.getByText(lead.confirmation.title.replace('{number}', leadNumber)),
  ).toBeVisible();
});
