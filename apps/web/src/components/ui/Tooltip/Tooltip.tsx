'use client';

import {
  cloneElement,
  type PointerEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';
import styles from './Tooltip.module.css';

export type TooltipProps = {
  content: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
};

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = (hovered || focused) && !dismissed;
  const trapEscape = open && focused;

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (trapEscape) {
          event.preventDefault();
        }
        setDismissed(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, trapEscape]);

  const handleEnter = useCallback((event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      return;
    }
    setHovered(true);
    setDismissed(false);
  }, []);
  const handleLeave = useCallback(() => setHovered(false), []);
  const handleFocus = useCallback(() => {
    setFocused(true);
    setDismissed(false);
  }, []);
  const handleBlur = useCallback(() => setFocused(false), []);

  const describedBy = [children.props['aria-describedby'], id]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={styles.root}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      <span id={id} role="tooltip" hidden={!open} className={styles.tip}>
        {content}
      </span>
    </span>
  );
}
