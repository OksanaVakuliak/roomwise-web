import { type MouseEvent, useCallback } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../Icon/Icon';
import styles from './Pagination.module.css';

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
  prevLabel: string;
  nextLabel: string;
  getPageLabel: (page: number) => string;
  className?: string;
};

type Item = number | 'gap-start' | 'gap-end';

function buildItems(page: number, pageCount: number): Item[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const start = Math.max(2, Math.min(page - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5));
  const items: Item[] = [1];
  if (start === 3) {
    items.push(2);
  } else if (start > 3) {
    items.push('gap-start');
  }
  for (let value = start; value <= end; value += 1) {
    items.push(value);
  }
  if (end === pageCount - 2) {
    items.push(pageCount - 1);
  } else if (end < pageCount - 2) {
    items.push('gap-end');
  }
  items.push(pageCount);
  return items;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  label,
  prevLabel,
  nextLabel,
  getPageLabel,
  className,
}: PaginationProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onPageChange(Number(event.currentTarget.value));
    },
    [onPageChange],
  );

  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav aria-label={label} className={cx(styles.root, className)}>
      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={styles.button}
            aria-label={prevLabel}
            disabled={page <= 1}
            value={page - 1}
            onClick={handleClick}
          >
            <Icon name="chevronLeft" size="md" />
          </button>
        </li>
        {buildItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                className={cx(styles.button, item === page && styles.current)}
                aria-label={getPageLabel(item)}
                aria-current={item === page ? 'page' : undefined}
                value={item}
                onClick={handleClick}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} className={styles.gap}>
              <span aria-hidden="true">…</span>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={styles.button}
            aria-label={nextLabel}
            disabled={page >= pageCount}
            value={page + 1}
            onClick={handleClick}
          >
            <Icon name="chevronRight" size="md" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
