import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { SortableList, type SortableListProps } from './SortableList';

type Row = { id: string; name: string };

const rows: Row[] = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
];

const getKey = (row: Row) => row.id;
const renderRow = (row: Row) => <span>{row.name}</span>;
const dragLabel = (row: Row) => `Drag ${row.name}`;
const moveUpLabel = (row: Row) => `Up ${row.name}`;
const moveDownLabel = (row: Row) => `Down ${row.name}`;

function setup(overrides: Partial<SortableListProps<Row>> = {}) {
  const onReorder = vi.fn();
  const view = render(
    <SortableList
      items={rows}
      getKey={getKey}
      renderItem={renderRow}
      onReorder={onReorder}
      label="Rows"
      dragLabel={dragLabel}
      moveUpLabel={moveUpLabel}
      moveDownLabel={moveDownLabel}
      screenReaderInstructions="Press space to pick up"
      announcements={{
        onDragStart: ({ active }) => `Picked ${active.id}`,
        onDragOver: ({ active }) => `Over ${active.id}`,
        onDragEnd: ({ active }) => `Dropped ${active.id}`,
        onDragCancel: ({ active }) => `Cancelled ${active.id}`,
      }}
      {...overrides}
    />,
  );
  return { onReorder, ...view };
}

describe('SortableList', () => {
  it('renders items in order inside a labelled list', () => {
    setup();
    const list = screen.getByRole('list', { name: 'Rows' });
    expect(list.tagName).toBe('OL');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Alpha');
    expect(items[1]).toHaveTextContent('Beta');
    expect(items[2]).toHaveTextContent('Gamma');
  });

  it('moves an item down with the Down button', () => {
    const { onReorder } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Down Alpha' }));
    expect(onReorder).toHaveBeenCalledWith([rows[1], rows[0], rows[2]]);
  });

  it('moves an item up with the Up button', () => {
    const { onReorder } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Up Gamma' }));
    expect(onReorder).toHaveBeenCalledWith([rows[0], rows[2], rows[1]]);
  });

  it('disables Up on the first item and Down on the last', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Up Alpha' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Down Gamma' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Down Alpha' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Up Gamma' })).toBeEnabled();
  });

  it('gives each drag handle the screen reader instructions from props', () => {
    setup();
    const handle = screen.getByRole('button', { name: 'Drag Alpha' });
    const description = document.getElementById(
      handle.getAttribute('aria-describedby') ?? '',
    );
    expect(description).toHaveTextContent('Press space to pick up');
  });

  it('announces keyboard drag with the texts from props', async () => {
    setup();
    const handle = screen.getByRole('button', { name: 'Drag Alpha' });
    act(() => handle.focus());
    fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
    expect(await screen.findByText('Over a')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
