import { expect, type Locator, type Page, test } from '@playwright/test';
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
    page.getByRole('button', { name, exact: typeof name === 'string' }).first(),
  );
  await page.keyboard.press('Enter');
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const templateToRegExp = (template: string) =>
  new RegExp(`^${template.split('{name}').map(escapeRegExp).join('(.+)')}$`);

test('keyboard-only main flow', async ({ page, browser }) => {
  const locale = test.info().project.name as Locale;
  const messages = catalogs[locale];
  const object = messages.ObjectStep;
  const store = await installMockApi(page.context());

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
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('combobox', { name: object.rooms.type }),
  ).not.toHaveValue('');
  await fillField(page, object.rooms.length, '5');
  await fillField(page, object.rooms.width, '4');
  await fillField(page, object.rooms.height, '2.7');
  await press(page, messages.Configurator.next);
  await expect(page).toHaveURL(/\/configurator\/engineering$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('status', { name: messages.EngineeringStep.loading }),
  ).toBeHidden();
  const apartmentSwitches = page
    .getByRole('region', { name: messages.EngineeringStep.apartmentTitle })
    .getByRole('switch');
  if ((await apartmentSwitches.count()) > 0) {
    const checkedSwitches = apartmentSwitches.and(
      page.getByRole('switch', { checked: true }),
    );
    const checkedBefore = await checkedSwitches.count();
    await tabTo(
      page,
      apartmentSwitches
        .and(page.getByRole('switch', { checked: false }))
        .first(),
    );
    await page.keyboard.press('Space');
    await expect(checkedSwitches).toHaveCount(checkedBefore + 1);
  }
  await press(page, messages.Configurator.next);
  await expect(page).toHaveURL(/\/configurator\/style$/);
  await press(page, templateToRegExp(messages.StyleStep.chooseLabel));
  await press(page, messages.Configurator.next);
  await expect(page).toHaveURL(/\/configurator\/interior$/);
  const chosenRows = page.getByRole('region').getByRole('list');
  const firstCategory = chosenRows.first().getByRole('button').first();
  await tabTo(page, firstCategory);
  await page.keyboard.press('Enter');
  const pattern = templateToRegExp(messages.ProductShowcase.chooseLabel);
  const candidate = page
    .getByRole('dialog')
    .getByRole('button', { name: pattern, pressed: false })
    .first();
  await expect(candidate).toBeVisible();
  const label = (await candidate.getAttribute('aria-label')) as string;
  const productName = (label.match(pattern) as RegExpMatchArray)[1];
  await tabTo(page, candidate);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    chosenRows
      .first()
      .getByRole('button', { name: new RegExp(escapeRegExp(productName)) }),
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
  await expect(snapshotPage.getByText(productName).first()).toBeVisible();
  await fresh.close();

  const lead = messages.Lead;
  await press(page, lead.open);
  await fillField(page, lead.form.name, 'E2E Roomwise');
  await fillField(page, lead.form.phone, '+380501234567');
  await tabTo(page, page.getByRole('checkbox', { name: lead.form.consent }));
  await page.keyboard.press('Space');
  await press(page, lead.form.submit);
  const [before, after] = lead.confirmation.title
    .split('{number}')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  await expect(
    page.getByText(new RegExp(`^${before}\\d+${after}$`)),
  ).toBeVisible();
});
