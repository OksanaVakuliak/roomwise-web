import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { Icon } from '../Icon/Icon';
import { PrefSwitch } from './PrefSwitch';

const three = [
  { value: 'uk', content: 'UK' },
  { value: 'usd', content: '$' },
  { value: 'theme', content: <Icon name="moon" />, label: 'Theme' },
] as const;

const two = [three[0], three[1]] as const;

describe('PrefSwitch', () => {
  it('is a named group of toggle buttons', () => {
    render(
      <PrefSwitch
        label="Preferences"
        options={three}
        value="uk"
        onChange={vi.fn()}
      />,
    );
    const group = screen.getByRole('group', { name: 'Preferences' });
    expect(group.querySelectorAll('button')).toHaveLength(3);
  });

  it('renders two items', () => {
    render(
      <PrefSwitch label="Prefs" options={two} value="uk" onChange={vi.fn()} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('marks only the selected item as pressed', () => {
    render(
      <PrefSwitch
        label="Prefs"
        options={three}
        value="usd"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'UK' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: '$' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Theme' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('omits aria-pressed when no value is given', () => {
    render(<PrefSwitch label="Prefs" options={three} onChange={vi.fn()} />);
    for (const button of screen.getAllByRole('button')) {
      expect(button).not.toHaveAttribute('aria-pressed');
    }
  });

  it('calls onChange on click', () => {
    const onChange = vi.fn();
    render(
      <PrefSwitch
        label="Prefs"
        options={three}
        value="uk"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '$' }));
    expect(onChange).toHaveBeenCalledWith('usd');
  });

  it('uses native buttons that are keyboard focusable', () => {
    render(
      <PrefSwitch
        label="Prefs"
        options={three}
        value="uk"
        onChange={vi.fn()}
      />,
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      button.focus();
      expect(button).toHaveFocus();
    }
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <PrefSwitch
        label="Prefs"
        options={three}
        value="uk"
        onChange={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
