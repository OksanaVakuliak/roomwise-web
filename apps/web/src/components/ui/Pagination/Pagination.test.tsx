import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { Pagination, type PaginationProps } from './Pagination';

const getPageLabel = (page: number) => `Page ${page}`;

function renderPagination(props: Partial<PaginationProps> = {}) {
  const onPageChange = vi.fn();
  const view = render(
    <Pagination
      page={1}
      pageCount={5}
      onPageChange={onPageChange}
      label="Pages"
      prevLabel="Previous"
      nextLabel="Next"
      getPageLabel={getPageLabel}
      {...props}
    />,
  );
  return { onPageChange, ...view };
}

describe('Pagination', () => {
  it('renders a labelled nav and marks the current page', () => {
    renderPagination({ page: 3 });
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Page 2' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('emits the chosen page', () => {
    const { onPageChange } = renderPagination({ page: 3 });
    fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange).toHaveBeenLastCalledWith(5);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it('disables previous on the first page', () => {
    renderPagination({ page: 1 });
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('disables next on the last page', () => {
    renderPagination({ page: 5 });
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('truncates long ranges around the current page', () => {
    renderPagination({ page: 10, pageCount: 20 });
    const names = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual([
      'Previous',
      'Page 1',
      'Page 9',
      'Page 10',
      'Page 11',
      'Page 20',
      'Next',
    ]);
    expect(screen.getAllByText('…')).toHaveLength(2);
  });

  it('keeps a stable window near the edges', () => {
    renderPagination({ page: 1, pageCount: 20 });
    const names = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual([
      'Previous',
      'Page 1',
      'Page 2',
      'Page 3',
      'Page 4',
      'Page 5',
      'Page 20',
      'Next',
    ]);
  });

  it('shows every page when the range is short', () => {
    renderPagination({ page: 1, pageCount: 7 });
    expect(screen.queryByText('…')).toBeNull();
    expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument();
  });

  it('renders nothing when there is a single page', () => {
    const { container } = renderPagination({ pageCount: 1 });
    expect(container).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = renderPagination({ page: 10, pageCount: 20 });
    expect(await axe(container)).toHaveNoViolations();
  });
});
