import { act } from '@testing-library/react';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STEP_PATHS } from '@/config/routes';
import { StepIdSchema } from '@/lib/draft/schema';
import { useDraft } from '@/stores/draft';
import { renderWithProviders } from '@/test/render-with-providers';
import ConfiguratorPage, { generateMetadata } from './page';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
const hydration = vi.hoisted(() => ({ done: true }));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(),
}));
vi.mock('@/stores/use-draft-hydration', () => ({
  useDraftHydration: () => hydration.done,
}));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
}));

async function renderPage() {
  await act(async () => {
    renderWithProviders(
      <Suspense>
        <ConfiguratorPage params={Promise.resolve({ locale: 'en' })} />
      </Suspense>,
    );
  });
}

describe('ConfiguratorPage', () => {
  beforeEach(() => {
    navigation.replace.mockClear();
    hydration.done = true;
    useDraft.setState({ step: 'object' });
  });

  it.each([
    ['en', '/en/configurator'],
    ['uk', '/uk/configurator'],
  ] as const)('declares alternates for %s', async (locale, canonical) => {
    vi.mocked(getTranslations).mockResolvedValue(
      ((key: string) => key) as unknown as Awaited<
        ReturnType<typeof getTranslations>
      >,
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale }),
    });

    expect(metadata.title).toBe('index');
    expect(metadata.alternates).toEqual({
      canonical,
      languages: {
        en: '/en/configurator',
        uk: '/uk/configurator',
        'x-default': '/configurator',
      },
    });
  });

  it('replaces the route with the first step when there is no draft', async () => {
    await renderPage();

    expect(navigation.replace).toHaveBeenCalledWith(STEP_PATHS.object);
  });

  it.each(StepIdSchema.options)(
    'replaces the route with the stored step %s once hydrated',
    async (step) => {
      await act(async () => {
        useDraft.setState({ step });
      });

      await renderPage();

      expect(navigation.replace).toHaveBeenLastCalledWith(STEP_PATHS[step]);
    },
  );

  it('does not redirect before the draft is hydrated', async () => {
    hydration.done = false;

    await renderPage();

    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
