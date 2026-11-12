const PREVIEW_PIXEL_LIMIT = 900;

export function pickTextureUrl(
  texture: { textureUrl: string; previewUrl: string | null },
  canvasWidth: number,
  devicePixelRatio: number,
): string {
  const { previewUrl, textureUrl } = texture;
  if (previewUrl && canvasWidth * devicePixelRatio < PREVIEW_PIXEL_LIMIT) {
    return previewUrl;
  }
  return textureUrl;
}
