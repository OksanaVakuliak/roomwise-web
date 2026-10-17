import { type ReactNode, useId } from 'react';
import styles from './DataTable.module.css';

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  numeric?: boolean;
  rowHeader?: boolean;
};

export type DataTableProps<Row> = {
  caption: ReactNode;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  empty?: ReactNode;
};

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  empty,
}: DataTableProps<Row>) {
  const captionId = useId();

  return (
    <div
      className={styles.scroller}
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption id={captionId} className={styles.caption}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`${styles.head} ${column.numeric ? `${styles.numeric} num` : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => {
                  const classes = `${styles.cell} ${column.numeric ? `${styles.numeric} num` : ''}`;
                  return column.rowHeader ? (
                    <th key={column.key} scope="row" className={classes}>
                      {column.cell(row)}
                    </th>
                  ) : (
                    <td key={column.key} className={classes}>
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
