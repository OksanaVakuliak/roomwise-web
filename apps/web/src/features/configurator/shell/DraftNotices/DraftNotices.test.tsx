import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
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
    });
  });

  it('renders nothing without notices', async () => {
    const { container } = renderWithProviders(<DraftNotices />);

    expect(container).toBeEmptyDOMElement();
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
});
