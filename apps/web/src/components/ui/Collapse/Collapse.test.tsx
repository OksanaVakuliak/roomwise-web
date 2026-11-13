import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Collapse } from './Collapse';

const ID = 'details';

describe('Collapse', () => {
  it('keeps the content in the DOM but out of the accessibility tree when closed', () => {
    render(
      <Collapse id={ID} open={false}>
        <button type="button">Inside</button>
      </Collapse>,
    );
    const region = screen.getByText('Inside').closest(`#${ID}`);
    expect(region).toHaveAttribute('inert');
    expect(region).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button', { name: 'Inside' })).toBeNull();
  });

  it('exposes the content when open', () => {
    render(
      <Collapse id={ID} open>
        <button type="button">Inside</button>
      </Collapse>,
    );
    const region = screen.getByText('Inside').closest(`#${ID}`);
    expect(region).not.toHaveAttribute('inert');
    expect(region).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Collapse id={ID} open>
        <p>Text</p>
      </Collapse>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
