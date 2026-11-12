let cached: boolean | undefined;

function probe(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const options = { failIfMajorPerformanceCaveat: true };
  try {
    const context =
      canvas.getContext('webgl2', options) ??
      canvas.getContext('webgl', options);
    if (context === null) return false;
    (context as WebGLRenderingContext)
      .getExtension('WEBGL_lose_context')
      ?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function isWebGlSupported(): boolean {
  cached ??= probe();
  return cached;
}
