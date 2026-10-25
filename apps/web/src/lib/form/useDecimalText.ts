import { useState } from 'react';
import { parseDecimal } from './parseDecimal';

function toText(value: number | null): string {
  return value === null ? '' : String(value);
}

export function useDecimalText(value: number | null) {
  const [text, setText] = useState(toText(value));
  const parsed = parseDecimal(text);
  if (parsed !== undefined && parsed !== value) {
    setText(toText(value));
  }
  return [text, setText] as const;
}
