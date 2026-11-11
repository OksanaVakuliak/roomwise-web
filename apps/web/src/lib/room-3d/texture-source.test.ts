import { describe, expect, it } from 'vitest';
import { pickTextureUrl } from './texture-source';

const texture = { textureUrl: 'full.jpg', previewUrl: 'preview.jpg' };

describe('pickTextureUrl', () => {
  it('uses the preview below 900 device pixels', () => {
    expect(pickTextureUrl(texture, 390, 2)).toBe('preview.jpg');
  });

  it('uses the full texture at 900 device pixels and above', () => {
    expect(pickTextureUrl(texture, 450, 2)).toBe('full.jpg');
    expect(pickTextureUrl(texture, 1200, 1)).toBe('full.jpg');
  });

  it('uses the full texture when there is no preview', () => {
    expect(
      pickTextureUrl({ textureUrl: 'full.jpg', previewUrl: null }, 320, 1),
    ).toBe('full.jpg');
  });
});
