'use client';

import { useState } from 'react';
import { parseDecimal } from './parseDecimal';

function toText(value: number | null): string {
  return value === null ? '' : String(value);
}

export function useDecimalText(value: number | null) {
  const [text, setText] = useState(toText(value));
  const [seen, setSeen] = useState(value);
  const parsed = parseDecimal(text);
  const stale = parsed === undefined ? value !== null : parsed !== value;
  if (value !== seen) {
    setSeen(value);
    if (stale) {
      setText(toText(value));
    }
  } else if (parsed !== undefined && stale) {
    setText(toText(value));
  }
  return [text, setText] as const;
}
