'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ConfirmDialog } from '@/components/ui';

type Pending = { kind: 'link'; href: string } | { kind: 'history' };

const SENTINEL = '__leaveGuard';

const onSentinel = () =>
  Boolean((window.history.state as Record<string, unknown> | null)?.[SENTINEL]);

const pushSentinel = () => {
  const current = window.history.state as Record<string, unknown> | null;
  window.history.pushState(
    { ...current, [SENTINEL]: true },
    '',
    window.location.href,
  );
};

const hasModifier = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

function internalTarget(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0 || hasModifier(event)) {
    return null;
  }
  const anchor = (event.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (
    (anchor.target && anchor.target !== '_self') ||
    anchor.hasAttribute('download')
  ) {
    return null;
  }
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search
  ) {
    return null;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function useLeaveGuard(dirty: boolean): { dialog: ReactNode } {
  const t = useTranslations('Admin.form.leave');
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      const href = internalTarget(event);
      if (href === null) return;
      event.preventDefault();
      event.stopPropagation();
      setPending({ kind: 'link', href });
    };
    const onPopState = () => {
      if (leaving.current) return;
      pushSentinel();
      setPending({ kind: 'history' });
    };
    if (!onSentinel()) pushSentinel();
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, [dirty]);

  const cancel = useCallback(() => setPending(null), []);

  const confirm = useCallback(() => {
    const target = pending;
    setPending(null);
    if (target?.kind === 'link') {
      router.push(target.href);
    } else if (target?.kind === 'history') {
      leaving.current = true;
      window.history.go(-2);
    }
  }, [pending, router]);

  return {
    dialog: (
      <ConfirmDialog
        open={pending !== null}
        title={t('title')}
        description={t('description')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        closeLabel={t('close')}
        tone="danger"
        onConfirm={confirm}
        onCancel={cancel}
      />
    ),
  };
}
