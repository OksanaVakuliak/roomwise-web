import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
