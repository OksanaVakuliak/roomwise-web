import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders its children in a span by default', () => {
    render(<VisuallyHidden>Skip to content</VisuallyHidden>);
    expect(screen.getByText('Skip to content').tagName).toBe('SPAN');
  });

  it('renders a div when as is div', () => {
    render(<VisuallyHidden as="div">Status</VisuallyHidden>);
    expect(screen.getByText('Status').tagName).toBe('DIV');
  });
});
