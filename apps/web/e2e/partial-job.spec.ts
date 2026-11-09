import { expect, type Page, test } from '@playwright/test';
import { moneyMinor } from '@/lib/format';
import { categoryIds, makePricingData, productIds } from '@/test/fixtures';
import {
  catalogs,
  escapeRegExp,
  fillField,
  type Locale,
  press,
  tabTo,
  templateToRegExp,
} from './keyboard';
import { installMockApi, isLive } from './mock-api';

const ROOM = { length: 4, width: 3, height: 2.7 };
const AREA = ROOM.length * ROOM.width;

const pricing = makePricingData();
const laminate = pricing.products.find(
  (product) => product.id === productIds.laminate,
);
const floor = pricing.categories.find(
  (category) => category.id === categoryIds.floor,
);
const { coefficients } = pricing;

const toCents = (dollars: number) => Math.round(dollars * 100);
const materialCents = toCents(
  AREA *
    (1 + (laminate?.wastePercentOverride ?? floor?.wastePercent ?? 0) / 100) *
    ((laminate?.priceCents ?? 0) / 100 + coefficients.laminate_underlay),
);
const laborCents = toCents(AREA * coefficients.labor_laminate);
const demolitionCents = toCents(
  AREA *
    (coefficients.prep_floor_demolition + coefficients.mat_demolition_disposal),
);
const lineCents = materialCents + laborCents + demolitionCents;

const dollars = (cents: number, locale: Locale) =>
  moneyMinor(cents, 'USD', locale);

async function fillObject(page: Page, locale: Locale) {
  const object = catalogs[locale].ObjectStep;
  await press(page, object.rooms.add);
  const type = page.getByRole('combobox', { name: object.rooms.type });
  await type.selectOption({ label: 'Bedroom' });
  await fillField(page, object.rooms.length, String(ROOM.length));
  await fillField(page, object.rooms.width, String(ROOM.width));
  await fillField(page, object.rooms.height, String(ROOM.height));
}

async function goToInterior(page: Page, locale: Locale) {
  const { next } = catalogs[locale].Configurator;
  for (const step of ['engineering', 'style', 'interior']) {
    await press(page, next);
    await expect(page).toHaveURL(new RegExp(`/configurator/${step}$`));
  }
}

async function openBreakdown(page: Page, locale: Locale) {
  const toggle = page.getByRole('button', {
    name: catalogs[locale].Configurator.toggleLabel,
  });
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeEnabled();
  await expect(async () => {
    if ((await toggle.getAttribute('aria-expanded')) === 'false') {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true', {
      timeout: 1000,
    });
  }).toPass();
}

test('separate works: one enabled floor is priced from its components', async ({
  page,
}) => {
  test.skip(isLive(), 'relies on the mocked catalog');
  const locale = test.info().project.name as Locale;
  const messages = catalogs[locale];
  const object = messages.ObjectStep;
  await installMockApi(page.context());

  await page.goto(`/${locale}/configurator/object`);
  await tabTo(page, page.getByRole('radio', { name: object.form.scopeFull }));
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('radio', { name: object.form.scopePartial }),
  ).toBeChecked();
  await tabTo(page, page.getByRole('radio', { name: object.form.finishRough }));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('radio', { name: object.form.finishLivedIn }),
  ).toBeChecked();
  await fillObject(page, locale);
  await goToInterior(page, locale);

  await expect(page.getByText(messages.Specification.enableHint)).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^${escapeRegExp(messages.ChosenList.remove)}`),
    }),
  ).toHaveCount(0);

  const addFloor = page
    .getByRole('button', {
      name: templateToRegExp(
        messages.ChosenList.addLabel
          .replace('{category}', 'Flooring')
          .replace('{room}', '{name}'),
      ),
    })
    .first();
  await tabTo(page, addFloor);
  await page.keyboard.press('Enter');
  const laminateCard = page.getByRole('dialog').getByRole('button', {
    name: messages.ProductShowcase.chooseLabel.replace(
      '{name}',
      'Oak Natural Laminate',
    ),
  });
  await expect(laminateCard).toBeVisible();
  await tabTo(page, laminateCard);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  const components = messages.Specification.components;
  const floorLine = page
    .getByRole('listitem')
    .filter({ hasText: components.material })
    .filter({ hasText: components.labor })
    .last();
  const row = (label: string) =>
    floorLine.getByRole('listitem').filter({
      has: page.getByText(label, { exact: true }),
    });
  await expect(row(components.material)).toContainText(
    dollars(materialCents, locale),
  );
  await expect(row(components.labor)).toContainText(
    dollars(laborCents, locale),
  );
  await expect(row(components.prep)).toContainText(
    dollars(demolitionCents, locale),
  );

  await openBreakdown(page, locale);
  const worksAndMaterials = page
    .locator('dt', { hasText: messages.CostPanel.worksAndMaterials })
    .locator('xpath=following-sibling::dd[1]');
  await expect(worksAndMaterials).toHaveText(dollars(lineCents, locale));
  await expect(
    page.getByRole('button', { name: messages.CostPanel.base }),
  ).toHaveCount(0);
  await expect(
    page.getByText(messages.CostPanel.base, { exact: true }),
  ).toHaveCount(0);
});

test('full renovation: the default style fills the categories and the base shows its breakdown', async ({
  page,
}) => {
  test.skip(isLive(), 'relies on the mocked catalog');
  const locale = test.info().project.name as Locale;
  const messages = catalogs[locale];
  const object = messages.ObjectStep;
  await installMockApi(page.context());

  await page.goto(`/${locale}/configurator/object`);
  await tabTo(page, page.getByRole('radio', { name: object.form.finishRough }));
  await page.keyboard.press('Space');
  await fillField(page, object.form.totalArea, '60');
  await fillObject(page, locale);
  await goToInterior(page, locale);

  const picked = page
    .getByRole('list')
    .getByRole('button', { name: /Oak Natural Laminate/ });
  await expect(picked.first()).toBeVisible();
  await expect(page.getByText(messages.Specification.enableHint)).toHaveCount(
    0,
  );

  await openBreakdown(page, locale);
  await page.getByRole('button', { name: messages.CostPanel.base }).click();
  const details = page.locator(
    `dl[aria-label="${messages.CostPanel.baseDetails.label}"]`,
  );
  await expect(details).toBeVisible();
  await expect(details.locator('dt').nth(1)).toBeVisible();
  await expect(details.locator('dd').first()).toHaveText(/[1-9]/);
});
