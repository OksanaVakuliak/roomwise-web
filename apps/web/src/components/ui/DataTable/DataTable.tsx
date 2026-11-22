import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useId,
} from 'react';
import { cx } from '@/lib/cx';
import styles from './DataTable.module.css';

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  numeric?: boolean;
  rowHeader?: boolean;
  sortable?: boolean;
  label?: string;
};

export type DataTableSort = { key: string; dir: 'asc' | 'desc' };

export type DataTableProps<Row> = {
  caption: ReactNode;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  empty?: ReactNode;
  layout?: 'table' | 'auto';
  sort?: DataTableSort;
  onSortChange?: (next: DataTableSort) => void;
  onRowClick?: (row: Row) => void;
};

const INTERACTIVE =
  'a, button, input, select, textarea, label, [role="button"]';

function ariaSort(
  column: { key: string; sortable?: boolean },
  sort: DataTableSort | undefined,
) {
  if (!column.sortable) return undefined;
  if (sort?.key !== column.key) return 'none';
  return sort.dir === 'asc' ? 'ascending' : 'descending';
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  empty,
  layout = 'table',
  sort,
  onSortChange,
  onRowClick,
}: DataTableProps<Row>) {
  const captionId = useId();
  const auto = layout === 'auto';

  const handleSort = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const key = event.currentTarget.value;
      const dir = sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
      onSortChange?.({ key, dir });
    },
    [sort, onSortChange],
  );

  const handleRowClick = useCallback(
    (event: MouseEvent<HTMLTableRowElement>) => {
      if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
      const row = rows[Number(event.currentTarget.dataset.index)];
      if (row !== undefined) onRowClick?.(row);
    },
    [rows, onRowClick],
  );

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const row = rows[Number(event.currentTarget.dataset.index)];
      if (row !== undefined) onRowClick?.(row);
    },
    [rows, onRowClick],
  );

  return (
    <div
      className={cx(styles.scroller, auto && styles.auto)}
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
    >
      <table className={styles.table} role={auto ? 'table' : undefined}>
        <caption id={captionId} className={styles.caption}>
          {caption}
        </caption>
        <thead role={auto ? 'rowgroup' : undefined}>
          <tr role={auto ? 'row' : undefined}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                role={auto ? 'columnheader' : undefined}
                aria-sort={ariaSort(column, sort)}
                className={cx(
                  styles.head,
                  column.numeric && styles.numeric,
                  column.numeric && 'num',
                  column.sortable && styles.sortable,
                )}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    value={column.key}
                    onClick={handleSort}
                  >
                    {column.header}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role={auto ? 'rowgroup' : undefined}>
          {rows.length === 0 && empty ? (
            <tr role={auto ? 'row' : undefined}>
              <td
                colSpan={columns.length}
                role={auto ? 'cell' : undefined}
                className={styles.empty}
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey(row)}
                role={auto ? 'row' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cx(onRowClick && styles.clickable)}
                data-index={index}
                onClick={onRowClick ? handleRowClick : undefined}
                onKeyDown={onRowClick ? handleRowKeyDown : undefined}
              >
                {columns.map((column) => {
                  const classes = `${styles.cell} ${column.numeric ? `${styles.numeric} num` : ''}`;
                  const label =
                    column.label ??
                    (typeof column.header === 'string'
                      ? column.header
                      : undefined);
                  return column.rowHeader ? (
                    <th
                      key={column.key}
                      scope="row"
                      role={auto ? 'rowheader' : undefined}
                      data-label={auto ? label : undefined}
                      className={classes}
                    >
                      {column.cell(row)}
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      role={auto ? 'cell' : undefined}
                      data-label={auto ? label : undefined}
                      className={classes}
                    >
                      {column.cell(row)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
