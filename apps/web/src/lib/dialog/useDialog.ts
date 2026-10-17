import { type RefObject, useEffect, useRef, useState } from 'react';

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
const inertCounts = new Map<Element, number>();
let savedOverflow = '';

function lockPage(container: HTMLElement) {
  if (stack.length === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  const own = container.closest('body > *');
  const nodes: Element[] = [];
  for (const node of document.body.children) {
    const count = inertCounts.get(node);
    if (node === own || (count === undefined && node.hasAttribute('inert'))) {
      continue;
    }
    inertCounts.set(node, (count ?? 0) + 1);
    node.setAttribute('inert', '');
    nodes.push(node);
  }
  return nodes;
}

function unlockPage(nodes: Element[]) {
  for (const node of nodes) {
    const count = (inertCounts.get(node) ?? 1) - 1;
    if (count > 0) {
      inertCounts.set(node, count);
    } else {
      inertCounts.delete(node);
      node.removeAttribute('inert');
    }
  }
  if (stack.length === 0) {
    document.body.style.overflow = savedOverflow;
  }
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
