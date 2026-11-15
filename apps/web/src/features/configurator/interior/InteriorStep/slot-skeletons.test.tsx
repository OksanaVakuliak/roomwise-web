import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import { renderWithProviders } from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import en from '../../../../../messages/en.json';
import { ConfiguratorShell } from '../../shell/ConfiguratorShell/ConfiguratorShell';
import { InteriorStep } from './InteriorStep';

const catalog = vi.hoisted(() => ({
  override: null as { isError: boolean; data: undefined } | null,
}));

vi.mock('@/lib/api/catalog', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/api/catalog')>();
  return {
    ...actual,
    useRoomTypes: () => {
      const real = actual.useRoomTypes();
      return catalog.override
        ? { ...catalog.override, refetch: vi.fn() }
        : real;
    },
  };
});

const SLOT_KINDS = ['picker', 'scene', 'showcase'] as const;

function slotStatuses(kind: (typeof SLOT_KINDS)[number]) {
  return screen.queryAllByRole('status', {
    name: en.ZoneStates.loading[kind],
  });
}

async function renderInterior(options: { pricing?: false } = {}) {
  setViewport(1440);
  useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
  await act(async () => {
    renderWithProviders(
      <ConfiguratorShell>
        <InteriorStep />
      </ConfiguratorShell>,
      { url: '/configurator/interior', ...options },
    );
  });
}

describe('configurator slot skeletons', () => {
  beforeEach(() => {
    installMemoryStorage();
    catalog.override = null;
  });

  it('shows one skeleton per slot while the shell is not ready', async () => {
    await renderInterior({ pricing: false });

    for (const kind of SLOT_KINDS) {
      expect(slotStatuses(kind)).toHaveLength(1);
    }
  });

  it('leaves no slot skeleton once the step has rendered', async () => {
    await renderInterior();

    for (const kind of SLOT_KINDS) {
      expect(slotStatuses(kind)).toHaveLength(0);
    }
  });

  it('keeps one skeleton per slot while the step loads its rooms', async () => {
    catalog.override = { isError: false, data: undefined };
    await renderInterior();

    for (const kind of SLOT_KINDS) {
      expect(slotStatuses(kind)).toHaveLength(1);
    }
  });

  it('clears the slot skeletons when the step fails to load', async () => {
    catalog.override = { isError: true, data: undefined };
    await renderInterior();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    for (const kind of SLOT_KINDS) {
      expect(slotStatuses(kind)).toHaveLength(0);
    }
  });
});
