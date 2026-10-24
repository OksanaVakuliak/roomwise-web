import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { SwitchRow } from './SwitchRow';

const noop = () => {};

describe('SwitchRow', () => {
  it('labels the switch by title and describes it by description', () => {
    renderWithProviders(
      <SwitchRow
        title="Heated floor"
        description="Cable and glue added"
        checked
        onCheckedChange={noop}
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Heated floor' });
    expect(toggle).toHaveAccessibleDescription('Cable and glue added');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('works without a description', () => {
    renderWithProviders(
      <SwitchRow title="Heated floor" checked onCheckedChange={noop} />,
    );
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-describedby');
  });

  it('reports changes', () => {
    const onCheckedChange = vi.fn();
    renderWithProviders(
      <SwitchRow
        title="Heated floor"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <SwitchRow
        title="Heated floor"
        description="Cable and glue added"
        checked
        onCheckedChange={noop}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
