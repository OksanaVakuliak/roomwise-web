import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { TexturePreview } from './TexturePreview';

const base = {
  tileWidthMm: 600,
  tileLengthMm: 300,
  fallbackColor: '#aabbcc',
  label: 'Tile preview',
};

describe('TexturePreview', () => {
  it('exposes an image role with the label', () => {
    render(<TexturePreview {...base} />);
    expect(
      screen.getByRole('img', { name: 'Tile preview' }),
    ).toBeInTheDocument();
  });

  it('sizes the tile as a share of the default 2000 mm area', () => {
    render(<TexturePreview {...base} src="/t.jpg" />);
    const el = screen.getByRole('img');
    expect(el.style.getPropertyValue('--tile-w')).toBe('30%');
    expect(el.style.getPropertyValue('--tile-l')).toBe('15%');
    expect(el.style.getPropertyValue('--fallback')).toBe('#aabbcc');
    expect(el.style.getPropertyValue('--texture')).toBe('url("/t.jpg")');
  });

  it('honours a custom area', () => {
    render(<TexturePreview {...base} areaMm={1000} />);
    expect(screen.getByRole('img').style.getPropertyValue('--tile-w')).toBe(
      '60%',
    );
  });

  it('shows only the fallback colour without a source', () => {
    render(<TexturePreview {...base} />);
    const el = screen.getByRole('img');
    expect(el.style.getPropertyValue('--texture')).toBe('');
    expect(el.style.getPropertyValue('--fallback')).toBe('#aabbcc');
  });

  it('has no axe violations', async () => {
    const { container } = render(<TexturePreview {...base} src="/t.jpg" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
