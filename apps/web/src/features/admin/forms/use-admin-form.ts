'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  type AdminError,
  fieldErrorMessage,
  toAdminError,
} from '@/lib/admin-api/errors';
import { isEqual } from './is-equal';

export type AdminFormLatest<T> = {
  values: T;
  revision: string | null;
  changedBy: string | null;
  changedAt: string | null;
};

export type AdminFormConflict<T> = AdminFormLatest<T>;

export type AdminFormSaveResult<T> = {
  revision: string | null;
  values?: T;
};

export type AdminFormSave<T> = (
  values: T,
  revision: string | null,
) => Promise<AdminFormSaveResult<T>>;

export type UseAdminFormOptions<T> = {
  initial: T;
  revision: string | null;
  fetchLatest: () => Promise<AdminFormLatest<T>>;
};

export type AdminForm<T extends object> = {
  values: T;
  initial: T;
  revision: string | null;
  dirty: boolean;
  saving: boolean;
  errors: Record<string, string>;
  firstErrorPath: string | null;
  error: AdminError | null;
  conflict: AdminFormConflict<T> | null;
  conflictRevealed: boolean;
  differing: readonly string[];
  resetKey: number;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: (next: T | ((current: T) => T)) => void;
  clearError: (path: string) => void;
  reset: () => void;
  submit: (save: AdminFormSave<T>) => Promise<boolean>;
  revealConflict: () => void;
  acceptLatest: () => void;
  dismissConflict: () => void;
};

type Baseline<T> = { initial: T; revision: string | null };

const valueAt = (root: unknown, path: string) => {
  let current = root;
  for (const segment of path.match(/[^.[\]]+/g) ?? []) {
    if (typeof current !== 'object' || current === null) break;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
};

const dropChanged = (
  errors: Record<string, string>,
  previous: unknown,
  next: unknown,
) => {
  const kept = Object.entries(errors).filter(([path]) =>
    isEqual(valueAt(previous, path), valueAt(next, path)),
  );
  return kept.length === Object.keys(errors).length
    ? errors
    : Object.fromEntries(kept);
};

export function useAdminForm<T extends object>({
  initial,
  revision,
  fetchLatest,
}: UseAdminFormOptions<T>): AdminForm<T> {
  const t = useTranslations();
  const [baseline, setBaseline] = useState<Baseline<T>>({ initial, revision });
  const [values, setValuesState] = useState<T>(initial);
  const [currentRevision, setCurrentRevision] = useState(revision);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState<AdminError | null>(null);
  const [conflict, setConflict] = useState<AdminFormConflict<T> | null>(null);
  const [conflictRevealed, setConflictRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const latestValues = useRef(values);
  latestValues.current = values;

  const dirty = !isEqual(values, baseline.initial);

  const differing = useMemo(() => {
    if (!conflict || !conflictRevealed) return [];
    const latest = conflict.values as Record<string, unknown>;
    const mine = values as Record<string, unknown>;
    return Object.keys({ ...latest, ...mine }).filter(
      (key) => !isEqual(latest[key], mine[key]),
    );
  }, [conflict, conflictRevealed, values]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    const previous = latestValues.current;
    const next = { ...previous, [key]: value };
    latestValues.current = next;
    setValuesState(next);
    setErrors((current) => dropChanged(current, previous, next));
  }, []);

  const setValues = useCallback((next: T | ((current: T) => T)) => {
    const previous = latestValues.current;
    const resolved = typeof next === 'function' ? next(previous) : next;
    latestValues.current = resolved;
    setValuesState(resolved);
    setErrors((current) => dropChanged(current, previous, resolved));
  }, []);

  const clearError = useCallback((path: string) => {
    setErrors((current) => {
      if (!(path in current)) return current;
      const { [path]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const reset = useCallback(() => {
    setValuesState(baseline.initial);
    setCurrentRevision(baseline.revision);
    setErrors({});
    setError(null);
    setConflict(null);
    setConflictRevealed(false);
    setResetKey((key) => key + 1);
  }, [baseline]);

  const submit = useCallback(
    async (save: AdminFormSave<T>) => {
      if (busy.current) return false;
      busy.current = true;
      setSaving(true);
      setError(null);
      setErrors({});
      try {
        const result = await save(values, currentRevision);
        const next = result.values ?? values;
        setBaseline({ initial: next, revision: result.revision });
        setValuesState((current) => (current === values ? next : current));
        setCurrentRevision(result.revision);
        setConflict(null);
        setConflictRevealed(false);
        return true;
      } catch (failure) {
        const adminError = toAdminError(failure);
        if (adminError.kind === 'stale') {
          try {
            setConflict(await fetchLatest());
            setConflictRevealed(false);
          } catch (latestFailure) {
            setError(toAdminError(latestFailure));
          }
        } else if (adminError.kind === 'validation') {
          setError(adminError);
          setErrors(
            Object.fromEntries(
              adminError.fields.map((field) => {
                const message = fieldErrorMessage(field);
                return [
                  field.path,
                  t(
                    `${message.namespace}.${message.key}` as never,
                    message.values as never,
                  ),
                ];
              }),
            ),
          );
        } else {
          setError(adminError);
        }
        return false;
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [values, currentRevision, fetchLatest, t],
  );

  const revealConflict = useCallback(() => {
    if (!conflict) return;
    setConflictRevealed(true);
    setCurrentRevision(conflict.revision);
  }, [conflict]);

  const acceptLatest = useCallback(() => {
    if (!conflict) return;
    setBaseline({ initial: conflict.values, revision: conflict.revision });
    setValuesState(conflict.values);
    setCurrentRevision(conflict.revision);
    setErrors({});
    setError(null);
    setConflict(null);
    setConflictRevealed(false);
    setResetKey((key) => key + 1);
  }, [conflict]);

  const dismissConflict = useCallback(() => {
    setConflict(null);
    setConflictRevealed(false);
  }, []);

  return {
    values,
    initial: baseline.initial,
    revision: currentRevision,
    dirty,
    saving,
    errors,
    firstErrorPath: Object.keys(errors)[0] ?? null,
    error,
    conflict,
    conflictRevealed,
    differing,
    resetKey,
    setField,
    setValues,
    clearError,
    reset,
    submit,
    revealConflict,
    acceptLatest,
    dismissConflict,
  };
}
