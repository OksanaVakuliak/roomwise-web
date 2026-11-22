import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { DataTable, type DataTableColumn } from './DataTable';

type Row = { id: string; name: string; price: string };

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', cell: (row) => row.name, rowHeader: true },
  { key: 'price', header: 'Price', cell: (row) => row.price, numeric: true },
];

const rows: Row[] = [
  { id: 'a', name: 'Laminate', price: '$14.20' },
  { id: 'b', name: 'Tile', price: '$22.50' },
];

const getRowKey = (row: Row) => row.id;
const noop = vi.fn();

describe('DataTable', () => {
  it('renders a captioned table with column and row headers', () => {
    render(
      <DataTable
        caption="Materials"
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
      />,
    );
    const table = screen.getByRole('table', { name: 'Materials' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'Name',
      'Price',
    ]);
    for (const header of headers) {
      expect(header).toHaveAttribute('scope', 'col');
    }
    const rowHeader = within(table).getByRole('rowheader', {
      name: 'Laminate',
    });
    expect(rowHeader).toHaveAttribute('scope', 'row');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });

  it('marks numeric columns for right alignment with tabular numerals', () => {
    render(
      <DataTable
        caption="Materials"
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
      />,
    );
    const price = screen.getByRole('cell', { name: '$14.20' });
    expect(price).toHaveClass('num');
    expect(screen.getByRole('columnheader', { name: 'Price' })).toHaveClass(
      'num',
    );
    expect(screen.getByRole('rowheader', { name: 'Tile' })).not.toHaveClass(
      'num',
    );
  });

  it('puts the table inside its own labelled scroll region', () => {
    render(
      <DataTable
        caption="Materials"
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
      />,
    );
    const region = screen.getByRole('region', { name: 'Materials' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(within(region).getByRole('table')).toBeInTheDocument();
  });

  it('shows the empty slot across all columns when there are no rows', () => {
    render(
      <DataTable
        caption="Materials"
        columns={columns}
        rows={[]}
        getRowKey={getRowKey}
        empty={<p>Nothing here</p>}
      />,
    );
    const cell = screen.getByRole('cell', { name: 'Nothing here' });
    expect(cell).toHaveAttribute('colspan', '2');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DataTable
        caption="Materials"
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('auto layout', () => {
    it('keeps table semantics and labels each cell with its column header', () => {
      render(
        <DataTable
          caption="Materials"
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          layout="auto"
        />,
      );
      const table = screen.getByRole('table', { name: 'Materials' });
      expect(within(table).getAllByRole('row')).toHaveLength(3);
      expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
      expect(
        within(table).getByRole('rowheader', { name: 'Laminate' }),
      ).toHaveAttribute('data-label', 'Name');
      expect(
        within(table).getByRole('cell', { name: '$14.20' }),
      ).toHaveAttribute('data-label', 'Price');
    });

    it('prefers an explicit label over a non-string header', () => {
      render(
        <DataTable
          caption="Materials"
          columns={[
            {
              key: 'price',
              header: <span>Price</span>,
              label: 'Cost',
              cell: (row: Row) => row.price,
            },
          ]}
          rows={rows}
          getRowKey={getRowKey}
          layout="auto"
        />,
      );
      expect(screen.getAllByRole('cell')[0]).toHaveAttribute(
        'data-label',
        'Cost',
      );
    });

    it('does not add labels or explicit roles in the default layout', () => {
      render(
        <DataTable
          caption="Materials"
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
        />,
      );
      expect(screen.getByRole('cell', { name: '$14.20' })).not.toHaveAttribute(
        'data-label',
      );
      expect(screen.getByRole('table')).not.toHaveAttribute('role');
    });

    it('has no axe violations', async () => {
      const { container } = render(
        <DataTable
          caption="Materials"
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          layout="auto"
          empty={<p>Nothing</p>}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('sorting', () => {
    const sortable: DataTableColumn<Row>[] = [
      { ...columns[0], sortable: true },
      { ...columns[1], sortable: true },
    ];

    it('exposes aria-sort on sortable headers only', () => {
      render(
        <DataTable
          caption="Materials"
          columns={[sortable[0], columns[1]]}
          rows={rows}
          getRowKey={getRowKey}
          sort={{ key: 'name', dir: 'desc' }}
        />,
      );
      expect(
        screen.getByRole('columnheader', { name: 'Name' }),
      ).toHaveAttribute('aria-sort', 'descending');
      expect(
        screen.getByRole('columnheader', { name: 'Price' }),
      ).not.toHaveAttribute('aria-sort');
    });

    it('reports ascending, none and descending states', () => {
      const { rerender } = render(
        <DataTable
          caption="Materials"
          columns={sortable}
          rows={rows}
          getRowKey={getRowKey}
          sort={{ key: 'name', dir: 'asc' }}
        />,
      );
      expect(
        screen.getByRole('columnheader', { name: 'Name' }),
      ).toHaveAttribute('aria-sort', 'ascending');
      expect(
        screen.getByRole('columnheader', { name: 'Price' }),
      ).toHaveAttribute('aria-sort', 'none');
      rerender(
        <DataTable
          caption="Materials"
          columns={sortable}
          rows={rows}
          getRowKey={getRowKey}
        />,
      );
      expect(
        screen.getByRole('columnheader', { name: 'Name' }),
      ).toHaveAttribute('aria-sort', 'none');
    });

    it('requests ascending for a new column and toggles the active one', () => {
      const onSortChange = vi.fn();
      render(
        <DataTable
          caption="Materials"
          columns={sortable}
          rows={rows}
          getRowKey={getRowKey}
          sort={{ key: 'name', dir: 'asc' }}
          onSortChange={onSortChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Price' }));
      expect(onSortChange).toHaveBeenLastCalledWith({
        key: 'price',
        dir: 'asc',
      });
      fireEvent.click(screen.getByRole('button', { name: 'Name' }));
      expect(onSortChange).toHaveBeenLastCalledWith({
        key: 'name',
        dir: 'desc',
      });
    });

    it('renders native buttons only for sortable columns', () => {
      const onSortChange = vi.fn();
      render(
        <DataTable
          caption="Materials"
          columns={[sortable[0], columns[1]]}
          rows={rows}
          getRowKey={getRowKey}
          onSortChange={onSortChange}
          layout="auto"
        />,
      );
      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'Name' })).toHaveAttribute(
        'type',
        'button',
      );
    });

    it('has no axe violations', async () => {
      const { container } = render(
        <DataTable
          caption="Materials"
          columns={sortable}
          rows={rows}
          getRowKey={getRowKey}
          sort={{ key: 'price', dir: 'asc' }}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('row click', () => {
    it('calls onRowClick with the row on mouse click', () => {
      const onRowClick = vi.fn();
      render(
        <DataTable
          caption="Materials"
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          onRowClick={onRowClick}
        />,
      );
      fireEvent.click(screen.getByRole('cell', { name: '$22.50' }));
      expect(onRowClick).toHaveBeenCalledWith(rows[1]);
    });

    it('activates a focused row with Enter and Space', () => {
      const onRowClick = vi.fn();
      render(
        <DataTable
          caption="Materials"
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          onRowClick={onRowClick}
        />,
      );
      const row = screen.getAllByRole('row')[1];
      row.focus();
      expect(row).toHaveFocus();
      fireEvent.keyDown(row, { key: 'Enter' });
      fireEvent.keyDown(row, { key: ' ' });
      expect(onRowClick).toHaveBeenCalledTimes(2);
      expect(onRowClick).toHaveBeenCalledWith(rows[0]);
    });

    it('ignores clicks on interactive content inside a row', () => {
      const onRowClick = vi.fn();
      const onInner = vi.fn();
      render(
        <DataTable
          caption="Materials"
          columns={[
            ...columns,
            {
              key: 'act',
              header: 'Action',
              cell: () => (
                <button type="button" onClick={onInner}>
                  Edit
                </button>
              ),
            },
          ]}
          rows={rows}
          getRowKey={getRowKey}
          onRowClick={onRowClick}
        />,
      );
      fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
      expect(onInner).toHaveBeenCalledTimes(1);
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it('does not make rows focusable without onRowClick', () => {
      render(
        <DataTable
          caption="Materials"
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
        />,
      );
      for (const row of screen.getAllByRole('row')) {
        expect(row).not.toHaveAttribute('tabindex');
      }
    });

    it('has no axe violations', async () => {
      const { container } = render(
        <DataTable
          caption="Materials"
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          layout="auto"
          onRowClick={noop}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
