const PREVIEW_PIXEL_LIMIT = 900;

export function pickTextureUrl(
  texture: { textureUrl: string; previewUrl: string | null },
  canvasWidth: number,
  devicePixelRatio: number,
): string {
  const useLight =
    texture.previewUrl !== null &&
    canvasWidth * devicePixelRatio < PREVIEW_PIXEL_LIMIT;
  return useLight && texture.previewUrl
    ? texture.previewUrl
    : texture.textureUrl;
}
