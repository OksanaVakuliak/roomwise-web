import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Brand } from './Brand';

describe('Brand', () => {
  it('renders the name with its caption', () => {
    render(<Brand name="Roomwise" caption="renovation blueprint" />);
    expect(screen.getByText('Roomwise')).toBeInTheDocument();
    expect(screen.getByText('renovation blueprint')).toBeInTheDocument();
  });

  it('defaults to the mobile size', () => {
    const { container } = render(<Brand name="Roomwise" caption="Caption" />);
    expect(container.firstElementChild?.className).toMatch(/mobile/);
  });

  it('applies the desktop size and custom class', () => {
    const { container } = render(
      <Brand name="Roomwise" caption="Caption" size="desktop" className="x" />,
    );
    expect(container.firstElementChild?.className).toMatch(/desktop/);
    expect(container.firstElementChild).toHaveClass('x');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Brand name="Roomwise" caption="Caption" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
