export const ADMIN_HOME = '/admin';
const LOGIN_PATH = '/admin/login';
const BASE = 'http://admin.invalid';

export function resolveAdminNext(raw: string | null | undefined): string {
  if (!raw?.startsWith('/') || raw.startsWith('//')) return ADMIN_HOME;
  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return ADMIN_HOME;
  }
  const { pathname } = url;
  const inside = pathname === ADMIN_HOME || pathname.startsWith('/admin/');
  const loop = pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
  if (url.origin !== BASE || !inside || loop) return ADMIN_HOME;
  return `${pathname}${url.search}${url.hash}`;
}
