import { configureAxe } from 'vitest-axe';

export const axe = configureAxe({
  rules: { 'color-contrast': { enabled: false } },
});

export const WCAG_22_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

export async function blockingViolations(container: Element) {
  const results = await axe(container, {
    runOnly: { type: 'tag', values: WCAG_22_AA_TAGS },
  });
  return results.violations
    .filter(({ impact }) => impact === 'critical' || impact === 'serious')
    .map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map(({ target }) => target.join(' ')),
    }));
}
