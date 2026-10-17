'use client';

import {
  type ChangeEvent,
  type ComponentProps,
  useCallback,
  useId,
  useState,
} from 'react';
import { mergeControl } from '@/lib/form';
import { FormField } from '../FormField/FormField';
import { Icon } from '../Icon/Icon';
import styles from './Stepper.module.css';

export type StepperProps = Omit<
  ComponentProps<'input'>,
  | 'children'
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'min'
  | 'max'
  | 'step'
> & {
  label: string;
  decrementLabel: string;
  incrementLabel: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  loadingLabel?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function decimals(value: number) {
  const [, fraction = ''] = String(value).split('.');
  return fraction.length;
}

export function Stepper({
  label,
  decrementLabel,
  incrementLabel,
  value: valueProp,
  defaultValue,
  onValueChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  unit,
  hint,
  error,
  loading,
  loadingLabel,
  required,
  id,
  className,
  disabled,
  readOnly,
  ...rest
}: StepperProps) {
  const unitId = useId();
  const [inner, setInner] = useState(() =>
    clamp(defaultValue ?? (Number.isFinite(min) ? min : 0), min, max),
  );
  const [draft, setDraft] = useState<string | null>(null);
  const value = valueProp ?? inner;
  const locked = disabled || loading || readOnly;

  const commit = useCallback(
    (next: number) => {
      const rounded = Number(next.toFixed(Math.max(decimals(step), 6)));
      setInner(rounded);
      if (rounded !== value) {
        onValueChange?.(rounded);
      }
    },
    [onValueChange, step, value],
  );

  const stepBy = useCallback(
    (direction: 1 | -1) => {
      setDraft(null);
      commit(clamp(value + direction * step, min, max));
    },
    [commit, max, min, step, value],
  );

  const decrement = useCallback(() => stepBy(-1), [stepBy]);
  const increment = useCallback(() => stepBy(1), [stepBy]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      setDraft(text);
      const parsed = Number(text);
      if (
        text !== '' &&
        Number.isFinite(parsed) &&
        parsed >= min &&
        parsed <= max
      ) {
        commit(parsed);
      }
    },
    [commit, max, min],
  );

  const handleBlur = useCallback(() => {
    if (draft === null) {
      return;
    }
    const parsed = Number(draft);
    setDraft(null);
    if (draft !== '' && Number.isFinite(parsed)) {
      commit(clamp(parsed, min, max));
    }
  }, [commit, draft, max, min]);

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      loading={loading}
      loadingLabel={loadingLabel}
      className={className}
    >
      {(control) => (
        <span className={styles.row}>
          <button
            type="button"
            className={styles.button}
            aria-label={decrementLabel}
            aria-controls={control.id}
            disabled={locked}
            aria-disabled={value <= min ? true : undefined}
            onClick={value <= min ? undefined : decrement}
          >
            <Icon name="minus" />
          </button>
          <span className={styles.wrap}>
            <input
              {...rest}
              {...mergeControl(control, rest, unit ? unitId : undefined)}
              type="number"
              inputMode="decimal"
              min={Number.isFinite(min) ? min : undefined}
              max={Number.isFinite(max) ? max : undefined}
              step={step}
              value={draft ?? String(value)}
              disabled={disabled}
              readOnly={loading || readOnly}
              className={`${styles.control} num`}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {unit ? (
              <span id={unitId} className={styles.unit}>
                {unit}
              </span>
            ) : null}
          </span>
          <button
            type="button"
            className={styles.button}
            aria-label={incrementLabel}
            aria-controls={control.id}
            disabled={locked}
            aria-disabled={value >= max ? true : undefined}
            onClick={value >= max ? undefined : increment}
          >
            <Icon name="plus" />
          </button>
        </span>
      )}
    </FormField>
  );
}
