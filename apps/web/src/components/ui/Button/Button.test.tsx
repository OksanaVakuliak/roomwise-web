import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Button } from './Button';

describe('Button', () => {
  it('is a button of type button by default', () => {
    renderWithProviders(<Button>Next</Button>);
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it.each(['outline', 'fill', 'heat'] as const)('renders kind %s', (kind) => {
    renderWithProviders(<Button kind={kind}>Go</Button>);
    expect(screen.getByRole('button').getAttribute('class')).toContain(kind);
  });

  it('renders a trailing numeric part', () => {
    renderWithProviders(
      <Button kind="fill">
        Next<span className="num">+$89.04</span>
      </Button>,
    );
    expect(screen.getByText('+$89.04')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks when disabled', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is busy and inert while loading', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Saving/ });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not submit its form while loading', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading loadingLabel="Saving">
          Save
        </Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Saving/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <Button>One</Button>
        <Button kind="fill" loading loadingLabel="Saving">
          Two
        </Button>
        <Button kind="heat" disabled>
          Three
        </Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
