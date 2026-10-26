import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createTranslator, type Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { createDefaultDraft } from '@/lib/draft/schema';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup, useWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { axe } from '@/test/axe';
import {
  categoryIds,
  makeDefaultMaterials,
  makeStyles,
  productIds,
  styleIds,
} from '@/test/fixtures/catalog';
import { type DraftV1, makeInteriorDraft } from '@/test/fixtures/draft';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ConfiguratorShell } from '../shell/ConfiguratorShell/ConfiguratorShell';
import { StyleStep } from './StyleStep/StyleStep';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const catalogs = { en, uk };
const MATERIALS_DASH = '—';

function translators(locale: Locale) {
  const messages = catalogs[locale];
  return {
    step: createTranslator({ locale, messages, namespace: 'StyleStep' }),
    shell: createTranslator({ locale, messages, namespace: 'Configurator' }),
    cost: createTranslator({ locale, messages, namespace: 'CostPanel' }),
  };
}

function unstyledDraft(overrides: Partial<DraftV1> = {}): DraftV1 {
  const base = makeInteriorDraft();
  return {
    ...base,
    step: 'style',
    furthestStep: 'style',
    styleId: null,
    rooms: base.rooms.map((room) => ({ ...room, selections: {} })),
    ...overrides,
  };
}

function withManualChoice(draft: DraftV1): DraftV1 {
  const [first, ...rest] = draft.rooms;
  return {
    ...draft,
    styleId: styleIds.modern,
    rooms: [
      {
        ...first,
        selections: {
          [categoryIds.floor]: {
            productId: productIds.tile,
            disabled: false,
            source: 'manual',
          },
        },
      },
      ...rest,
    ],
  };
}

async function renderStep(
  draft: DraftV1,
  locale: Locale = 'en',
  options: Parameters<typeof renderWithProviders>[1] = {},
) {
  setViewport(1440);
  useDraft.setState({ ...draft, revision: 1 });
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <StyleStep />
      </ConfiguratorShell>,
      { locale, url: '/configurator/style', ...options },
    );
  });
  return result;
}

function costRow(label: string) {
  const term = screen.getByText(label, { selector: 'dt' });
  return within(term.parentElement as HTMLElement).getByRole('definition');
}

async function chooseCard(name: string) {
  const card = screen
    .getAllByRole('button', { name: new RegExp(name) })
    .find((button) => button.hasAttribute('aria-pressed'));
  await act(async () => {
    fireEvent.click(card as HTMLElement);
  });
}

function selectionsOf(roomIndex: number) {
  return useDraft.getState().rooms[roomIndex].selections;
}

function openPreview(locale: Locale, name: string) {
  const { step } = translators(locale);
  fireEvent.click(
    screen.getByRole('button', { name: step('preview', { name }) }),
  );
}

describe('StyleStep', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    resetExchangeRate();
    vi.mocked(api.GET).mockReset();
    resetWarmup();
    useDraft.setState({
      ...createDefaultDraft(),
      revision: 0,
      storageAvailable: true,
      notice: null,
    });
  });

  it.each(forEachLocale)(
    'fills every category of every room and shows materials in the cost panel in %s',
    async (locale) => {
      const { cost } = translators(locale);
      await renderStep(unstyledDraft(), locale);

      expect(costRow(cost('materials'))).toHaveTextContent(MATERIALS_DASH);

      await chooseCard('Modern');

      const { rooms, styleId } = useDraft.getState();
      expect(styleId).toBe(styleIds.modern);
      for (const room of rooms) {
        expect(Object.keys(room.selections).sort()).toEqual(
          Object.values(categoryIds).sort(),
        );
        for (const selection of Object.values(room.selections)) {
          expect(selection).toMatchObject({
            source: 'style',
            disabled: false,
          });
          expect(selection.productId).not.toBeNull();
        }
      }
      expect(selectionsOf(1)[categoryIds.floor].productId).toBe(
        productIds.tile,
      );
      expect(costRow(cost('materials'))).not.toHaveTextContent(MATERIALS_DASH);
    },
  );

  it.each(forEachLocale)(
    'marks only the chosen card as pressed in %s',
    async (locale) => {
      await renderStep(unstyledDraft(), locale);

      await chooseCard('Classic');

      expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
      expect(useDraft.getState().styleId).toBe(styleIds.classic);
    },
  );

  it('does nothing when the chosen style is clicked again', async () => {
    await renderStep(unstyledDraft());
    await chooseCard('Modern');
    const { revision } = useDraft.getState();

    await chooseCard('Modern');

    expect(useDraft.getState().revision).toBe(revision);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(forEachLocale)(
    'asks before replacing manual choices and keeps them on cancel in %s',
    async (locale) => {
      const { step } = translators(locale);
      await renderStep(withManualChoice(unstyledDraft()), locale);
      const before = selectionsOf(0);

      await chooseCard('Classic');

      const dialog = screen.getByRole('dialog', {
        name: step('confirm.title'),
      });
      expect(useDraft.getState().styleId).toBe(styleIds.modern);

      await act(async () => {
        fireEvent.click(
          within(dialog).getByRole('button', { name: step('confirm.cancel') }),
        );
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(useDraft.getState().styleId).toBe(styleIds.modern);
      expect(selectionsOf(0)).toEqual(before);
    },
  );

  it.each(forEachLocale)(
    'replaces manual choices after confirmation in %s',
    async (locale) => {
      const { step } = translators(locale);
      await renderStep(withManualChoice(unstyledDraft()), locale);

      await chooseCard('Classic');
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: step('confirm.confirm') }),
        );
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(useDraft.getState().styleId).toBe(styleIds.classic);
      expect(selectionsOf(0)[categoryIds.floor]).toEqual({
        productId: productIds.laminatePremium,
        disabled: false,
        source: 'style',
      });
    },
  );

  it('switches style without a dialog when nothing was chosen by hand', async () => {
    await renderStep(unstyledDraft());
    await chooseCard('Modern');

    await chooseCard('Classic');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useDraft.getState().styleId).toBe(styleIds.classic);
  });

  it('leaves a category without a style default unselected', async () => {
    const queryClient = createTestQueryClient();
    await renderStep(unstyledDraft(), 'en', { queryClient });
    queryClient.setQueryData(['default-materials', styleIds.classic], {
      styleId: styleIds.classic,
      items: [
        {
          roomTypeCode: 'LIVING_ROOM',
          categoryId: categoryIds.floor,
          productId: productIds.laminatePremium,
        },
      ],
    });

    await chooseCard('Classic');

    const selections = selectionsOf(0);
    expect(selections[categoryIds.floor].productId).toBe(
      productIds.laminatePremium,
    );
    expect(selections[categoryIds.walls]).toEqual({
      productId: null,
      disabled: false,
      source: 'style',
    });
    expect(selections[categoryIds.ceiling].productId).toBeNull();
  });

  it.each(forEachLocale)(
    'opens the preview, stays on the step and chooses from it in %s',
    async (locale) => {
      const { step } = translators(locale);
      const { location } = await renderStep(unstyledDraft(), locale);
      const path = location().pathname;
      const [modern] = makeStyles().items;

      openPreview(locale, 'Modern');

      const dialog = screen.getByRole('dialog', { name: 'Modern' });
      expect(within(dialog).getByText(modern.description)).toBeInTheDocument();
      expect(
        within(dialog).getByRole('img', { name: 'Modern' }),
      ).toHaveAttribute('src', modern.image?.zoom);
      expect(location().pathname).toBe(path);

      await act(async () => {
        fireEvent.click(
          within(dialog).getByRole('button', { name: step('previewSelect') }),
        );
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(location().pathname).toBe(path);
      expect(useDraft.getState().styleId).toBe(styleIds.modern);
    },
  );

  it('asks for confirmation when choosing from the preview after manual changes', async () => {
    const { step } = translators('en');
    await renderStep(withManualChoice(unstyledDraft()));

    openPreview('en', 'Classic');
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: step('previewSelect') }),
      );
    });

    expect(
      screen.getByRole('dialog', { name: step('confirm.title') }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Classic' })).toBeNull();
    expect(useDraft.getState().styleId).toBe(styleIds.modern);
  });

  it('closes the preview without choosing', async () => {
    const { step } = translators('en');
    await renderStep(unstyledDraft());

    openPreview('en', 'Modern');
    fireEvent.click(screen.getByRole('button', { name: step('previewClose') }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useDraft.getState().styleId).toBeNull();
  });

  it.each(forEachLocale)(
    'blocks Next without a style and points to the message in %s',
    async (locale) => {
      const { step, shell } = translators(locale);
      const { location } = await renderStep(unstyledDraft(), locale);

      fireEvent.click(screen.getByRole('button', { name: shell('next') }));

      expect(screen.getByText(step('required'))).toHaveFocus();
      expect(location().pathname).toBe(`/${locale}/configurator/style`);
      expect(useDraft.getState().step).toBe('style');
    },
  );

  it('moves on to the next step once a style is chosen', async () => {
    const { shell } = translators('en');
    const { location } = await renderStep(unstyledDraft());
    await chooseCard('Modern');

    fireEvent.click(screen.getByRole('button', { name: shell('next') }));

    expect(location().pathname).toBe('/en/configurator/interior');
  });

  it.each(forEachLocale)(
    'shows an empty state when there are no styles in %s',
    async (locale) => {
      const { step } = translators(locale);
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(['styles', locale], { items: [] });
      queryClient.setQueryData(['room-types', locale], { items: [] });
      await renderStep(unstyledDraft(), locale, {
        queryClient,
        catalog: false,
      });

      expect(
        screen.getByRole('heading', { name: step('emptyTitle') }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('list', { name: step('listLabel') }),
      ).toBeNull();
    },
  );

  it.each(forEachLocale)(
    'keeps the current style, says the chosen one is unavailable and refreshes the list in %s',
    async (locale) => {
      const { step } = translators(locale);
      useWarmup.setState({ server: 'ready' });
      const { queryClient } = await renderStep(
        withManualChoice(unstyledDraft()),
        locale,
      );
      queryClient.removeQueries({
        queryKey: ['default-materials', styleIds.classic],
      });
      const remaining = makeStyles();
      remaining.items = remaining.items.filter(
        (item) => item.id !== styleIds.classic,
      );
      vi.mocked(api.GET).mockImplementation(((path: string) =>
        Promise.resolve(
          path === '/api/v1/public/styles'
            ? { data: remaining, response: { status: 200 } }
            : {
                data: undefined,
                error: { error: { code: 'NOT_FOUND' } },
                response: { status: 404 },
              },
        )) as never);
      const before = selectionsOf(0);

      await chooseCard('Classic');
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: step('confirm.confirm') }),
        );
      });

      expect(useDraft.getState().styleId).toBe(styleIds.modern);
      expect(selectionsOf(0)).toEqual(before);
      expect(screen.getByText(step('unavailable'))).toBeInTheDocument();
      await waitFor(() =>
        expect(
          within(
            screen.getByRole('list', { name: step('listLabel') }),
          ).queryAllByText('Classic'),
        ).toHaveLength(0),
      );
    },
  );

  it('keeps the draft and reports a failure for other errors', async () => {
    const { step } = translators('en');
    const { queryClient } = await renderStep(unstyledDraft());
    queryClient.removeQueries({
      queryKey: ['default-materials', styleIds.classic],
    });
    vi.mocked(api.GET).mockResolvedValue({
      data: undefined,
      error: { error: { code: 'INTERNAL' } },
      response: { status: 500 },
    } as never);

    await chooseCard('Classic');

    expect(useDraft.getState().styleId).toBeNull();
    expect(screen.getByText(step('loadFailed'))).toBeInTheDocument();
  });

  it('keeps the latest choice when an earlier request resolves last', async () => {
    const { queryClient } = await renderStep(unstyledDraft());
    queryClient.removeQueries({ queryKey: ['default-materials'] });
    const resolvers = new Map<string, (value: unknown) => void>();
    vi.mocked(api.GET).mockImplementation(
      ((_path: string, options: { params: { path: { styleId: string } } }) =>
        new Promise((resolve) => {
          resolvers.set(options.params.path.styleId, resolve);
        })) as never,
    );

    await chooseCard('Modern');
    await chooseCard('Classic');
    await act(async () => {
      resolvers.get(styleIds.classic)?.({
        data: makeDefaultMaterials(styleIds.classic),
        response: { status: 200 },
      });
    });
    await act(async () => {
      resolvers.get(styleIds.modern)?.({
        data: makeDefaultMaterials(styleIds.modern),
        response: { status: 200 },
      });
    });

    expect(useDraft.getState().styleId).toBe(styleIds.classic);
  });

  it.each(forEachLocale)(
    'marks the card busy and blocks Next while a style is applied in %s',
    async (locale) => {
      const { step, shell } = translators(locale);
      const { queryClient, location } = await renderStep(
        unstyledDraft(),
        locale,
      );
      queryClient.removeQueries({ queryKey: ['default-materials'] });
      let resolve!: (value: unknown) => void;
      vi.mocked(api.GET).mockImplementation(
        (() =>
          new Promise((done) => {
            resolve = done;
          })) as never,
      );

      await chooseCard('Modern');

      const item = screen
        .getByRole('list', { name: step('listLabel') })
        .querySelector('[aria-busy="true"]');
      expect(item).toHaveTextContent('Modern');
      const status = screen.getByText(step('applying')).parentElement;
      expect(status).toHaveAttribute('role', 'status');

      fireEvent.click(screen.getByRole('button', { name: shell('next') }));

      expect(status).toHaveFocus();
      expect(screen.queryByText(step('required'))).toBeNull();
      expect(location().pathname).toBe(`/${locale}/configurator/style`);

      await act(async () => {
        resolve({
          data: makeDefaultMaterials(styleIds.modern),
          response: { status: 200 },
        });
      });

      expect(screen.queryByText(step('applying'))).toBeNull();
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
      expect(useDraft.getState().styleId).toBe(styleIds.modern);
    },
  );

  it.each(forEachLocale)(
    'has no axe violations with the grid and the dialogs in %s',
    async (locale) => {
      const { step } = translators(locale);
      const { container } = await renderStep(
        withManualChoice(unstyledDraft()),
        locale,
      );

      expect(await axe(container)).toHaveNoViolations();

      openPreview(locale, 'Classic');
      expect(await axe(document.body)).toHaveNoViolations();
      fireEvent.click(
        screen.getByRole('button', { name: step('previewClose') }),
      );

      await chooseCard('Classic');
      expect(await axe(document.body)).toHaveNoViolations();
    },
  );
});
