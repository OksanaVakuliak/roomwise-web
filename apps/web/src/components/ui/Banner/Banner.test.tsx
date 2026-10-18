import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { Banner } from './Banner';

const noop = () => {};

describe('Banner', () => {
  it.each(['info', 'warning', 'success'] as const)(
    'announces %s politely as a status',
    (variant) => {
      render(<Banner variant={variant}>Saved</Banner>);
      expect(screen.getByRole('status')).toHaveTextContent('Saved');
    },
  );

  it('announces errors as an alert', () => {
    render(<Banner variant="error">Failed</Banner>);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('renders title and action', () => {
    render(
      <Banner
        title="Prices changed"
        action={<button type="button">Recalculate</button>}
      >
        Catalog was updated.
      </Banner>,
    );
    expect(screen.getByText('Prices changed')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Recalculate' }),
    ).toBeInTheDocument();
  });

  it('calls onDismiss from the dismiss button', () => {
    const onDismiss = vi.fn();
    render(
      <Banner onDismiss={onDismiss} dismissLabel="Dismiss">
        Hello
      </Banner>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has no dismiss button without a handler', () => {
    render(<Banner>Hello</Banner>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Banner
          variant="info"
          title="Title"
          onDismiss={noop}
          dismissLabel="Dismiss"
        >
          Info
        </Banner>
        <Banner variant="warning">Warning</Banner>
        <Banner variant="error">Error</Banner>
        <Banner variant="success">Success</Banner>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
