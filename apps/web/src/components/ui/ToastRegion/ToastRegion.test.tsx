import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { ToastRegion, type ToastRegionItem } from './ToastRegion';

const noop = () => {};

const toasts: ToastRegionItem[] = [
  { id: 'a', variant: 'success', message: 'Saved' },
  { id: 'b', variant: 'error', message: 'Failed' },
];

describe('ToastRegion', () => {
  it('renders a labelled region with every toast', async () => {
    renderWithProviders(
      <ToastRegion
        toasts={toasts}
        onDismiss={noop}
        label="Notifications"
        dismissLabel="Dismiss"
      />,
    );
    expect(
      screen.getByRole('region', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('dismisses a toast by id', () => {
    const onDismiss = vi.fn();
    renderWithProviders(
      <ToastRegion
        toasts={toasts}
        onDismiss={onDismiss}
        label="Notifications"
        dismissLabel="Dismiss"
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[1]!);
    expect(onDismiss).toHaveBeenCalledWith('b');
  });

  it('stays mounted when empty', () => {
    renderWithProviders(
      <ToastRegion
        toasts={[]}
        onDismiss={noop}
        label="Notifications"
        dismissLabel="Dismiss"
      />,
    );
    expect(
      screen.getByRole('region', { name: 'Notifications' }),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <ToastRegion
        toasts={toasts}
        onDismiss={noop}
        label="Notifications"
        dismissLabel="Dismiss"
      />,
    );
    await screen.findByText('Saved');
    expect(await axe(container)).toHaveNoViolations();
  });
});
