import { act, fireEvent, screen, within } from '@testing-library/react';
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

function roomPlans() {
  return within(
    screen.getByRole('group', { name: en.InteriorStep.switcherLabel }),
  ).getAllByRole('button');
}

function scene() {
  return screen.getByRole('group', { name: /in 3D$/ });
}

describe('InteriorStep', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('renders a tab for every draft room', async () => {
    await renderStep(`/configurator/interior?room=${firstId}`);

    const group = screen.getByRole('group', {
      name: en.InteriorStep.switcherLabel,
    });
    const plans = within(group).getAllByRole('button');
    expect(plans).toHaveLength(2);
    expect(plans[0]).toHaveAttribute('aria-current', 'true');
  });

  it('switches the room and reflects it in the query', async () => {
    const { location } = await renderStep(
      `/configurator/interior?room=${firstId}&category=c-1`,
    );

    await act(async () => {
      fireEvent.click(roomPlans()[1]);
    });

    const search = new URLSearchParams(location().search);
    expect(search.get('room')).toBe(secondId);
    expect(search.get('category')).toBe('c-1');
    expect(roomPlans()[1]).toHaveAttribute('aria-current', 'true');
    expect(scene()).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: en.RoomPreview.reset }),
    ).toBeInTheDocument();
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

  it('shows the 3D preview of the current room in the scene slot', async () => {
    await renderStep(`/configurator/interior?room=${firstId}`);

    expect(scene()).toHaveAttribute(
      'aria-roledescription',
      en.RoomPreview.roleDescription,
    );
    expect(
      screen.getByRole('button', { name: en.RoomPreview.top }),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = await renderStep(
      `/configurator/interior?room=${firstId}`,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
