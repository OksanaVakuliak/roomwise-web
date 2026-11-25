'use client';

import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Button, Modal, TextField } from '@/components/ui';
import { useLogin } from '@/lib/admin-api/auth';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';
import { useAdminSession } from './context';
import { useRateLimitCountdown } from './use-rate-limit-countdown';

type ReauthDialogProps = {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

function ReauthForm({ onSuccess, onCancel }: Omit<ReauthDialogProps, 'open'>) {
  const t = useTranslations('Admin.session.reauth');
  const tRoot = useTranslations();
  const { session } = useAdminSession();
  const knownLogin =
    session.status === 'authenticated' ? session.me.login : null;
  const [typedLogin, setLogin] = useState('');
  const login = knownLogin ?? typedLogin;
  const [password, setPassword] = useState('');
  const mutation = useLogin();

  const failure = mutation.error ? toAdminError(mutation.error) : null;
  const error = failure ? adminErrorMessage(failure) : null;
  const limitSeconds =
    failure?.kind === 'locked' || failure?.kind === 'rateLimited'
      ? failure.retryAfterSeconds
      : 0;
  const remaining = useRateLimitCountdown(limitSeconds);
  const blocked = limitSeconds > 0 && remaining > 0;

  const { mutate, reset } = mutation;

  useEffect(() => {
    if (limitSeconds > 0 && remaining === 0) reset();
  }, [limitSeconds, remaining, reset]);
  const onSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (blocked) return;
      mutate({ login, password }, { onSuccess });
    },
    [blocked, mutate, login, password, onSuccess],
  );
  const onLoginChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setLogin(event.target.value),
    [],
  );
  const onPasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
    [],
  );

  return (
    <form onSubmit={onSubmit}>
      <p>{t('text')}</p>
      <TextField
        label={t('login')}
        value={login}
        autoComplete="username"
        required
        readOnly={knownLogin !== null}
        onChange={onLoginChange}
      />
      <TextField
        label={t('password')}
        type="password"
        value={password}
        autoComplete="current-password"
        required
        error={
          error
            ? tRoot(
                `${error.namespace}.${error.key}` as never,
                {
                  ...error.values,
                  ...(limitSeconds > 0 ? { seconds: remaining } : {}),
                } as never,
              )
            : undefined
        }
        onChange={onPasswordChange}
      />
      <Button type="button" onClick={onCancel}>
        {t('cancel')}
      </Button>
      <Button
        type="submit"
        kind="fill"
        disabled={blocked}
        loading={mutation.isPending}
      >
        {t('submit')}
      </Button>
    </form>
  );
}

export function ReauthDialog({ open, onSuccess, onCancel }: ReauthDialogProps) {
  const t = useTranslations('Admin.session.reauth');
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t('title')}
      closeLabel={t('close')}
      dismissOnBackdrop={false}
    >
      <ReauthForm onSuccess={onSuccess} onCancel={onCancel} />
    </Modal>
  );
}
