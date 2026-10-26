import { act, fireEvent, screen, within } from '@testing-library/react';
import { createTranslator, type Locale } from 'next-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { axe } from '@/test/axe';
import { makeRoomTypes } from '@/test/fixtures/catalog';
import {
  type DraftV1,
  makeDraftRoom,
  makeEmptyDraft,
  makeInteriorDraft,
} from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ConfiguratorShell } from '../shell/ConfiguratorShell/ConfiguratorShell';
import { ObjectStep } from './ObjectStep/ObjectStep';

const catalogs = { en, uk };
const pricing = makePricingData();
const { limits } = pricing;

function translators(locale: Locale) {
  const messages = catalogs[locale];
  return {
    step: createTranslator({ locale, messages, namespace: 'ObjectStep' }),
    shell: createTranslator({ locale, messages, namespace: 'Configurator' }),
    cost: createTranslator({ locale, messages, namespace: 'CostPanel' }),
  };
}

function withObject(
  overrides: Partial<DraftV1['object']> = {},
  draft: DraftV1 = makeEmptyDraft(),
): DraftV1 {
  return { ...draft, object: { ...draft.object, ...overrides } };
}

function validObject(
  overrides: Partial<DraftV1['object']> = {},
  draft: DraftV1 = makeEmptyDraft(),
) {
  return withObject(
    { finishLevel: 'PRE_FINISH', totalAreaSqm: 64, ...overrides },
    draft,
  );
}

async function renderStep(draft: DraftV1, locale: Locale = 'en', width = 1440) {
  setViewport(width);
  useDraft.setState({ ...draft, revision: 1 });
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <ObjectStep />
      </ConfiguratorShell>,
      { locale, url: '/configurator/object' },
    );
  });
  return result;
}

function figures(draft: DraftV1) {
  return runEstimate({
    draft,
    draftRevision: useDraft.getState().revision,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  }).panel;
}

function costRow(label: string) {
  const term = screen.getByText(label, { selector: 'dt' });
  return within(term.parentElement as HTMLElement).getByRole('definition');
}

function roomItems(locale: Locale) {
  const list = screen.getByRole('list', {
    name: translators(locale).step('rooms.title'),
  });
  return within(list).getAllByRole('listitem');
}

function roomTypeName(code: string) {
  const item = makeRoomTypes().items.find((type) => type.code === code);
  return item?.name ?? code;
}

function setNumber(name: string, value: string, scope?: HTMLElement) {
  const queries = scope ? within(scope) : screen;
  fireEvent.change(queries.getByRole('textbox', { name }), {
    target: { value },
  });
}

function clickNext(locale: Locale) {
  fireEvent.click(
    screen.getByRole('button', { name: translators(locale).shell('next') }),
  );
}

function fullRoom(overrides: Parameters<typeof makeDraftRoom>[0] = {}) {
  return makeDraftRoom({ roomTypeCode: 'BEDROOM', ...overrides });
}

describe('ObjectStep', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    resetExchangeRate();
    useDraft.setState({
      ...createDefaultDraft(),
      revision: 0,
      storageAvailable: true,
      notice: null,
    });
  });

  it.each(forEachLocale)(
    'shows the base cost for 64 m² and pre-finish in %s',
    async (locale) => {
      const { step, cost } = translators(locale);
      await renderStep(makeEmptyDraft(), locale);

      expect(costRow(cost('base'))).toHaveTextContent('—');

      setNumber(step('form.totalArea'), '64');
      fireEvent.click(
        screen.getByRole('radio', { name: step('form.finishPre') }),
      );

      const expected = figures(validObject()).base;
      expect(expected).not.toBeNull();
      expect(costRow(cost('base')).textContent).toBe(
        moneyMinor(expected?.usdCents ?? 0, 'USD', locale),
      );
      expect(useDraft.getState().object).toMatchObject({
        finishLevel: 'PRE_FINISH',
        totalAreaSqm: 64,
      });
    },
  );

  it.each(forEachLocale)(
    'adds a bedroom of 4 × 3.5 × 2.7 m and shows 14 m² in %s',
    async (locale) => {
      const { step } = translators(locale);
      await renderStep(validObject(), locale);

      fireEvent.click(screen.getByRole('button', { name: step('rooms.add') }));
      const [room] = roomItems(locale);
      fireEvent.change(
        within(room).getByRole('combobox', { name: step('rooms.type') }),
        { target: { value: 'BEDROOM' } },
      );
      setNumber(step('rooms.length'), '4', room);
      setNumber(step('rooms.width'), '3.5', room);
      setNumber(step('rooms.height'), '2.7', room);

      expect(roomItems(locale)).toHaveLength(1);
      expect(
        within(roomItems(locale)[0]).getByText(
          step('rooms.areaValue', { value: '14' }),
        ),
      ).toBeInTheDocument();
      expect(useDraft.getState().rooms[0]).toMatchObject({
        roomTypeCode: 'BEDROOM',
        lengthM: 4,
        widthM: 3.5,
        heightM: 2.7,
      });
      expect(
        screen.queryByText(
          step('validation.roomsExceedTotal', { difference: 1 }),
        ),
      ).not.toBeInTheDocument();
    },
  );

  it.each(forEachLocale)(
    'warns about the difference when rooms exceed the total area but lets the visitor continue in %s',
    async (locale) => {
      const { step } = translators(locale);
      const { location } = await renderStep(
        validObject(
          { totalAreaSqm: limits.totalAreaSqm.min },
          makeEmptyDraft({
            rooms: [fullRoom({ lengthM: 5, widthM: 4, heightM: 2.7 })],
          }),
        ),
        locale,
      );

      expect(
        screen.getByText(
          step('validation.roomsExceedTotal', { difference: 5 }),
        ),
      ).toBeInTheDocument();

      clickNext(locale);

      expect(location().pathname).toBe(`/${locale}/configurator/style`);
      expect(useDraft.getState().step).toBe('style');
    },
  );

  it('sketches only rooms whose sides are inside the allowed range', async () => {
    const { step } = translators('en');
    await renderStep(
      validObject(
        {},
        makeEmptyDraft({
          rooms: [
            fullRoom({ clientId: 'ok', lengthM: 5, widthM: 4 }),
            fullRoom({ clientId: 'huge', lengthM: 1000, widthM: 4 }),
            fullRoom({
              clientId: 'infinite',
              lengthM: Number.POSITIVE_INFINITY,
              widthM: 4,
            }),
          ],
        }),
      ),
    );

    const plan = screen.getByRole('list', { name: step('plan') });
    expect(within(plan).getAllByRole('listitem')).toHaveLength(1);
  });

  it.each(forEachLocale)(
    'focuses the empty height and explains the allowed range in %s',
    async (locale) => {
      const { step } = translators(locale);
      const { location } = await renderStep(
        validObject(
          {},
          makeEmptyDraft({ rooms: [fullRoom({ heightM: null })] }),
        ),
        locale,
      );
      const [room] = roomItems(locale);

      clickNext(locale);

      const height = within(room).getByRole('textbox', {
        name: step('rooms.height'),
      });
      expect(height).toHaveFocus();
      expect(height).toHaveAttribute('aria-invalid', 'true');
      expect(
        within(room).getByText(
          step('validation.range', {
            min: limits.roomHeightM.min,
            max: limits.roomHeightM.max,
            unit: 'm',
          }),
        ),
      ).toBeInTheDocument();
      expect(location().pathname).toBe(`/${locale}/configurator/object`);
    },
  );

  it('focuses the first invalid field in reading order and states the area range', async () => {
    const { step } = translators('en');
    await renderStep(
      withObject(
        { finishLevel: 'ROUGH', totalAreaSqm: 10 },
        makeEmptyDraft({
          rooms: [fullRoom({ heightM: null })],
        }),
      ),
    );

    clickNext('en');

    expect(
      screen.getByRole('textbox', { name: step('form.totalArea') }),
    ).toHaveFocus();
    expect(
      screen.getByText(
        step('validation.range', {
          min: limits.totalAreaSqm.min,
          max: limits.totalAreaSqm.max,
          unit: 'sqm',
        }),
      ),
    ).toBeInTheDocument();
  });

  it.each(forEachLocale)(
    'asks for at least one room instead of finishing the step in %s',
    async (locale) => {
      const { step } = translators(locale);
      const { location } = await renderStep(validObject(), locale);

      clickNext(locale);

      expect(
        screen.getByText(step('validation.roomsRequired')),
      ).toBeInTheDocument();
      expect(location().pathname).toBe(`/${locale}/configurator/object`);
      expect(useDraft.getState().furthestStep).toBe('object');
    },
  );

  it.each(forEachLocale)(
    'offers room types according to the kitchen type in %s',
    async (locale) => {
      const { step } = translators(locale);
      await renderStep(validObject(), locale);

      fireEvent.click(screen.getByRole('button', { name: step('rooms.add') }));
      const optionNames = () =>
        within(
          within(roomItems(locale)[0]).getByRole('combobox', {
            name: step('rooms.type'),
          }),
        )
          .getAllByRole('option')
          .map((option) => option.textContent);

      expect(optionNames()).toEqual(
        expect.arrayContaining([
          roomTypeName('LIVING_ROOM'),
          roomTypeName('KITCHEN'),
        ]),
      );
      expect(optionNames()).not.toContain(roomTypeName('KITCHEN_LIVING'));

      fireEvent.click(
        screen.getByRole('radio', { name: step('form.kitchenLiving') }),
      );
      fireEvent.click(screen.getByRole('button', { name: step('rooms.add') }));
      const [, added] = roomItems(locale);
      const addedOptions = within(
        within(added).getByRole('combobox', { name: step('rooms.type') }),
      )
        .getAllByRole('option')
        .map((option) => option.textContent);

      expect(addedOptions).toContain(roomTypeName('KITCHEN_LIVING'));
      expect(addedOptions).not.toContain(roomTypeName('LIVING_ROOM'));
      expect(addedOptions).not.toContain(roomTypeName('KITCHEN'));
    },
  );

  it.each(forEachLocale)(
    'reports a room whose type does not fit the kitchen type and blocks the step in %s',
    async (locale) => {
      const { step } = translators(locale);
      const { location } = await renderStep(
        makeInteriorDraft({
          object: {
            ...makeInteriorDraft().object,
            kitchenType: 'KITCHEN_LIVING',
          },
        }),
        locale,
      );
      const [mismatched, fitting] = roomItems(locale);

      expect(
        within(mismatched).getByText(step('rooms.typeMismatch')),
      ).toBeInTheDocument();
      expect(
        within(mismatched).getByRole('button', {
          name: step('rooms.changeType'),
        }),
      ).toBeInTheDocument();
      expect(
        within(mismatched).getByRole('button', {
          name: step('rooms.deleteMismatched'),
        }),
      ).toBeInTheDocument();
      expect(
        within(fitting).queryByText(step('rooms.typeMismatch')),
      ).not.toBeInTheDocument();

      clickNext(locale);

      expect(location().pathname).toBe(`/${locale}/configurator/object`);
    },
  );

  it.each(forEachLocale)(
    'recalculates materials in the cost panel when the dimensions of a room with materials change in %s',
    async (locale) => {
      const { step, cost } = translators(locale);
      const draft = makeInteriorDraft();
      await renderStep(draft, locale);
      const before = costRow(cost('materials')).textContent;
      const first = draft.rooms[0];

      expect(before).not.toBe('—');
      expect(before).toBe(
        moneyMinor(figures(draft).materials?.usdCents ?? 0, 'USD', locale),
      );

      setNumber(
        step('rooms.length'),
        String((first.lengthM ?? 0) + 2),
        roomItems(locale)[0],
      );

      const after = costRow(cost('materials')).textContent;
      expect(after).not.toBe(before);
      expect(after).toBe(
        moneyMinor(
          figures(useDraft.getState()).materials?.usdCents ?? 0,
          'USD',
          locale,
        ),
      );
    },
  );

  it.each(forEachLocale)(
    'has no accessibility violations in %s',
    async (locale) => {
      const { container } = await renderStep(makeInteriorDraft(), locale);

      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it.each(forEachLocale)(
    'has no accessibility violations with validation errors in %s',
    async (locale) => {
      const { container } = await renderStep(
        withObject(
          { finishLevel: null, totalAreaSqm: 10 },
          makeEmptyDraft({
            rooms: [fullRoom({ heightM: null })],
          }),
        ),
        locale,
      );

      clickNext(locale);

      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it('has no accessibility violations with an empty room list', async () => {
    const { container } = await renderStep(validObject());

    clickNext('en');

    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(forEachLocale)(
    'fits a 390 px screen without horizontal scroll in %s',
    async (locale) => {
      await renderStep(makeInteriorDraft(), locale, 390);

      expect(window.innerWidth).toBe(390);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
      expect(document.body.scrollWidth).toBeLessThanOrEqual(390);
    },
  );
});
