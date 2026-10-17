import { type RefObject, useEffect, useRef, useState } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
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

    const inerted = [...document.body.children].filter(
      (node) =>
        node !== container.closest('body > *') && !node.hasAttribute('inert'),
    );
    for (const node of inerted) {
      node.setAttribute('inert', '');
    }
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    container.focus();

    function handleKeyDown(event: KeyboardEvent) {
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
      for (const node of inerted) {
        node.removeAttribute('inert');
      }
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, [ref, opener]);
}
