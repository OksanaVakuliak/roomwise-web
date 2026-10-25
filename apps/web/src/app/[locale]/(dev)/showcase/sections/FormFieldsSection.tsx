'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useId } from 'react';
import {
  Checkbox,
  FileField,
  NumberField,
  RadioCard,
  RadioCardGroup,
  Select,
  Stepper,
  TextField,
} from '@/components/ui';
import { SizeFrame } from '../DesktopFrame';
import styles from './FormFieldsSection.module.css';

const STATES = ['default', 'filled', 'error', 'disabled', 'loading'] as const;
type FieldState = (typeof STATES)[number];

function Cell({ state, children }: { state: FieldState; children: ReactNode }) {
  const t = useTranslations('ShowcaseFormFields');

  return (
    <div className={styles.cell}>
      <p className={styles.caption}>{t(`states.${state}`)}</p>
      {children}
    </div>
  );
}

function Row({
  title,
  size,
  children,
}: {
  title: string;
  size: 'mobile' | 'desktop';
  children: ReactNode;
}) {
  return (
    <div className={styles.group}>
      <h4 className={styles.groupTitle}>{title}</h4>
      <div className={size === 'desktop' ? styles.wide : styles.grid}>
        {children}
      </div>
    </div>
  );
}

function stateProps(state: FieldState, error: string, loadingLabel: string) {
  return {
    error: state === 'error' ? error : undefined,
    disabled: state === 'disabled' || undefined,
    loading: state === 'loading' || undefined,
    loadingLabel: state === 'loading' ? loadingLabel : undefined,
  };
}

function FieldsDemo({ size }: { size: 'mobile' | 'desktop' }) {
  const t = useTranslations('ShowcaseFormFields');
  const radioName = useId();

  return (
    <>
      <Row size={size} title={t('textTitle')}>
        {STATES.map((state) => (
          <Cell key={state} state={state}>
            <TextField
              label={t('name')}
              hint={t('nameHint')}
              placeholder={t('namePlaceholder')}
              defaultValue={state === 'filled' ? t('nameValue') : undefined}
              required={state === 'error'}
              {...stateProps(state, t('nameError'), t('loadingLabel'))}
            />
          </Cell>
        ))}
      </Row>

      <Row size={size} title={t('numberTitle')}>
        {STATES.map((state) => (
          <Cell key={state} state={state}>
            <NumberField
              label={t('area')}
              unit={t('areaUnit')}
              hint={t('areaHint')}
              defaultValue={state === 'filled' ? 18.5 : undefined}
              step={0.1}
              decimal
              {...stateProps(state, t('areaError'), t('loadingLabel'))}
            />
          </Cell>
        ))}
      </Row>

      <Row size={size} title={t('stepperTitle')}>
        {STATES.map((state) => (
          <Cell key={state} state={state}>
            <Stepper
              label={t('rooms')}
              decrementLabel={t('decrease')}
              incrementLabel={t('increase')}
              hint={t('roomsHint')}
              min={1}
              max={5}
              defaultValue={state === 'filled' ? 5 : 1}
              {...stateProps(state, t('roomsError'), t('loadingLabel'))}
            />
          </Cell>
        ))}
      </Row>

      <Row size={size} title={t('selectTitle')}>
        {STATES.map((state) => (
          <Cell key={state} state={state}>
            <Select
              label={t('floor')}
              placeholder={t('floorPlaceholder')}
              hint={t('floorHint')}
              defaultValue={state === 'filled' ? 'wood' : undefined}
              {...stateProps(state, t('floorError'), t('loadingLabel'))}
            >
              <option value="tile">{t('tile')}</option>
              <option value="wood">{t('wood')}</option>
              <option value="laminate">{t('laminate')}</option>
            </Select>
          </Cell>
        ))}
      </Row>

      <Row size={size} title={t('checkboxTitle')}>
        {STATES.filter((state) => state !== 'loading').map((state) => (
          <Cell key={state} state={state}>
            <Checkbox
              label={t('heated')}
              hint={t('heatedHint')}
              defaultChecked={state === 'filled'}
              error={state === 'error' ? t('heatedError') : undefined}
              disabled={state === 'disabled'}
            />
          </Cell>
        ))}
      </Row>

      <Row size={size} title={t('radioTitle')}>
        {STATES.map((state) => (
          <Cell key={state} state={state}>
            <RadioCardGroup
              label={t('style')}
              hint={t('styleHint')}
              error={state === 'error' ? t('styleError') : undefined}
              loading={state === 'loading'}
              loadingLabel={t('loadingLabel')}
            >
              <RadioCard
                name={`${radioName}-${state}`}
                value="loft"
                label={t('loft')}
                description={t('loftNote')}
                defaultChecked={state === 'filled'}
                disabled={state === 'disabled'}
              />
              <RadioCard
                name={`${radioName}-${state}`}
                value="classic"
                label={t('classic')}
                description={t('classicNote')}
                disabled={state === 'disabled'}
              />
            </RadioCardGroup>
          </Cell>
        ))}
      </Row>

      <Row size={size} title={t('fileTitle')}>
        {STATES.map((state) => (
          <Cell key={state} state={state}>
            <FileField
              label={t('plan')}
              hint={t('planHint')}
              buttonLabel={t('planButton')}
              emptyLabel={t('planEmpty')}
              fileName={state === 'filled' ? t('planName') : undefined}
              {...stateProps(state, t('planError'), t('planUploading'))}
            />
          </Cell>
        ))}
      </Row>
    </>
  );
}

export function FormFieldsSection() {
  const t = useTranslations('ShowcaseFormFields');

  return (
    <>
      <p>{t('note')}</p>
      <h3 className={styles.title}>{t('mobile')}</h3>
      <FieldsDemo size="mobile" />
      <h3 className={styles.title}>{t('desktop')}</h3>
      <SizeFrame size="desktop" label={t('desktop')}>
        <FieldsDemo size="desktop" />
      </SizeFrame>
    </>
  );
}
