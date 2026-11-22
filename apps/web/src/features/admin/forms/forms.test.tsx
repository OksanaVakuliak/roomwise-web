import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { type ChangeEvent, useCallback } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api/request-error';
import { toast, useToasts } from '@/lib/toast';
import { axe } from '@/test/axe';
import { adminErrors } from '@/test/fixtures/admin/errors';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import {
  ConflictBanner,
  SaveBar,
  useAdminForm,
  useLeaveGuard,
  useSaveToast,
} from './index';

type Values = { name: string; price: number };

const initial: Values = { name: 'Oak', price: 10 };
const latest: Values = { name: 'Pine', price: 10 };

const fail = (failure: { status: number; body: unknown }) =>
  new ApiRequestError(failure.status, failure.body);

type HarnessProps = {
  save: (
    values: Values,
    revision: string | null,
  ) => Promise<{
    revision: string | null;
  }>;
};

function Harness({ save }: HarnessProps) {
  const fetchLatest = useCallback(
    async () => ({
      values: latest,
      revision: 'r2',
      changedBy: 'ann',
      changedAt: '2026-11-20T10:00:00Z',
    }),
    [],
  );
  const form = useAdminForm<Values>({
    initial,
    revision: 'r1',
    fetchLatest,
  });
  const { dialog } = useLeaveGuard(form.dirty);
  const notify = useSaveToast();
  const { setField, submit } = form;
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('name', event.target.value),
    [setField],
  );
  const onSave = useCallback(() => {
    void submit(save).then((ok) => ok && notify({ affectsCost: true }));
  }, [submit, save, notify]);
  return (
    <div>
      <input aria-label="name" value={form.values.name} onChange={onChange} />
      <output data-testid="state">
        {JSON.stringify({
          dirty: form.dirty,
          revision: form.revision,
          errors: form.errors,
          first: form.firstErrorPath,
          differing: form.differing,
          conflict: form.conflict?.revision ?? null,
        })}
      </output>
      {form.conflict ? (
        <ConflictBanner
          changedBy={form.conflict.changedBy}
          changedAt={form.conflict.changedAt}
          revealed={form.conflictRevealed}
          differingCount={form.differing.length}
          onReveal={form.revealConflict}
          onAccept={form.acceptLatest}
          onDismiss={form.dismissConflict}
        />
      ) : null}
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={onSave} />
      <a href="/en/admin/other">other</a>
      {dialog}
    </div>
  );
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '{}');
const edit = (value: string) =>
  fireEvent.change(screen.getByLabelText('name'), { target: { value } });

describe.each(forEachLocale)('admin forms (%s)', (locale) => {
  const labels =
    locale === 'en'
      ? {
          save: 'Save',
          leave: 'Leave',
          show: 'Show the current version',
          tooBig: 'Enter a value of no more than 100',
        }
      : {
          save: 'Зберегти',
          leave: 'Вийти',
          show: 'Показати актуальну',
          tooBig: 'Значення має бути не більше ніж 100',
        };

  it('tracks dirty against the initial values', () => {
    renderWithProviders(<Harness save={vi.fn()} />, { locale });
    expect(state().dirty).toBe(false);
    edit('Birch');
    expect(state().dirty).toBe(true);
    edit('Oak');
    expect(state().dirty).toBe(false);
  });

  it('saves, adopts the new revision and shows the toast', async () => {
    const save = vi.fn().mockResolvedValue({ revision: 'r5' });
    renderWithProviders(<Harness save={save} />, { locale });
    edit('Birch');
    fireEvent.click(screen.getByRole('button', { name: labels.save }));
    await waitFor(() => expect(state().revision).toBe('r5'));
    expect(save).toHaveBeenCalledWith({ name: 'Birch', price: 10 }, 'r1');
    expect(state().dirty).toBe(false);
    expect(useToasts.getState().items.at(-1)?.variant).toBe('success');
    act(() => toast.dismiss(useToasts.getState().items.at(-1)?.id ?? ''));
  });

  it('maps validation fields to errors', async () => {
    const save = vi.fn().mockRejectedValue(fail(adminErrors.validation()));
    renderWithProviders(<Harness save={save} />, { locale });
    edit('Birch');
    fireEvent.click(screen.getByRole('button', { name: labels.save }));
    await waitFor(() => expect(state().first).toBe('wastePercent'));
    expect(Object.keys(state().errors)).toEqual(['wastePercent', 'name.en']);
    expect(state().errors.wastePercent).toBe(labels.tooBig);
    edit('Birch 2');
    expect(Object.keys(state().errors)).toEqual(['wastePercent']);
  });

  it('handles a stale revision through the conflict banner', async () => {
    const save = vi.fn().mockRejectedValue(fail(adminErrors.staleRevision()));
    const { container } = renderWithProviders(<Harness save={save} />, {
      locale,
    });
    edit('Birch');
    fireEvent.click(screen.getByRole('button', { name: labels.save }));
    await screen.findByRole('button', { name: labels.show });
    expect(state().conflict).toBe('r2');
    expect(state().revision).toBe('r1');
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole('button', { name: labels.show }));
    expect(state().differing).toEqual(['name']);
    expect(state().revision).toBe('r2');
    fireEvent.click(
      screen.getByRole('button', {
        name: locale === 'en' ? 'Take the current' : 'Взяти актуальні',
      }),
    );
    expect(state().conflict).toBeNull();
    expect(state().dirty).toBe(false);
    expect(screen.getByLabelText('name')).toHaveValue('Pine');
  });

  it('blocks beforeunload only while dirty', () => {
    renderWithProviders(<Harness save={vi.fn()} />, { locale });
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    edit('Birch');
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });

  it('asks before following an internal link', async () => {
    const { router, container } = renderWithProviders(
      <Harness save={vi.fn()} />,
      { locale },
    );
    edit('Birch');
    fireEvent.click(screen.getByRole('link', { name: 'other' }));
    const confirm = await screen.findByRole('button', { name: labels.leave });
    expect(router.push).not.toHaveBeenCalled();
    expect(await axe(document.body)).toHaveNoViolations();
    fireEvent.click(confirm);
    expect(router.push).toHaveBeenCalledWith('/en/admin/other');
    expect(container).toBeTruthy();
  });

  it('lets links through when the form is clean', () => {
    const { router } = renderWithProviders(<Harness save={vi.fn()} />, {
      locale,
    });
    const link = screen.getByRole('link', { name: 'other' });
    link.addEventListener('click', (click) => click.preventDefault());
    link.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    expect(screen.queryByRole('button', { name: labels.leave })).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('asks on popstate and restores the entry', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    renderWithProviders(<Harness save={vi.fn()} />, { locale });
    edit('Birch');
    push.mockClear();
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await screen.findByRole('button', { name: labels.leave });
    expect(push).toHaveBeenCalledTimes(1);
    push.mockRestore();
  });

  it('renders SaveBar actions and has no a11y violations', async () => {
    const onDelete = vi.fn();
    const onToggle = vi.fn();
    const { container } = renderWithProviders(
      <SaveBar
        dirty
        saving={false}
        onSave={vi.fn()}
        onArchive={vi.fn()}
        onDelete={onDelete}
        publication={{ published: false, onToggle }}
      />,
      { locale },
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('omits delete when not allowed and disables actions while saving', () => {
    renderWithProviders(<SaveBar dirty saving onSave={vi.fn()} />, { locale });
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
