import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'paint', label: 'Paint' },
  { value: 'wallpaper', label: 'Wallpaper' },
];

describe('SegmentedControl', () => {
  it('marks the selected option as pressed', () => {
    renderWithProviders(
      <SegmentedControl
        label="Finish"
        value="wallpaper"
        options={options}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('group', { name: 'Finish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wallpaper' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Paint' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reports the clicked option', () => {
    const onValueChange = vi.fn();
    renderWithProviders(
      <SegmentedControl
        label="Finish"
        value="paint"
        options={options}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Wallpaper' }));

    expect(onValueChange).toHaveBeenCalledWith('wallpaper');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <SegmentedControl
        label="Finish"
        value="paint"
        options={options}
        onValueChange={vi.fn()}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
