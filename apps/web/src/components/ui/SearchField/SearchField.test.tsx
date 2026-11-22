import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { SearchField } from './SearchField';

describe('SearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a labelled search input and forwards native props', () => {
    render(
      <SearchField
        label="Search"
        clearLabel="Clear"
        placeholder="Name"
        name="q"
      />,
    );
    const input = screen.getByLabelText('Search');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('name', 'q');
    expect(input).toHaveAttribute('placeholder', 'Name');
  });

  it('debounces onSearch by 300 ms and sends the last value', () => {
    const onSearch = vi.fn();
    render(
      <SearchField label="Search" clearLabel="Clear" onSearch={onSearch} />,
    );
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'a' } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(input, { target: { value: 'ab' } });
    act(() => vi.advanceTimersByTime(299));
    expect(onSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('ab');
  });

  it('shows the clear button only when there is a value', () => {
    render(<SearchField label="Search" clearLabel="Clear" />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'x' },
    });
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('clears the value, fires onSearch immediately and cancels a pending call', () => {
    const onSearch = vi.fn();
    render(
      <SearchField label="Search" clearLabel="Clear" onSearch={onSearch} />,
    );
    const input = screen.getByLabelText('Search');
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('');
    act(() => vi.advanceTimersByTime(1000));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(input).toHaveFocus();
  });

  it('starts from defaultValue and still calls a consumer onChange', () => {
    const onChange = vi.fn();
    render(
      <SearchField
        label="Search"
        clearLabel="Clear"
        defaultValue="abc"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Search');
    expect(input).toHaveValue('abc');
    fireEvent.change(input, { target: { value: 'abcd' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not fire after unmount', () => {
    const onSearch = vi.fn();
    const { unmount } = render(
      <SearchField label="Search" clearLabel="Clear" onSearch={onSearch} />,
    );
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'a' },
    });
    unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    vi.useRealTimers();
    const { container } = render(
      <SearchField label="Search" clearLabel="Clear" defaultValue="x" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
