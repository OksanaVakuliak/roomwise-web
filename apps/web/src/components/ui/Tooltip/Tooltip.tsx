'use client';

import {
  cloneElement,
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

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDismissed(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleEnter = useCallback(() => {
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
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
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
