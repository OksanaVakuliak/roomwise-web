import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { axe } from '@/test/axe';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { makeDraftRoom, makeInteriorDraft } from '@/test/fixtures/draft';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { DraftNotices } from './DraftNotices';

const catalogs = { en, uk };

describe('DraftNotices', () => {
  beforeEach(() => {
    installMemoryStorage();
    useDraft.setState({
      ...createDefaultDraft(),
      storageAvailable: true,
      notice: null,
      heatedFloorReset: false,
      replacements: [],
    });
  });

  it('renders nothing without notices', async () => {
    const { container } = renderWithProviders(<DraftNotices />);

    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it.each(forEachLocale)(
    'shows a dismissible toast when the heated floor was turned off in %s',
    async (locale) => {
      const messages = catalogs[locale];
      useDraft.setState({ heatedFloorReset: true });
      const { container } = renderWithProviders(<DraftNotices />, { locale });

      expect(
        await screen.findByText(messages.DraftNotices.heatedFloorReset),
      ).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();

      fireEvent.click(
        screen.getByRole('button', {
          name: messages.ConfiguratorShell.dismiss,
        }),
      );

      expect(
        screen.queryByText(messages.DraftNotices.heatedFloorReset),
      ).not.toBeInTheDocument();
      expect(useDraft.getState().heatedFloorReset).toBe(false);
    },
  );

  it.each(forEachLocale)(
    'lists replaced materials and dismisses the banner in %s',
    async (locale) => {
      const messages = catalogs[locale];
      const roomId = '00000000-0000-4000-8000-000000000301';
      useDraft.setState({
        rooms: [makeDraftRoom({ clientId: roomId })],
        replacements: [
          {
            roomClientId: roomId,
            categoryId: categoryIds.floor,
            fromProductId: 'p-gone',
            toProductId: productIds.laminate,
          },
          {
            roomClientId: roomId,
            categoryId: categoryIds.walls,
            fromProductId: 'p-gone-2',
            toProductId: null,
          },
        ],
      });
      const { container } = renderWithProviders(<DraftNotices />, { locale });

      expect(
        await screen.findByText(messages.DraftNotices.replacementsTitle),
      ).toBeInTheDocument();
      const items = await screen.findAllByRole('listitem');
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toContain('Oak Natural Laminate');
      expect(items[1]?.textContent).toContain(
        messages.DraftNotices.chooseMaterial.split('{category}')[1] ?? '',
      );
      expect(await axe(container)).toHaveNoViolations();

      fireEvent.click(
        screen.getByRole('button', {
          name: messages.ConfiguratorShell.dismiss,
        }),
      );

      expect(useDraft.getState().replacements).toEqual([]);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    },
  );

  it.each(forEachLocale)(
    'announces updated prices with the total and acknowledges in %s',
    async (locale) => {
      const messages = catalogs[locale];
      useDraft.setState({ ...makeInteriorDraft() });
      renderWithProviders(<DraftNotices />, { locale });
      act(() => {
        usePricingData.setState({ priceUpdate: { from: 'v1', to: 'v2' } });
      });

      const prefix =
        messages.DraftNotices.pricesUpdatedWithTotal.split('{total}')[0] ?? '';
      const toast = await screen.findByText(
        (content) =>
          content.startsWith(prefix) && content.length > prefix.length,
      );
      expect(toast.textContent).toMatch(/\d/);

      fireEvent.click(
        screen.getByRole('button', {
          name: messages.ConfiguratorShell.dismiss,
        }),
      );

      expect(usePricingData.getState().priceUpdate).toBeNull();
      expect(
        screen.queryByText(toast.textContent ?? ''),
      ).not.toBeInTheDocument();
    },
  );

  it('omits the amount when the total is unknown', async () => {
    renderWithProviders(<DraftNotices />);
    act(() => {
      usePricingData.setState({ priceUpdate: { from: 'v1', to: 'v2' } });
    });

    expect(
      await screen.findByText(en.DraftNotices.pricesUpdated),
    ).toBeInTheDocument();
  });
});
