'use client';

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { NumberField, type NumberFieldProps } from '../NumberField/NumberField';

export type MoneyFieldProps = Omit<
  NumberFieldProps,
  'decimal' | 'value' | 'defaultValue' | 'onChange' | 'unit'
> & {
  valueCents: number | null;
  onChange: (cents: number | null) => void;
  onValidityChange?: (valid: boolean) => void;
  currency?: string;
  negativeMessage: string;
  invalidMessage: string;
};

type Parsed =
  | { kind: 'empty' }
  | { kind: 'ok'; cents: number }
  | { kind: 'negative' }
  | { kind: 'invalid' };

const MONEY = /^(-?)(\d*)(?:[.,](\d{0,2}))?$/;

function parseMoney(text: string): Parsed {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { kind: 'empty' };
  }
  const match = MONEY.exec(trimmed);
  if (!match || (match[2] === '' && !match[3])) {
    return { kind: 'invalid' };
  }
  const cents =
    Number(match[2] || '0') * 100 + Number((match[3] ?? '').padEnd(2, '0'));
  if (match[1] === '-') {
    return cents === 0 ? { kind: 'ok', cents: 0 } : { kind: 'negative' };
  }
  return { kind: 'ok', cents };
}

function formatCents(cents: number | null): string {
  if (cents === null) {
    return '';
  }
  const fraction = String(cents % 100).padStart(2, '0');
  return `${Math.floor(cents / 100)}.${fraction}`;
}

function centsOf(parsed: Parsed): number | null | undefined {
  if (parsed.kind === 'empty') {
    return null;
  }
  return parsed.kind === 'ok' ? parsed.cents : undefined;
}

export function MoneyField({
  valueCents,
  onChange,
  onValidityChange,
  currency = 'USD',
  negativeMessage,
  invalidMessage,
  error,
  ...rest
}: MoneyFieldProps) {
  const [text, setText] = useState(formatCents(valueCents));
  const [seen, setSeen] = useState(valueCents);
  const parsed = parseMoney(text);
  const cents = centsOf(parsed);
  const stale =
    cents === undefined ? valueCents !== null : cents !== valueCents;
  if (valueCents !== seen) {
    setSeen(valueCents);
    if (stale) {
      setText(formatCents(valueCents));
    }
  } else if (cents !== undefined && stale) {
    setText(formatCents(valueCents));
  }

  let message = error;
  if (!message && parsed.kind === 'negative') {
    message = negativeMessage;
  } else if (!message && parsed.kind === 'invalid') {
    message = invalidMessage;
  }

  const valid = cents !== undefined;
  const reported = useRef(true);
  useEffect(() => {
    if (valid !== reported.current) {
      reported.current = valid;
      onValidityChange?.(valid);
    }
  }, [valid, onValidityChange]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setText(next);
      const nextCents = centsOf(parseMoney(next));
      if (nextCents !== undefined) {
        onChange(nextCents);
      }
    },
    [onChange],
  );

  return (
    <NumberField
      {...rest}
      decimal
      unit={currency}
      value={text}
      error={message}
      onChange={handleChange}
    />
  );
}
