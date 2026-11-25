'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { WarmupGate } from '@/components/system';
import { Banner, Button, PageTitle, TextField } from '@/components/ui';
import {
  resolveAdminNext,
  useAdminSession,
  useRateLimitCountdown,
} from '@/features/admin/session';
import { useRouter } from '@/i18n/navigation';
import { useLogin } from '@/lib/admin-api/auth';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const t = useTranslations('AdminAuth');
  const demoId = useId();
  const tRoot = useTranslations();
  const router = useRouter();
  const { session } = useAdminSession();
  const next = resolveAdminNext(useSearchParams().get('next'));
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useLogin();
  const { mutate, reset } = mutation;

  const demoLogin = process.env.NEXT_PUBLIC_DEMO_ADMIN_LOGIN;
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD;
  const demo = demoLogin && demoPassword ? { demoLogin, demoPassword } : null;

  const failure = mutation.error ? toAdminError(mutation.error) : null;
  const limitSeconds =
    failure?.kind === 'locked' || failure?.kind === 'rateLimited'
      ? failure.retryAfterSeconds
      : 0;
  const remaining = useRateLimitCountdown(limitSeconds);
  const limited = limitSeconds > 0;
  const blocked = limited && remaining > 0;

  const authenticated = session.status === 'authenticated';
  const redirected = useRef(false);
  useEffect(() => {
    if (!authenticated || redirected.current) return;
    redirected.current = true;
    router.replace(next);
  }, [authenticated, next, router]);

  useEffect(() => {
    if (limited && remaining === 0) reset();
  }, [limited, remaining, reset]);

  const onSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (blocked) return;
      mutate({ login, password });
    },
    [blocked, mutate, login, password],
  );
  const onLoginChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setLogin(event.target.value),
    [],
  );
  const onPasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
    [],
  );
  const fillDemo = useCallback(() => {
    if (!demoLogin || !demoPassword) return;
    setLogin(demoLogin);
    setPassword(demoPassword);
  }, [demoLogin, demoPassword]);

  let banner = null;
  if (failure) {
    const message = adminErrorMessage(failure);
    banner = (
      <Banner variant={limited ? 'warning' : 'error'}>
        {limited
          ? t(failure.kind === 'locked' ? 'locked' : 'rateLimited')
          : tRoot(
              `${message.namespace}.${message.key}` as never,
              message.values as never,
            )}
      </Banner>
    );
  }

  return (
    <WarmupGate>
      <div className={styles.root}>
        <PageTitle>{t('title')}</PageTitle>
        <p className={styles.lead}>{t('lead')}</p>
        <form className={styles.form} onSubmit={onSubmit}>
          {banner}
          {blocked ? (
            <p className={styles.countdown}>
              {t('retryIn', { seconds: remaining })}
            </p>
          ) : null}
          <TextField
            label={t('login')}
            value={login}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            onChange={onLoginChange}
          />
          <TextField
            label={t('password')}
            type="password"
            value={password}
            autoComplete="current-password"
            required
            onChange={onPasswordChange}
          />
          <Button
            type="submit"
            kind="fill"
            disabled={blocked}
            loading={mutation.isPending}
            loadingLabel={t('submitting')}
          >
            {t('submit')}
          </Button>
        </form>
        {demo ? (
          <section className={styles.demo} aria-labelledby={demoId}>
            <h2 id={demoId} className={styles.demoTitle}>
              {t('demo.title')}
            </h2>
            <p className={styles.demoText}>{t('demo.text')}</p>
            <dl className={styles.credentials}>
              <dt>{t('login')}</dt>
              <dd>{demo.demoLogin}</dd>
              <dt>{t('password')}</dt>
              <dd>{demo.demoPassword}</dd>
            </dl>
            <Button onClick={fillDemo}>{t('demo.fill')}</Button>
          </section>
        ) : null}
      </div>
    </WarmupGate>
  );
}
