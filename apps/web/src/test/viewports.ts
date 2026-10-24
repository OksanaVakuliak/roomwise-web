export const VIEWPORTS = [320, 390, 768, 1024, 1440] as const;

export type Viewport = (typeof VIEWPORTS)[number];

export const forEachViewport: readonly (readonly [Viewport])[] = VIEWPORTS.map(
  (width) => [width] as const,
);

function clauseMatches(clause: string, width: number, dark: boolean): boolean {
  const bound = /\(\s*(min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)/.exec(
    clause,
  );
  if (bound) {
    const limit = Number(bound[2]);
    return bound[1] === 'min' ? width >= limit : width <= limit;
  }
  if (/prefers-color-scheme\s*:\s*dark/.test(clause)) {
    return dark;
  }
  return false;
}

export function setViewport(width: number, { dark = false } = {}) {
  window.innerWidth = width;
  window.matchMedia = ((query: string) => ({
    media: query,
    matches: query
      .split(/\s+and\s+/)
      .every((clause) => clauseMatches(clause, width, dark)),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  window.dispatchEvent(new Event('resize'));
}
