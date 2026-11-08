import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render-with-providers';
import { LineWarnings } from './LineWarnings';

const roomClientId = 'room-1';

describe('LineWarnings', () => {
  it.each([
    [
      'AREA_SHARE_NOT_ALLOWED',
      'Частку площі можна задати лише для стін і підлоги',
    ],
    ['AREA_SHARE_MISSING', 'Вкажіть частку площі для кожного покриття'],
    ['AREA_SHARE_EXCEEDS_SURFACE', 'Частки площі разом перевищують 100 %'],
  ])('renders the %s line error', (code, text) => {
    renderWithProviders(<LineWarnings warnings={[]} errorCode={code} />, {
      locale: 'uk',
    });

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([
    ['WALLS', 'Стіни'],
    ['FLOOR', 'Підлога'],
  ])('renders the unallocated %s share in Ukrainian', (surface, name) => {
    renderWithProviders(
      <LineWarnings
        warnings={[
          {
            code: 'AREA_SHARE_UNALLOCATED',
            params: { roomClientId, surface, percent: 40, sqm: 12 },
          },
        ]}
      />,
      { locale: 'uk' },
    );

    expect(
      screen.getByText(`${name}: не розподілено 40 % (≈ 12 м²)`, {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it('renders the unallocated share in English', () => {
    renderWithProviders(
      <LineWarnings
        warnings={[
          {
            code: 'AREA_SHARE_UNALLOCATED',
            params: { roomClientId, surface: 'FLOOR', percent: 25, sqm: 8 },
          },
        ]}
      />,
      { locale: 'en' },
    );

    expect(
      screen.getByText('Floor: 25% not allocated (≈ 8 m²)', { exact: false }),
    ).toBeInTheDocument();
  });
});
