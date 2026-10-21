import type { ErrorEvent, EventHint } from '@sentry/nextjs';

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

function localeOf(pathname: string): string {
  return pathname.split('/')[1] ?? '';
}

export function scrubEvent(
  event: ErrorEvent,
  readContext?: ContextReader,
): ErrorEvent {
  const fromClient = readContext?.() ?? {};
  const pathname = fromClient.pathname ?? pathnameOf(event.request?.url);
  const locale = fromClient.locale || localeOf(pathname);

  const tags: Record<string, string | number> = {
    ...event.tags,
    route: pathname,
  };
  if (locale) tags.locale = locale;
  if (fromClient.viewportWidth !== undefined) {
    tags.viewport_width = fromClient.viewportWidth;
  }

  const { user: _user, ...rest } = event;
  const scrubbed: ErrorEvent = { ...rest, tags };

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
