import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { LocalizedField } from './LocalizedField';

const props = {
  label: 'Name',
  languageLabels: { en: 'English', uk: 'Ukrainian' },
  requiredForPublishLabel: 'Required to publish',
};

describe('LocalizedField', () => {
  it('renders one labelled input per language', () => {
    renderWithProviders(
      <LocalizedField
        {...props}
        value={{ en: 'Tile', uk: 'Плитка' }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('group', { name: 'Name' })).toBeInTheDocument();
    const en = screen.getByLabelText('Name (English)');
    const uk = screen.getByLabelText('Name (Ukrainian)');
    expect(en).toHaveValue('Tile');
    expect(en).toHaveAttribute('lang', 'en');
    expect(uk).toHaveValue('Плитка');
    expect(uk).toHaveAttribute('lang', 'uk');
  });

  it('emits the whole value when one language changes', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <LocalizedField
        {...props}
        value={{ en: 'Tile', uk: 'Плитка' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Name (English)'), {
      target: { value: 'Tiles' },
    });
    expect(onChange).toHaveBeenCalledWith({ en: 'Tiles', uk: 'Плитка' });
    fireEvent.change(screen.getByLabelText('Name (Ukrainian)'), {
      target: { value: 'Плитки' },
    });
    expect(onChange).toHaveBeenLastCalledWith({ en: 'Tile', uk: 'Плитки' });
  });

  it('renders textareas when multiline', () => {
    renderWithProviders(
      <LocalizedField
        {...props}
        multiline
        value={{ en: '', uk: '' }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Name (English)').tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Name (Ukrainian)').tagName).toBe('TEXTAREA');
  });

  it('marks only the empty language with visible, described text', () => {
    renderWithProviders(
      <LocalizedField
        {...props}
        requiredForPublish
        value={{ en: 'Tile', uk: '  ' }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText('Required to publish')).toHaveLength(1);
    expect(
      screen.getByLabelText('Name (Ukrainian)'),
    ).toHaveAccessibleDescription('Required to publish');
    expect(screen.getByLabelText('Name (English)')).toHaveAccessibleDescription(
      '',
    );
  });

  it('does not mark empty languages when not required for publish', () => {
    renderWithProviders(
      <LocalizedField
        {...props}
        value={{ en: '', uk: '' }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('Required to publish')).not.toBeInTheDocument();
  });

  it('shows per-language errors with aria-invalid', () => {
    renderWithProviders(
      <LocalizedField
        {...props}
        value={{ en: 'x', uk: 'y' }}
        errors={{ uk: 'Too long' }}
        onChange={vi.fn()}
      />,
    );
    const uk = screen.getByLabelText('Name (Ukrainian)');
    expect(uk).toHaveAttribute('aria-invalid', 'true');
    expect(uk).toHaveAccessibleDescription('Too long');
    expect(screen.getByLabelText('Name (English)')).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('disables both inputs', () => {
    renderWithProviders(
      <LocalizedField
        {...props}
        disabled
        value={{ en: '', uk: '' }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Name (English)')).toBeDisabled();
    expect(screen.getByLabelText('Name (Ukrainian)')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <LocalizedField
          {...props}
          requiredForPublish
          value={{ en: 'a', uk: '' }}
          errors={{ en: 'Bad' }}
          onChange={vi.fn()}
        />
        <LocalizedField
          {...props}
          label="Description"
          multiline
          value={{ en: '', uk: '' }}
          onChange={vi.fn()}
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
