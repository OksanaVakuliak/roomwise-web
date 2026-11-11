let cached: boolean | undefined;

function probe(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const options = { failIfMajorPerformanceCaveat: true };
  try {
    const context =
      canvas.getContext('webgl2', options) ??
      canvas.getContext('webgl', options);
    return context !== null;
  } catch {
    return false;
  }
}

export function isWebGlSupported(): boolean {
  cached ??= probe();
  return cached;
}
