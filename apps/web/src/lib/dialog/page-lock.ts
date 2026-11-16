const inertCounts = new Map<Element, number>();
let scrollLocks = 0;
let savedOverflow = '';

export function inertElements(elements: Element[]): Element[] {
  const locked: Element[] = [];
  for (const element of elements) {
    const count = inertCounts.get(element);
    if (count === undefined && element.hasAttribute('inert')) {
      continue;
    }
    inertCounts.set(element, (count ?? 0) + 1);
    element.setAttribute('inert', '');
    locked.push(element);
  }
  return locked;
}

export function releaseElements(elements: Element[]) {
  for (const element of elements) {
    const count = (inertCounts.get(element) ?? 1) - 1;
    if (count > 0) {
      inertCounts.set(element, count);
    } else {
      inertCounts.delete(element);
      element.removeAttribute('inert');
    }
  }
}

export function lockScroll() {
  if (scrollLocks === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLocks += 1;
}

export function unlockScroll() {
  if (scrollLocks === 0) {
    return;
  }
  scrollLocks -= 1;
  if (scrollLocks === 0) {
    document.body.style.overflow = savedOverflow;
  }
}
