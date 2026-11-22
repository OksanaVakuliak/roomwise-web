type ShowcaseEnv = { nodeEnv: string | undefined; flag: string };

export function isShowcaseEnabled({ nodeEnv, flag }: ShowcaseEnv): boolean {
  return nodeEnv !== 'production' && flag === 'true';
}
