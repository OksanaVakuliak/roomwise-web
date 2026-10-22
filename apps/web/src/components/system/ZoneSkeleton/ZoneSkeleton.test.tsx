import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ZoneSkeleton } from './ZoneSkeleton';

const KINDS = ['showcase', 'rooms', 'specification', 'estimate'] as const;
const CATALOGS = { en, uk } as const;

describe('ZoneSkeleton', () => {
  describe.each(KINDS)('kind %s', (kind) => {
    it('renders a busy region with skeleton shapes and a loading label', () => {
      const { container } = renderWithProviders(<ZoneSkeleton kind={kind} />);
      expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText(en.ZoneStates.loading[kind])).toBeInTheDocument();
      expect(
        container.querySelectorAll('[aria-hidden="true"]').length,
      ).toBeGreaterThan(0);
    });

    it.each(['en', 'uk'] as const)('labels the zone in %s', (locale) => {
      renderWithProviders(<ZoneSkeleton kind={kind} />, { locale });
      expect(
        screen.getByText(CATALOGS[locale].ZoneStates.loading[kind]),
      ).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
      const { container } = renderWithProviders(<ZoneSkeleton kind={kind} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
