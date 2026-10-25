import { act, fireEvent, screen, within } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { useId } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageTitle } from '@/components/ui';
import { createDefaultDraft, type StepId } from '@/lib/draft/schema';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { axe } from '@/test/axe';
import {
  type DraftV1,
  makeEmptyDraft,
  makeInteriorDraft,
} from '@/test/fixtures/draft';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { forEachViewport, setViewport } from '@/test/viewports';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ConfiguratorShell } from './ConfiguratorShell/ConfiguratorShell';
import { useStepValidation } from './StepValidation/step-validation-context';

const catalogs = { en, uk };

function Page({ field }: { field?: string | null }) {
  const id = useId();
  useStepValidation(() => (field ? id : null));
  return (
    <>
      <PageTitle>Step content</PageTitle>
      <input id={id} aria-label="Field" />
    </>
  );
}

async function renderShell(
  step: StepId | '',
  draft: DraftV1,
  locale: Locale = 'en',
  field?: string | null,
  width = 1440,
) {
  setViewport(width);
  useDraft.setState({ ...draft, revision: 0 });
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <Page field={field} />
      </ConfiguratorShell>,
      { locale, url: `/configurator${step ? `/${step}` : ''}` },
    );
  });
  return result;
}

const interior = () => makeInteriorDraft();

describe('ConfiguratorShell', () => {
  beforeEach(() => {
    installMemoryStorage();
    useDraft.setState({
      ...createDefaultDraft(),
      revision: 0,
      storageAvailable: true,
      notice: null,
    });
  });

  it.each(forEachLocale)('shows tape states in %s', async (locale) => {
    await renderShell('interior', interior(), locale);
    const t = catalogs[locale].Configurator;
    const tape = screen.getByRole('navigation', { name: t.tapeLabel });

    expect(
      within(tape).getByRole('button', {
        name: `A1 ${t.steps[1]} ${t.state.done}`,
      }),
    ).toBeInTheDocument();
    expect(
      within(tape).getByRole('button', {
        name: `A3 ${t.steps[3]} ${t.state.now}`,
      }),
    ).toHaveAttribute('aria-current', 'step');
    expect(
      within(tape).getByRole('button', {
        name: `A4 ${t.steps[4]} ${t.state.later}`,
      }),
    ).not.toHaveAttribute('aria-disabled');
  });

  it('marks an unavailable step aria-disabled and does not navigate', async () => {
    const { location } = await renderShell('interior', interior());
    const result = screen.getByRole('button', {
      name: `A5 ${en.Configurator.steps[5]} ${en.Configurator.state.later}`,
    });

    expect(result).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(result);

    expect(location().pathname).toBe('/en/configurator/interior');
  });

  it('navigates to an available step from the tape', async () => {
    const { location } = await renderShell('interior', interior());

    fireEvent.click(
      screen.getByRole('button', {
        name: `A2 ${en.Configurator.steps[2]} ${en.Configurator.state.done}`,
      }),
    );

    expect(location().pathname).toBe('/en/configurator/style');
  });

  it.each(forEachLocale)(
    'sends a direct visit to step 3 back to the first incomplete step in %s',
    async (locale) => {
      const { location } = await renderShell(
        'interior',
        makeEmptyDraft(),
        locale,
      );
      const t = catalogs[locale];

      expect(location().pathname).toBe(`/${locale}/configurator/object`);
      expect(
        await screen.findByText(
          t.ConfiguratorShell.guardIncomplete.replace(
            '{step}',
            t.Configurator.steps[1],
          ),
        ),
      ).toBeInTheDocument();
    },
  );

  it('keeps the current step when the draft allows it', async () => {
    const { location } = await renderShell('interior', interior());

    expect(location().pathname).toBe('/en/configurator/interior');
    expect(screen.getByText('Step content')).toBeInTheDocument();
    expect(useDraft.getState().step).toBe('interior');
  });

  it('does not overwrite a step that another tab wrote', async () => {
    const { location } = await renderShell('interior', interior());

    act(() => useDraft.setState({ step: 'style' }));

    expect(useDraft.getState().step).toBe('style');
    expect(location().pathname).toBe('/en/configurator/interior');
  });

  it.each(forEachLocale)(
    'warns that the draft will not be saved in %s',
    async (locale) => {
      useDraft.setState({ storageAvailable: false });
      const { container } = await renderShell('interior', interior(), locale);
      const text = catalogs[locale].DraftNotices.storageUnavailable;

      expect(screen.getByText(text).closest('[role="status"]')).not.toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it.each(forEachLocale)(
    'reports a draft that could not be restored in %s and dismisses it',
    async (locale) => {
      useDraft.setState({ notice: 'draftReset' });
      await renderShell('interior', interior(), locale);

      expect(
        screen.getByText(catalogs[locale].DraftNotices.draftReset),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', {
          name: catalogs[locale].ConfiguratorShell.dismiss,
        }),
      );

      expect(
        screen.queryByText(catalogs[locale].DraftNotices.draftReset),
      ).not.toBeInTheDocument();
      expect(useDraft.getState().notice).toBeNull();
    },
  );

  it('shows no draft notices when storage works and nothing was reset', async () => {
    await renderShell('interior', interior());

    expect(
      screen.queryByText(en.DraftNotices.storageUnavailable),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(en.DraftNotices.draftReset),
    ).not.toBeInTheDocument();
  });

  it('renders the index route without the shell', async () => {
    await renderShell('', interior());

    expect(screen.getByText('Step content')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('goes forward and records the step', async () => {
    const { location } = await renderShell('interior', interior());

    fireEvent.click(screen.getByRole('button', { name: en.Configurator.next }));

    expect(location().pathname).toBe('/en/configurator/engineering');
    expect(useDraft.getState().step).toBe('engineering');
    expect(useDraft.getState().furthestStep).toBe('engineering');
  });

  it('does not go forward from an incomplete step', async () => {
    const { location } = await renderShell('object', makeEmptyDraft());

    fireEvent.click(screen.getByRole('button', { name: en.Configurator.next }));

    expect(location().pathname).toBe('/en/configurator/object');
    expect(useDraft.getState().furthestStep).toBe('object');
  });

  it('keeps the step order while pricing data are unavailable', async () => {
    useDraft.setState({ ...makeEmptyDraft(), revision: 0 });
    let result!: ReturnType<typeof renderWithProviders>;
    await act(async () => {
      result = renderWithProviders(
        <ConfiguratorShell>
          <Page />
        </ConfiguratorShell>,
        { locale: 'en', url: '/configurator/result', pricing: false },
      );
    });
    await act(async () => usePricingData.setState({ status: 'error' }));

    expect(result.location().pathname).toBe('/en/configurator/object');
    expect(useDraft.getState().furthestStep).toBe('object');
  });

  it('focuses the first invalid field instead of going forward', async () => {
    const { location } = await renderShell(
      'interior',
      interior(),
      'en',
      'invalid',
    );

    fireEvent.click(screen.getByRole('button', { name: en.Configurator.next }));

    expect(screen.getByLabelText('Field')).toHaveFocus();
    expect(location().pathname).toBe('/en/configurator/interior');
  });

  it('goes back to the previous step and from the first step to home', async () => {
    const { location } = await renderShell('style', interior());

    fireEvent.click(screen.getByRole('button', { name: en.Configurator.back }));
    expect(location().pathname).toBe('/en/configurator/object');

    fireEvent.click(screen.getByRole('button', { name: en.Configurator.back }));
    expect(location().pathname).toBe('/en');
  });

  it('has no Next on the last step', async () => {
    await renderShell('result', makeInteriorDraft({ furthestStep: 'result' }));

    expect(
      screen.queryByRole('button', { name: en.Configurator.next }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: en.Configurator.back }),
    ).toBeInTheDocument();
  });

  it.each(forEachViewport)(
    'keeps steps, content, scene, showcase and cost in reading order at %i px',
    async (width) => {
      await renderShell('interior', interior(), 'en', null, width);

      const steps = screen.getByRole('navigation', {
        name: en.Configurator.tapeLabel,
      });
      const content = screen.getByRole('heading', { level: 1 });
      const scene = screen.getByRole('region', { name: en.StepLayout.scene });
      const showcase = screen.getByRole('region', {
        name: en.StepLayout.showcase,
      });
      const cost = screen.getByRole('region', { name: en.StepLayout.cost });
      const zones = [steps, content, scene, showcase, cost];

      for (const [index, zone] of zones.entries()) {
        for (const later of zones.slice(index + 1)) {
          expect(
            zone.compareDocumentPosition(later) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ).toBeTruthy();
          expect(zone.contains(later)).toBe(false);
          expect(later.contains(zone)).toBe(false);
        }
      }
    },
  );

  it.each(forEachLocale)(
    'has no accessibility violations in %s',
    async (locale) => {
      const { container } = await renderShell('interior', interior(), locale);

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
