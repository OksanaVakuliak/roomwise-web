import { afterEach, describe, expect, it } from 'vitest';
import { resetToasts, toast, useToasts } from './toast';

afterEach(() => {
  resetToasts();
});

describe('toast', () => {
  it('queues toasts with their variant', () => {
    toast.success('Saved');
    toast.error('Failed');
    toast.info('Heads up');
    expect(
      useToasts
        .getState()
        .items.map(({ variant, message }) => [variant, message]),
    ).toEqual([
      ['success', 'Saved'],
      ['error', 'Failed'],
      ['info', 'Heads up'],
    ]);
  });

  it('keeps at most three and drops the oldest', () => {
    toast.info('1');
    toast.info('2');
    toast.info('3');
    toast.info('4');
    expect(useToasts.getState().items.map((item) => item.message)).toEqual([
      '2',
      '3',
      '4',
    ]);
  });

  it('returns unique ids and dismisses by id', () => {
    const first = toast.success('A');
    const second = toast.success('B');
    expect(first).not.toBe(second);
    toast.dismiss(first);
    expect(useToasts.getState().items.map((item) => item.id)).toEqual([second]);
  });

  it('auto-dismisses success and info but keeps errors', () => {
    toast.success('A');
    toast.info('B');
    toast.error('C');
    const [success, info, error] = useToasts.getState().items;
    expect(success?.duration).toBeGreaterThan(0);
    expect(info?.duration).toBeGreaterThan(0);
    expect(error?.duration).toBeUndefined();
  });
});
