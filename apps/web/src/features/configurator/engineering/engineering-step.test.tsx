import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import type { DraftV1 } from '@/test/fixtures/draft';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import {
  catalogs,
  currentDraft,
  makeCatalog,
  makeDraft,
  noLandmarkRule,
  pricing,
} from '../interior/interior-step.helpers';
import { ConfiguratorShell } from '../shell/ConfiguratorShell/ConfiguratorShell';
import { EngineeringStep } from './EngineeringStep/EngineeringStep';

const AC_PRICE_CENTS = 45000;
const AC_QUANTITY_ID = 'option-quantity-opt-ac';

async function renderEngineering(
  locale: 'en' | 'uk' = 'en',
  draft: DraftV1 = makeDraft(),
) {
  setViewport(1024);
  useDraft.setState({ ...draft, revision: 1 });
  const queryClient = createTestQueryClient();
  seedCatalog(queryClient, locale);
  queryClient.setQueryData(['room-types', locale], makeCatalog());
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <EngineeringStep />
      </ConfiguratorShell>,
      {
        url: '/configurator/engineering',
        locale,
        catalog: false,
        queryClient,
      },
    );
  });
  return result;
}

function panelEngineeringCents(draft: DraftV1) {
  const { panel } = runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  });
  return panel.engineering?.usdCents ?? 0;
}

function engineeringRow(label: string) {
  const term = screen.getByText(label, { selector: 'dt' });
  return within(term.parentElement as HTMLElement).getByRole('definition');
}

describe('engineering step', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
  });

  it.each(forEachLocale)(
    'lists the base package without switches in %s',
    async (locale) => {
      await renderEngineering(locale);
      const text = catalogs[locale];
      const section = within(
        screen.getByRole('region', { name: text.PackageList.title }),
      );

      for (const name of ['Electrical wiring', 'Plumbing']) {
        const item = section.getByRole('heading', { name }).closest('li');
        expect(
          within(item as HTMLElement).getByText(text.PackageList.included),
        ).toBeInTheDocument();
      }
      const ventilation = section
        .getByRole('heading', { name: 'Ventilation' })
        .closest('li') as HTMLElement;
      expect(within(ventilation).getByText(/\d/)).toBeInTheDocument();
      expect(
        within(ventilation).queryByText(text.PackageList.included),
      ).not.toBeInTheDocument();
      expect(section.queryByRole('switch')).not.toBeInTheDocument();
      expect(section.queryByRole('checkbox')).not.toBeInTheDocument();
    },
  );

  it.each(forEachLocale)(
    'grows the engineering amount by the quantity times the unit price in %s',
    async (locale) => {
      const draft = makeDraft();
      await renderEngineering(locale, draft);
      const text = catalogs[locale];
      const before = panelEngineeringCents(draft);
      expect(engineeringRow(text.CostPanel.engineering).textContent).toBe(
        moneyMinor(before, 'USD', locale),
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('switch', { name: 'Air conditioner' }),
        );
      });
      const input = document.getElementById(AC_QUANTITY_ID) as HTMLInputElement;
      await act(async () => {
        fireEvent.change(input, { target: { value: '3' } });
        fireEvent.blur(input);
      });

      expect(currentDraft().options['opt-ac']).toEqual({ quantity: 3 });
      const after = panelEngineeringCents(currentDraft());
      expect(after - before).toBe(3 * AC_PRICE_CENTS);
      expect(engineeringRow(text.CostPanel.engineering).textContent).toBe(
        moneyMinor(after, 'USD', locale),
      );
    },
  );

  it('blocks Next and focuses the field when a quantity is out of range', async () => {
    const { router } = await renderEngineering('en', {
      ...makeDraft(),
      options: { 'opt-ac': { quantity: 1 } },
    });
    act(() => {
      useDraft.setState({ options: { 'opt-ac': { quantity: 99 } } });
    });

    expect(
      screen.getByText(
        catalogs.en.OptionList.quantityRange
          .replace('{min}', '1')
          .replace('{max}', '10'),
      ),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: catalogs.en.Configurator.next }),
      );
    });

    expect(router.push).not.toHaveBeenCalled();
    expect(document.getElementById(AC_QUANTITY_ID)).toHaveFocus();
  });

  it('toggles an additional option into the draft', async () => {
    await renderEngineering();
    const section = within(
      screen.getByRole('region', {
        name: catalogs.en.EngineeringStep.additionalTitle,
      }),
    );
    const toggle = section.getByRole('switch', { name: 'Design project' });

    expect(toggle).not.toBeChecked();
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(currentDraft().options['opt-design']).toEqual({});
    expect(toggle).toBeChecked();

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(currentDraft().options['opt-design']).toBeUndefined();
  });

  it.each(forEachLocale)(
    'renders in %s with no axe violations',
    async (locale) => {
      const { container } = await renderEngineering(locale);

      expect(
        screen.getByRole('region', {
          name: catalogs[locale].PackageList.title,
        }),
      ).toBeInTheDocument();
      expect(await axe(container, noLandmarkRule)).toHaveNoViolations();
    },
  );
});
