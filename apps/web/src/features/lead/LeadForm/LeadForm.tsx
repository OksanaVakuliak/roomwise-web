'use client';

import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Banner, Button, Checkbox, TextArea, TextField } from '@/components/ui';
import { WriteFailureNotice } from '@/features/configurator/result/WriteFailureNotice/WriteFailureNotice';
import { selectWarmupStatus, useWarmup } from '@/lib/warmup';
import {
  DEFAULT_PHONE,
  LEAD_FIELDS,
  LEAD_LIMITS,
  type LeadField,
  type LeadFieldErrors,
  type LeadInput,
  validateLead,
} from '../lead-fields';
import type { LeadState } from '../use-submit-lead';
import styles from './LeadForm.module.css';

export type LeadFormProps = {
  state: LeadState;
  onSubmit: (input: LeadInput) => void;
};

export function LeadForm({ state, onSubmit }: LeadFormProps) {
  const t = useTranslations('Lead');
  const warmingUp = useWarmup(selectWarmupStatus) !== 'ready';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<LeadFieldErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const refs = useMemo<Record<LeadField, RefObject<HTMLElement | null>>>(
    () => ({
      name: nameRef,
      phone: phoneRef,
      email: emailRef,
      comment: commentRef,
      consent: consentRef,
    }),
    [],
  );
  const consentText = t('form.consent');
  const pending = state.kind === 'pending';

  useEffect(() => {
    if (state.kind !== 'invalid') {
      return;
    }
    setErrors(state.errors);
    const first = LEAD_FIELDS.find((field) => state.errors[field]);
    if (first) {
      refs[first].current?.focus();
    }
  }, [state, refs]);

  const clear = useCallback((field: LeadField) => {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const bind =
    (field: LeadField, set: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      set(event.target.value);
      clear(field);
    };

  const changeConsent = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setConsent(event.target.checked);
      clear('consent');
    },
    [clear],
  );

  const changeWebsite = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setWebsite(event.target.value),
    [],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const found = validateLead({ name, phone, email, comment }, consent);
      setErrors(found);
      const first = LEAD_FIELDS.find((field) => found[field]);
      if (first) {
        refs[first].current?.focus();
        return;
      }
      onSubmit({
        name,
        phone,
        email,
        comment,
        consentText,
        website,
      });
    },
    [
      name,
      phone,
      email,
      comment,
      consent,
      website,
      consentText,
      onSubmit,
      refs,
    ],
  );

  const message = (field: LeadField) =>
    errors[field] ? t(`errors.${field}`) : undefined;

  return (
    <form className={styles.root} noValidate onSubmit={handleSubmit}>
      <TextField
        ref={nameRef}
        label={t('form.name')}
        name="name"
        autoComplete="name"
        maxLength={LEAD_LIMITS.name}
        required
        value={name}
        error={message('name')}
        onChange={bind('name', setName)}
      />
      <TextField
        ref={phoneRef}
        label={t('form.phone')}
        hint={t('form.phoneHint')}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={LEAD_LIMITS.phone}
        required
        value={phone}
        error={message('phone')}
        onChange={bind('phone', setPhone)}
      />
      <TextField
        ref={emailRef}
        label={t('form.email')}
        hint={t('form.emailHint')}
        name="email"
        type="email"
        autoComplete="email"
        maxLength={LEAD_LIMITS.email}
        value={email}
        error={message('email')}
        onChange={bind('email', setEmail)}
      />
      <TextArea
        ref={commentRef}
        label={t('form.comment')}
        hint={t('form.commentHint')}
        name="comment"
        maxLength={LEAD_LIMITS.comment}
        value={comment}
        error={message('comment')}
        onChange={bind('comment', setComment)}
      />
      <Checkbox
        ref={consentRef}
        label={t('form.consent')}
        name="consent"
        required
        checked={consent}
        error={message('consent')}
        onChange={changeConsent}
      />
      <div className={styles.trap} aria-hidden="true">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={changeWebsite}
        />
      </div>
      <div className={styles.actions}>
        <Button
          type="submit"
          kind="fill"
          loading={pending}
          loadingLabel={t(warmingUp ? 'form.warming' : 'form.sending')}
          disabled={state.kind === 'limited'}
        >
          {t('form.submit')}
        </Button>
        {state.kind === 'limited' ? (
          <Banner variant="warning">
            {t('form.rateLimited', { seconds: state.seconds })}
          </Banner>
        ) : null}
        {state.kind === 'failed' ? (
          <WriteFailureNotice namespace="Lead.failure" reason={state.reason} />
        ) : null}
      </div>
    </form>
  );
}
