'use client';

import { useTranslations } from 'next-intl';
import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';
import { Button, Modal, TextField } from '@/components/ui';
import { useLogin } from '@/lib/admin-api/auth';
import { adminErrorMessage, toAdminError } from '@/lib/admin-api/errors';

type ReauthDialogProps = {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

function ReauthForm({ onSuccess, onCancel }: Omit<ReauthDialogProps, 'open'>) {
  const t = useTranslations('Admin.session.reauth');
  const tRoot = useTranslations();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useLogin();

  const error = mutation.error
    ? adminErrorMessage(toAdminError(mutation.error))
    : null;

  const { mutate } = mutation;
  const onSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      mutate({ login, password }, { onSuccess });
    },
    [mutate, login, password, onSuccess],
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
                } as never,
              )
            : undefined
        }
        onChange={onPasswordChange}
      />
      <Button type="button" onClick={onCancel}>
        {t('cancel')}
      </Button>
      <Button type="submit" kind="fill" loading={mutation.isPending}>
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
