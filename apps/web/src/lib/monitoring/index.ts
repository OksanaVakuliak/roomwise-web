import type { Breadcrumb, ErrorEvent, EventHint } from '@sentry/nextjs';

export type EventContext = {
  pathname: string;
  locale: string;
  viewportWidth?: number;
};

type ContextReader = () => Partial<EventContext>;

function pathnameOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return '';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_TOKEN = /^[A-Za-z0-9_-]{16,}$/;
const DROPPED_CATEGORIES = new Set(['console', 'ui.input']);
const URL_KEYS = ['url', 'from', 'to'] as const;

function isDynamicSegment(segment: string): boolean {
  return (
    UUID.test(segment) ||
    LONG_TOKEN.test(segment) ||
    (segment.length > 6 && /\d/.test(segment))
  );
}

export function normalizeRoute(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => (isDynamicSegment(segment) ? '[id]' : segment))
    .join('/');
}

function scrubUrl(value: string): string {
  return normalizeRoute(pathnameOf(value));
}

function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.category && DROPPED_CATEGORIES.has(breadcrumb.category)) {
    return null;
  }
  if (!breadcrumb.data) return breadcrumb;
  const data = { ...breadcrumb.data };
  for (const key of URL_KEYS) {
    if (typeof data[key] === 'string') data[key] = scrubUrl(data[key]);
  }
  return { ...breadcrumb, data };
}

function localeOf(pathname: string): string {
  return pathname.split('/')[1] ?? '';
}

export function scrubEvent(
  event: ErrorEvent,
  readContext?: ContextReader,
): ErrorEvent {
  const fromClient = readContext?.() ?? {};
  const pathname = normalizeRoute(
    fromClient.pathname ?? pathnameOf(event.request?.url),
  );
  const locale = fromClient.locale || localeOf(pathname);

  const tags: Record<string, string | number> = {
    ...event.tags,
    route: pathname,
  };
  if (locale) tags.locale = locale;
  if (fromClient.viewportWidth !== undefined) {
    tags.viewport_width = fromClient.viewportWidth;
  }

  const { user: _user, extra: _extra, ...rest } = event;
  const scrubbed: ErrorEvent = { ...rest, tags };

  if (event.breadcrumbs) {
    scrubbed.breadcrumbs = event.breadcrumbs.flatMap((breadcrumb) => {
      const clean = scrubBreadcrumb(breadcrumb);
      return clean ? [clean] : [];
    });
  }

  if (event.request) {
    const {
      url: _url,
      headers: _headers,
      cookies: _cookies,
      data: _data,
      query_string: _query,
      ...request
    } = event.request;
    scrubbed.request = pathname ? { ...request, url: pathname } : request;
  }

  return scrubbed;
}

export function createSentryOptions(
  dsn: string | undefined,
  readContext?: ContextReader,
) {
  return {
    dsn,
    enabled: Boolean(dsn),
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeBreadcrumb: (breadcrumb: Breadcrumb) => scrubBreadcrumb(breadcrumb),
    beforeSend: (event: ErrorEvent, _hint: EventHint) =>
      scrubEvent(event, readContext),
  };
}

export function readBrowserContext(): EventContext {
  return {
    pathname: window.location.pathname,
    locale: document.documentElement.lang,
    viewportWidth: window.innerWidth,
  };
}
