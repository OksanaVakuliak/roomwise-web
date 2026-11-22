'use client';

import {
  cloneElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { cx } from '@/lib/cx';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './DisabledReason.module.css';

export type DisabledReasonProps = {
  reason: string;
  children: ReactElement<{ 'aria-describedby'?: string; className?: string }>;
};

function block(event: MouseEvent | KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function blockKey(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    block(event);
  }
}

export function DisabledReason({ reason, children }: DisabledReasonProps) {
  return (
    <Tooltip content={reason}>
      {cloneElement(children, {
        'aria-disabled': true,
        className: cx(children.props.className, styles.target),
        onClick: block,
        onKeyDown: blockKey,
        onKeyUp: blockKey,
      } as Record<string, unknown>)}
    </Tooltip>
  );
}
