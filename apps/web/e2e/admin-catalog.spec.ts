import { expect, type Locator, type Page, test } from '@playwright/test';
import { categoryIds, categoryNames, makeInteriorDraft } from '@/test/fixtures';
import { seedDraft } from './draft';
import { TEXTURE_PNG } from './fixtures/texture';
import { catalogs, escapeRegExp, type Locale } from './keyboard';
import { installMockApi, isLive, loginAs } from './mock-api';

const locale = () => test.info().project.name as Locale;
const messages = () => catalogs[locale()];
const image = { name: 'pixel.png', mimeType: 'image/png', buffer: TEXTURE_PNG };

test.use({ viewport: { width: 900, height: 1600 } });

test.beforeEach(async ({ page }) => {
  test.skip(isLive(), 'relies on the mocked admin api');
  await installMockApi(page.context());
  await loginAs(page, 'admin');
});

const exact = (page: Page, label: string) =>
  page.getByRole('textbox', { name: label, exact: true });

async function createCategory(page: Page, name: string) {
  const { AdminCatalog, Admin } = messages();
  await page.goto('/en/admin/catalog/categories/new');
  await exact(page, `${AdminCatalog.categories.form.name} (English)`).fill(
    name,
  );
  await exact(page, `${AdminCatalog.categories.form.name} (Ukrainian)`).fill(
    `${name} UK`,
  );
  await page
    .getByRole('button', { name: Admin.form.save, exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/catalog\/categories$/);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

const order = (page: Page) =>
  page.getByRole('list', {
    name: messages().AdminCatalog.roomTypes.form.categoriesTitle,
  });

async function addToBedroom(page: Page, name: string) {
  const { form } = messages().AdminCatalog.roomTypes;
  await page.goto('/en/admin/catalog/room-types/BEDROOM');
  await expect(order(page)).toBeVisible();
  await page
    .getByRole('combobox', { name: form.addLabel })
    .selectOption({ label: form.draftMark.replace('{name}', name) });
  await page.getByRole('button', { name: form.add, exact: true }).click();
  const rows = order(page).getByRole('listitem');
  await expect(rows.last()).toContainText(name);
  return rows;
}

const handleOf = (page: Page, name: string) =>
  page.getByRole('button', {
    name: messages().AdminCatalog.roomTypes.form.drag.replace('{name}', name),
  });

async function save(page: Page) {
  await page
    .getByRole('button', { name: messages().Admin.form.save, exact: true })
    .click();
  await expect(
    page
      .getByRole('region', { name: messages().Admin.toasts.label })
      .getByRole('status')
      .filter({ hasText: messages().Admin.form.saved }),
  ).toBeVisible();
}

async function expectPersistedSecond(page: Page, name: string) {
  await save(page);
  await page.reload();
  const rows = order(page).getByRole('listitem');
  await expect(rows.nth(1)).toContainText(name);
  await expect(rows.last()).not.toContainText(name);
}

async function dragWithMouse(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('The handles are not rendered');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y - 4, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + 2, { steps: 15 });
  await page.mouse.up();
}

test.describe('room type category order', () => {
  test.skip(
    () => locale() !== 'en',
    'the order is locale independent, one pass is enough',
  );

  test('persists an order changed with the mouse', async ({ page }) => {
    const name = 'Pointer Shelf';
    await createCategory(page, name);
    const rows = await addToBedroom(page, name);
    expect(await rows.count()).toBeGreaterThan(2);
    await dragWithMouse(
      page,
      handleOf(page, name),
      rows.nth(1).getByRole('button', { name: /^Drag / }),
    );
    await expect(rows.nth(1)).toContainText(name);
    await expectPersistedSecond(page, name);
  });

  test('persists an order changed with the keyboard', async ({ page }) => {
    const name = 'Keyboard Shelf';
    await createCategory(page, name);
    const rows = await addToBedroom(page, name);
    const total = await rows.count();
    expect(total).toBeGreaterThan(2);
    await handleOf(page, name).focus();
    await page.keyboard.press('Space');
    for (let step = 0; step < total - 2; step += 1) {
      await page.keyboard.press('ArrowUp');
    }
    await page.keyboard.press('Space');
    await expect(rows.nth(1)).toContainText(name);
    await expectPersistedSecond(page, name);
  });
});

async function openFlooringShowcase(page: Page) {
  await seedDraft(page, makeInteriorDraft());
  await page.goto('/en/configurator/interior');
  await page
    .getByRole('button', {
      name: new RegExp(`^${escapeRegExp(categoryNames[categoryIds.floor])}`),
    })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: /^Choose: / }).first(),
  ).toBeVisible();
  return dialog;
}

test.describe('product publication', () => {
  test.skip(() => locale() !== 'en', 'the public mock catalog is english only');

  test('shows a published product in the showcase and hides it again', async ({
    page,
  }) => {
    const { AdminCatalog, Admin } = messages();
    const form = AdminCatalog.products.form;
    const name = 'E2E Bamboo Floor';
    const choose = new RegExp(`^Choose: ${escapeRegExp(name)}$`);

    await page.goto('/en/admin/catalog/products/new');
    await exact(page, `${form.name} (English)`).fill(name);
    await exact(page, `${form.name} (Ukrainian)`).fill('Бамбукова підлога');
    await exact(page, `${form.description} (English)`).fill('Bamboo planks.');
    await exact(page, `${form.description} (Ukrainian)`).fill('Бамбук.');
    await page.getByLabel(form.brand, { exact: true }).fill('Roomwise');
    await page
      .getByLabel(form.manufacturer, { exact: true })
      .fill('Roomwise Factory');
    await page
      .getByRole('combobox', { name: form.category })
      .selectOption({ label: 'Flooring' });
    await page
      .getByRole('combobox', { name: form.materialType })
      .selectOption({ label: 'Laminate' });
    await exact(page, `${form.color} (English)`).fill('Natural');
    await exact(page, `${form.color} (Ukrainian)`).fill('Натуральний');
    await exact(page, `${form.size} (English)`).fill('1200x190 mm');
    await exact(page, `${form.size} (Ukrainian)`).fill('1200x190 мм');
    await page.getByLabel(form.price, { exact: true }).fill('31.50');

    const files = page.locator('input[type="file"]');
    await files.first().setInputFiles(image);
    await expect(
      page.getByRole('img', {
        name: form.images.previewAlt.replace('{n}', '1'),
      }),
    ).toBeVisible();
    await files.nth(1).setInputFiles(image);
    await expect(page.getByText(form.texture.uploaded)).toBeVisible();
    await page.getByLabel(form.texture.tileWidth).fill('1200');
    await page.getByLabel(form.texture.tileLength).fill('190');
    await page.getByLabel(form.texture.fallback).first().fill('#aa8855');

    await page
      .getByRole('button', { name: Admin.form.save, exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/catalog\/products$/);
    await page.getByRole('link', { name }).click();
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: form.editTitle.replace('{name}', name),
      }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: Admin.form.publish, exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: Admin.form.unpublish, exact: true }),
    ).toBeVisible();

    const showcase = await openFlooringShowcase(page);
    await expect(showcase.getByRole('button', { name: choose })).toBeVisible();

    await page.goto('/en/admin/catalog/products');
    await page.getByRole('link', { name }).click();
    await page
      .getByRole('button', { name: Admin.form.unpublish, exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: Admin.form.publish, exact: true }),
    ).toBeVisible();

    const hidden = await openFlooringShowcase(page);
    await expect(hidden.getByRole('button', { name: choose })).toHaveCount(0);
  });
});

test('keeps the product search and filter after going back', async ({
  page,
}) => {
  const { list } = messages().AdminCatalog.products;
  const statuses = messages().Admin.status;
  await page.goto(`/${locale()}/admin/catalog/products`);
  const search = page.getByRole('searchbox', { name: list.search });
  const status = page.getByRole('combobox', { name: list.filters.status });
  const names = page.getByRole('table').getByRole('link');
  await expect(names.first()).toBeVisible();

  await search.fill('Tile');
  await expect(page).toHaveURL(/[?&]q=Tile/);
  await status.selectOption({ label: statuses.DRAFT });
  await expect(page).toHaveURL(/status=DRAFT/);
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Matte White Tile');

  await names.first().click();
  await expect(page).toHaveURL(/\/admin\/catalog\/products\/[0-9a-f-]{36}$/);
  await page.goBack();

  await expect(page).toHaveURL(/q=Tile/);
  await expect(page).toHaveURL(/status=DRAFT/);
  await expect(search).toHaveValue('Tile');
  await expect(status).toHaveValue('DRAFT');
  await expect(names).toHaveCount(1);
});
