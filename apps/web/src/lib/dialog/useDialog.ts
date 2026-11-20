import { type RefObject, useEffect, useRef, useState } from 'react';
import {
  inertElements,
  lockScroll,
  releaseElements,
  unlockScroll,
} from './page-lock';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function reachable(element: HTMLElement): boolean {
  if (
    element.getAttribute('tabindex') === '-1' ||
    element.matches(':disabled')
  ) {
    return false;
  }
  if (getComputedStyle(element).visibility === 'hidden') {
    return false;
  }
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    if (
      node.hidden ||
      node.hasAttribute('inert') ||
      getComputedStyle(node).display === 'none'
    ) {
      return false;
    }
  }
  return true;
}

function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    reachable,
  );
}

type Entry = { container: HTMLElement };

const stack: Entry[] = [];

function lockPage(container: HTMLElement) {
  lockScroll();
  const own = container.closest('body > *');
  return inertElements([...document.body.children].filter((n) => n !== own));
}

function unlockPage(nodes: Element[]) {
  releaseElements(nodes);
  unlockScroll();
}

export function useDialog(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const [opener] = useState(() => document.activeElement);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const container = ref.current;
    if (!container) {
      return;
    }

    const entry: Entry = { container };
    const inerted = lockPage(container);
    stack.push(entry);
    container.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || stack[stack.length - 1] !== entry) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !container) {
        return;
      }
      const items = focusableIn(container);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      stack.splice(stack.indexOf(entry), 1);
      unlockPage(inerted);
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, [ref, opener]);
}
