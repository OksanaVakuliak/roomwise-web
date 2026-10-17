export const SHOWCASE_SECTIONS = [
  'colors',
  'typography',
  'spacing',
  'icons',
  'header',
  'stepTape',
  'actions',
  'roomPlan',
  'sectionCut',
  'specification',
  'estimate',
  'formFields',
  'overlays',
  'dataDisplay',
] as const;

export type ShowcaseSection = (typeof SHOWCASE_SECTIONS)[number];
