import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ZoneEmpty } from './ZoneEmpty';

const KINDS = ['showcase', 'rooms', 'specification', 'estimate'] as const;
const CATALOGS = { en, uk } as const;

describe('ZoneEmpty', () => {
  describe.each(KINDS)('kind %s', (kind) => {
    it.each(['en', 'uk'] as const)(
      'explains the empty zone and shows the action in %s',
      (locale) => {
        const copy = CATALOGS[locale].ZoneStates.empty[kind];
        renderWithProviders(
          <ZoneEmpty
            kind={kind}
            action={<button type="button">Do it</button>}
          />,
          { locale },
        );
        expect(
          screen.getByRole('heading', { name: copy.title }),
        ).toBeInTheDocument();
        expect(screen.getByText(copy.text)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Do it' }),
        ).toBeInTheDocument();
      },
    );

    it('omits the action when none is passed', () => {
      renderWithProviders(<ZoneEmpty kind={kind} />);
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('has no axe violations', async () => {
      const { container } = renderWithProviders(
        <ZoneEmpty kind={kind} action={<button type="button">Do it</button>} />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('uses the requested heading level', () => {
    renderWithProviders(<ZoneEmpty kind="rooms" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
