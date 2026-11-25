import { describe, expect, it } from 'vitest';
import { isShowcaseEnabled } from './showcase-access';

describe('isShowcaseEnabled', () => {
  it('is enabled outside production with the flag on', () => {
    expect(isShowcaseEnabled({ nodeEnv: 'development', flag: 'true' })).toBe(
      true,
    );
  });

  it('is disabled outside production without the flag', () => {
    expect(isShowcaseEnabled({ nodeEnv: 'development', flag: 'false' })).toBe(
      false,
    );
  });

  it('is disabled in production even with the flag on', () => {
    expect(isShowcaseEnabled({ nodeEnv: 'production', flag: 'true' })).toBe(
      false,
    );
  });

  it('is disabled in production without the flag', () => {
    expect(isShowcaseEnabled({ nodeEnv: 'production', flag: 'false' })).toBe(
      false,
    );
  });
});
