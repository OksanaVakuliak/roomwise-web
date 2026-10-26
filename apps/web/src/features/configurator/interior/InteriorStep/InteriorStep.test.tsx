import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import { renderWithProviders } from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import { ConfiguratorShell } from '../../shell/ConfiguratorShell/ConfiguratorShell';
import { InteriorStep } from './InteriorStep';

const [firstId, secondId] = makeInteriorDraft().rooms.map(
  (room) => room.clientId,
);

async function renderStep(url: string) {
  useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <InteriorStep />
      </ConfiguratorShell>,
      { url },
    );
  });
  return result;
}

function sceneDescription() {
  return screen.getByRole('img', { name: /section line A–A/ });
}

describe('InteriorStep', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('renders a tab for every draft room', async () => {
    await renderStep(`/configurator/interior?room=${firstId}`);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('tablist', { name: en.InteriorStep.switcherLabel }),
    ).toBeInTheDocument();
  });

  it('switches the room and reflects it in the query', async () => {
    const { location } = await renderStep(
      `/configurator/interior?room=${firstId}&category=c-1`,
    );

    await act(async () => {
      fireEvent.click(screen.getAllByRole('tab')[1]);
    });

    const search = new URLSearchParams(location().search);
    expect(search.get('room')).toBe(secondId);
    expect(search.get('category')).toBe('c-1');
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(sceneDescription()).toHaveAccessibleName(/2\sm by 2\sm/);
  });

  it.each([
    ['an unknown room', '/configurator/interior?room=nope'],
    ['a missing room', '/configurator/interior'],
  ])('replaces %s with the first room', async (_label, url) => {
    const { router, location } = await renderStep(url);

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(new URLSearchParams(location().search).get('room')).toBe(firstId);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('describes the current room scene as text', async () => {
    await renderStep(`/configurator/interior?room=${firstId}`);

    expect(sceneDescription()).toHaveAccessibleName(
      /5\sm by 4\sm, height 2.7\sm/,
    );
  });

  it('has no axe violations', async () => {
    const { container } = await renderStep(
      `/configurator/interior?room=${firstId}`,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
