import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Remark } from './Remark';

const props = {
  number: 1,
  title: 'Note 1.',
  text: 'Laminate over the cable will dry out.',
  suggestion: 'I would lay quartz vinyl',
};

describe('Remark', () => {
  it('renders title, text, suggestion and action', () => {
    render(
      <Remark {...props} action={<button type="button">Replace</button>} />,
    );
    expect(screen.getByText('Note 1.')).toBeInTheDocument();
    expect(
      screen.getByText(/Laminate over the cable will dry out/),
    ).toBeInTheDocument();
    expect(screen.getByText('I would lay quartz vinyl')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
  });

  it('hides the mark number from assistive tech because the title carries it', () => {
    render(<Remark {...props} />);
    expect(screen.getByText('1')).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes an id for references', () => {
    const id = 'remark-1';
    const { container } = render(<Remark {...props} id={id} size="desktop" />);
    expect(container.querySelector(`#${id}`)).not.toBeNull();
  });

  it('omits the action slot when none is given', () => {
    render(<Remark {...props} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Remark {...props} action={<button type="button">Replace</button>} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
