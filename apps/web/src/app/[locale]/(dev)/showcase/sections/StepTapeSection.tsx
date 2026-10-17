'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import {
  Button,
  TapeRule,
  TapeStep,
  type TapeStepState,
} from '@/components/ui';
import { SizeFrame } from '../DesktopFrame';
import styles from './StepTapeSection.module.css';

const STEP_NUMBERS = [1, 2, 3, 4, 5] as const;
const STATES: readonly TapeStepState[] = ['done', 'now', 'later'];
const SIZES = ['mobile', 'desktop'] as const;

type Size = (typeof SIZES)[number];

const noop = () => undefined;

function cellClass(size: Size, withLabel: boolean) {
  if (!withLabel) return styles.cellNarrow;
  return size === 'mobile' ? styles.cellMobile : styles.cellDesktop;
}

function FullStep({
  step,
  current,
  size,
  onSelect,
}: {
  step: (typeof STEP_NUMBERS)[number];
  current: number;
  size: Size;
  onSelect: (step: number) => void;
}) {
  const t = useTranslations('ShowcaseStepTape');
  const handleClick = useCallback(() => onSelect(step), [onSelect, step]);
  const state: TapeStepState =
    step < current ? 'done' : step === current ? 'now' : 'later';
  const stateText: Record<TapeStepState, string> = {
    done: t('stateDone'),
    now: t('stateNow'),
    later: t('stateLater'),
  };
  const showLabel = size === 'desktop' || step === current;

  return (
    <TapeStep
      size={size}
      state={state}
      number={t(`number${step}`)}
      label={showLabel ? t(`step${step}`) : undefined}
      stateLabel={stateText[state]}
      onClick={handleClick}
    />
  );
}

export function StepTapeSection() {
  const t = useTranslations('ShowcaseStepTape');
  const [current, setCurrent] = useState(3);
  const handleNext = useCallback(
    () => setCurrent((value) => Math.min(value + 1, 5)),
    [],
  );
  const handleBack = useCallback(() => setCurrent(1), []);

  const stateText: Record<TapeStepState, string> = {
    done: t('stateDone'),
    now: t('stateNow'),
    later: t('stateLater'),
  };
  const sizeText: Record<Size, string> = {
    mobile: t('sizeMobile'),
    desktop: t('sizeDesktop'),
  };

  return (
    <>
      <h3>{t('ruleHeading')}</h3>
      <p>{t('ruleMobile')}</p>
      <TapeRule className={styles.mobileRule} />
      <p>{t('ruleDesktop')}</p>
      <SizeFrame size="desktop" label={t('ruleDesktop')}>
        <TapeRule size="desktop" className={styles.desktopRule} />
      </SizeFrame>

      <h3>{t('stepHeading')}</h3>
      <p>{t('stepHint')}</p>
      {SIZES.map((size) => (
        <div key={size}>
          <p>{sizeText[size]}</p>
          <SizeFrame size={size} label={t('stepHeading')}>
            <div className={styles.grid}>
              {STATES.flatMap((state) =>
                [true, false].map((withLabel) => (
                  <div
                    key={`${state}-${withLabel}`}
                    className={`${styles.cell} ${cellClass(size, withLabel)}`}
                  >
                    <span>
                      {stateText[state]} ·{' '}
                      {withLabel ? t('withLabel') : t('withoutLabel')}
                    </span>
                    <TapeRule size={size}>
                      <TapeStep
                        size={size}
                        state={state}
                        number={t('number3')}
                        label={withLabel ? t('step3') : undefined}
                        stateLabel={stateText[state]}
                        onClick={noop}
                      />
                    </TapeRule>
                  </div>
                )),
              )}
            </div>
          </SizeFrame>
        </div>
      ))}

      <h3>{t('fullHeading')}</h3>
      <p>{t('fullHint')}</p>
      {SIZES.map((size) => (
        <div key={size}>
          <p>{sizeText[size]}</p>
          <SizeFrame size={size} label={t('fullHeading')}>
            <TapeRule
              size={size}
              label={`${t('tapeLabel')} (${sizeText[size]})`}
              className={
                size === 'mobile' ? styles.mobileRule : styles.desktopRule
              }
            >
              {STEP_NUMBERS.map((step) => (
                <FullStep
                  key={step}
                  step={step}
                  current={current}
                  size={size}
                  onSelect={setCurrent}
                />
              ))}
            </TapeRule>
          </SizeFrame>
        </div>
      ))}
      <div className={styles.actions}>
        <Button onClick={handleNext} disabled={current === 5}>
          {t('next')}
        </Button>
        <Button onClick={handleBack}>{t('back')}</Button>
      </div>
    </>
  );
}
