import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { SpecComponents } from './SpecComponents';

const items = [
  { id: 'material', label: 'Material', amount: '$100' },
  { id: 'labor', label: 'Labor', amount: '$40' },
  { id: 'prep', label: 'Preparation is in the row "Paint"' },
];

describe('SpecComponents', () => {
  it('lists every item with its amount', () => {
    render(<SpecComponents items={items} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Material')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$40')).toBeInTheDocument();
  });

  it('shows an item without an amount as a note', () => {
    render(<SpecComponents items={items} />);
    const row = screen.getByText('Preparation is in the row "Paint"');
    expect(row.closest('li')).toHaveTextContent(
      'Preparation is in the row "Paint"',
    );
    expect(row.closest('li')?.querySelectorAll('span')).toHaveLength(1);
  });

  it('renders nothing for an empty list', () => {
    const { container } = render(<SpecComponents items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SpecComponents items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
