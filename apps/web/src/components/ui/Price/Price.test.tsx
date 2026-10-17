import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Price } from './Price';

const rate = { uahPerUsd: 40 };

describe('Price', () => {
  it('formats USD cents', () => {
    render(<Price cents={1420} currency="USD" locale="en" />);
    expect(screen.getByText('$14.20')).toBeInTheDocument();
  });

  it('converts to UAH with the exchange rate', () => {
    const { container } = render(
      <Price cents={1000} currency="UAH" locale="uk" rate={rate} />,
    );
    expect(container.textContent).toMatch(/400/);
    expect(container.textContent).toMatch(/₴|грн/);
  });

  it('strikes the old price through and labels both prices', () => {
    const { container } = render(
      <Price
        cents={1420}
        oldCents={1800}
        currency="USD"
        locale="en"
        oldLabel="Old price"
        currentLabel="Now"
      />,
    );
    const old = container.querySelector('s');
    expect(old).toHaveTextContent('$18');
    expect(screen.getByText('Old price')).toBeInTheDocument();
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('$14.20')).toBeInTheDocument();
  });

  it('renders no old price by default', () => {
    const { container } = render(
      <Price cents={1420} currency="USD" locale="en" />,
    );
    expect(container.querySelector('s')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Price
        cents={1420}
        oldCents={1800}
        currency="USD"
        locale="en"
        oldLabel="Old price"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
