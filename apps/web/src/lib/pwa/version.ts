const VERSION_PARAM = 'v';

export function workerUrl(path: string, version: string | undefined): string {
  return version
    ? `${path}?${VERSION_PARAM}=${encodeURIComponent(version)}`
    : path;
}

export function isNewVersion(
  scriptUrl: string | undefined,
  pageVersion: string | undefined,
): boolean {
  if (!scriptUrl || !pageVersion) {
    return false;
  }
  const workerVersion = new URL(scriptUrl, 'http://localhost').searchParams.get(
    VERSION_PARAM,
  );
  return workerVersion !== null && workerVersion !== pageVersion;
}
