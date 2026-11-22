import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { type ChangeEvent, useCallback } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api/request-error';
import { toast, useToasts } from '@/lib/toast';
import { axe } from '@/test/axe';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
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
  fallbackHref?: string;
  save: (
    values: Values,
    revision: string | null,
  ) => Promise<{
    revision: string | null;
  }>;
};

function Harness({ save, fallbackHref }: HarnessProps) {
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
  const { dialog } = useLeaveGuard(form.dirty, { fallbackHref });
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
          error: form.error?.kind ?? null,
          resetKey: form.resetKey,
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

type Nested = {
  name: { en: string; uk: string };
  items: { x: string }[];
};

const nestedInitial: Nested = {
  name: { en: 'a', uk: 'б' },
  items: [{ x: '1' }, { x: '2' }],
};

function NestedHarness() {
  const fetchLatest = useCallback(
    async () => ({
      values: nestedInitial,
      revision: 'r2',
      changedBy: null,
      changedAt: null,
    }),
    [],
  );
  const form = useAdminForm<Nested>({
    initial: nestedInitial,
    revision: 'r1',
    fetchLatest,
  });
  const { setField, setValues, submit } = form;
  const save = useCallback(async () => {
    throw fail(
      makeAdminFailure(400, 'VALIDATION_FAILED', {
        fields: [
          { path: 'name.en', code: 'REQUIRED' },
          { path: 'name.uk', code: 'REQUIRED' },
          { path: 'items[0].x', code: 'REQUIRED' },
          { path: 'items[1].x', code: 'REQUIRED' },
        ],
      }),
    );
  }, []);
  const editEn = useCallback(
    () => setField('name', { ...form.values.name, en: 'z' }),
    [setField, form.values.name],
  );
  const editItem = useCallback(
    () =>
      setValues((current) => ({
        ...current,
        items: [{ x: '1' }, { x: 'changed' }],
      })),
    [setValues],
  );
  const onSubmit = useCallback(() => void submit(save), [submit, save]);
  return (
    <div>
      <output data-testid="errors">{Object.keys(form.errors).join(',')}</output>
      <button type="button" onClick={onSubmit}>
        submit
      </button>
      <button type="button" onClick={editEn}>
        edit en
      </button>
      <button type="button" onClick={editItem}>
        edit item
      </button>
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

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

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
    expect(state().resetKey).toBe(1);
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

  it('sets a form-level error for validation failures without fields', async () => {
    const save = vi.fn().mockRejectedValue(
      fail({
        status: 400,
        body: { error: { code: 'TRANSLATION_MISSING' } },
      }),
    );
    renderWithProviders(<Harness save={save} />, { locale });
    edit('Birch');
    fireEvent.click(screen.getByRole('button', { name: labels.save }));
    await waitFor(() => expect(state().error).toBe('validation'));
    expect(state().errors).toEqual({});
  });

  it('keeps saving on the adopted revision after dismissing a revealed conflict', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(fail(adminErrors.staleRevision()))
      .mockResolvedValue({ revision: 'r3' });
    renderWithProviders(<Harness save={save} />, { locale });
    edit('Birch');
    fireEvent.click(screen.getByRole('button', { name: labels.save }));
    fireEvent.click(await screen.findByRole('button', { name: labels.show }));
    fireEvent.click(
      screen.getByRole('button', {
        name: locale === 'en' ? 'Cancel' : 'Скасувати',
      }),
    );
    expect(state().conflict).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: labels.save }));
    await waitFor(() => expect(state().revision).toBe('r3'));
    expect(save).toHaveBeenLastCalledWith({ name: 'Birch', price: 10 }, 'r2');
  });

  it('does not reopen the dialog when leaving after Back', async () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    renderWithProviders(<Harness save={vi.fn()} />, { locale });
    edit('Birch');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(await screen.findByRole('button', { name: labels.leave }));
    expect(go).toHaveBeenCalledWith(-2);
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: labels.leave })).toBeNull();
    push.mockRestore();
    go.mockRestore();
  });

  it('clears only the errors whose values changed', async () => {
    renderWithProviders(<NestedHarness />, { locale });
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() =>
      expect(screen.getByTestId('errors').textContent).toBe(
        'name.en,name.uk,items[0].x,items[1].x',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'edit en' }));
    expect(screen.getByTestId('errors').textContent).toBe(
      'name.uk,items[0].x,items[1].x',
    );
    fireEvent.click(screen.getByRole('button', { name: 'edit item' }));
    expect(screen.getByTestId('errors').textContent).toBe('name.uk,items[0].x');
  });

  it('stays and keeps guarding when Back leaves the page out of range', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const { router } = renderWithProviders(<Harness save={vi.fn()} />, {
      locale,
    });
    edit('Birch');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(screen.getByRole('button', { name: labels.leave }));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(router.push).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('button', { name: labels.leave })).toBeVisible();
    go.mockRestore();
    vi.useRealTimers();
  });

  it('goes to the fallback when Back is out of range', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const { router } = renderWithProviders(
      <Harness save={vi.fn()} fallbackHref="/en/admin/list" />,
      { locale },
    );
    edit('Birch');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(screen.getByRole('button', { name: labels.leave }));
    expect(router.push).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(router.push).toHaveBeenCalledWith('/en/admin/list');
    go.mockRestore();
    vi.useRealTimers();
  });

  it('skips the fallback when the history navigation arrives', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const { router } = renderWithProviders(
      <Harness save={vi.fn()} fallbackHref="/en/admin/list" />,
      { locale },
    );
    edit('Birch');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    fireEvent.click(screen.getByRole('button', { name: labels.leave }));
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
      vi.advanceTimersByTime(300);
    });
    expect(router.push).not.toHaveBeenCalled();
    go.mockRestore();
    vi.useRealTimers();
  });

  it('ignores popstate that lands on another URL', () => {
    renderWithProviders(<Harness save={vi.fn()} />, { locale });
    edit('Birch');
    window.history.replaceState(null, '', '/elsewhere');
    const push = vi.spyOn(window.history, 'pushState');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: labels.leave })).toBeNull();
    push.mockRestore();
  });

  it('keeps a single history sentinel across save and edit cycles', async () => {
    const save = vi.fn().mockResolvedValue({ revision: 'r5' });
    const back = vi.spyOn(window.history, 'back');
    renderWithProviders(<Harness save={save} />, { locale });
    const marked = () =>
      Boolean(
        (window.history.state as Record<string, unknown> | null)?.__leaveGuard,
      );
    const start = window.history.length;
    expect(marked()).toBe(false);
    edit('Birch');
    expect(marked()).toBe(true);
    expect(window.history.length).toBe(start + 1);
    fireEvent.click(screen.getByRole('button', { name: labels.save }));
    await waitFor(() => expect(state().dirty).toBe(false));
    edit('Cedar');
    expect(marked()).toBe(true);
    expect(window.history.length).toBe(start + 1);
    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it.each([null, 'garbage'])(
    'renders the conflict title without a time for %s',
    (changedAt) => {
      renderWithProviders(
        <ConflictBanner
          changedBy="ann"
          changedAt={changedAt}
          revealed={false}
          differingCount={0}
          onReveal={vi.fn()}
          onAccept={vi.fn()}
          onDismiss={vi.fn()}
        />,
        { locale },
      );
      expect(
        screen.getByText(locale === 'en' ? /changed by ann$/ : /змінив ann$/),
      ).toBeInTheDocument();
    },
  );

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
