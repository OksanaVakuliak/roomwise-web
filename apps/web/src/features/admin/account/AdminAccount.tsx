'use client';

import { useTranslations } from 'next-intl';
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import {
  Banner,
  Button,
  DisabledReason,
  PageTitle,
  TextField,
} from '@/components/ui';
import { useAdminSession, useCan } from '@/features/admin/session';
import { useChangePassword } from '@/lib/admin-api/auth';
import {
  type AdminFieldError,
  adminErrorMessage,
  fieldErrorMessage,
  toAdminError,
} from '@/lib/admin-api/errors';
import { toast } from '@/lib/toast';
import styles from './AdminAccount.module.css';

export function AdminAccount() {
  const t = useTranslations('AdminAccount');
  const tRoot = useTranslations();
  const { session, withReauth } = useAdminSession();
  const can = useCan('change-password');
  const mutation = useChangePassword();
  const { mutateAsync, reset } = mutation;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);

  const handler = useCallback(
    (set: (value: string) => void) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        set(event.target.value);
        setMismatch(false);
      },
    [],
  );
  const onCurrentChange = handler(setCurrent);
  const onNextChange = handler(setNext);
  const onConfirmChange = handler(setConfirm);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!can.allowed) return;
      if (next !== confirm) {
        setMismatch(true);
        return;
      }
      try {
        await withReauth(() =>
          mutateAsync({ currentPassword: current, newPassword: next }),
        );
      } catch {
        return;
      }
      setCurrent('');
      setNext('');
      setConfirm('');
      reset();
      toast.success(t('changed'));
    },
    [can.allowed, next, confirm, current, withReauth, mutateAsync, reset, t],
  );

  const failure = mutation.error ? toAdminError(mutation.error) : null;
  const fieldErrors: AdminFieldError[] =
    failure?.kind === 'validation' ? failure.fields : [];
  const translate = (message: ReturnType<typeof adminErrorMessage>) =>
    tRoot(
      `${message.namespace}.${message.key}` as never,
      message.values as never,
    );
  const fieldError = (path: string) => {
    const found = fieldErrors.find((field) => field.path === path);
    return found ? translate(fieldErrorMessage(found)) : undefined;
  };

  const showBanner =
    failure !== null &&
    failure.kind !== 'validation' &&
    failure.kind !== 'invalidCredentials';

  const login = session.status === 'authenticated' ? session.me.login : '';
  const disabled = !can.allowed;

  const submit = (
    <Button
      type="submit"
      kind="fill"
      loading={mutation.isPending}
      loadingLabel={t('submitting')}
    >
      {t('submit')}
    </Button>
  );

  return (
    <div className={styles.root}>
      <PageTitle>{t('title')}</PageTitle>
      <dl className={styles.login}>
        <dt className={styles.loginLabel}>{t('login')}</dt>
        <dd className={styles.loginValue}>{login}</dd>
      </dl>
      <h2 className={styles.heading}>{t('passwordTitle')}</h2>
      <form className={styles.form} onSubmit={onSubmit}>
        {showBanner ? (
          <Banner variant="error">
            {translate(adminErrorMessage(failure))}
          </Banner>
        ) : null}
        <TextField
          label={t('currentPassword')}
          type="password"
          value={current}
          autoComplete="current-password"
          required
          disabled={disabled}
          error={
            failure?.kind === 'invalidCredentials'
              ? t('wrongPassword')
              : fieldError('currentPassword')
          }
          onChange={onCurrentChange}
        />
        <TextField
          label={t('newPassword')}
          type="password"
          value={next}
          autoComplete="new-password"
          hint={t('newPasswordHint')}
          required
          disabled={disabled}
          error={fieldError('newPassword')}
          onChange={onNextChange}
        />
        <TextField
          label={t('confirmPassword')}
          type="password"
          value={confirm}
          autoComplete="new-password"
          required
          disabled={disabled}
          error={mismatch ? t('mismatch') : undefined}
          onChange={onConfirmChange}
        />
        {can.allowed ? (
          submit
        ) : (
          <DisabledReason reason={can.reason}>{submit}</DisabledReason>
        )}
      </form>
    </div>
  );
}
