import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './StepLayout.module.css';

export type StepLayoutProps = {
  steps: ReactNode;
  picker?: ReactNode;
  content: ReactNode;
  scene: ReactNode;
  detail?: ReactNode;
  showcase: ReactNode;
  cost: ReactNode;
  single?: boolean;
  className?: string;
};

export function StepLayout({
  steps,
  picker,
  content,
  scene,
  detail,
  showcase,
  cost,
  single = false,
  className,
}: StepLayoutProps) {
  const t = useTranslations('StepLayout');

  if (single) {
    return (
      <div className={cx(styles.root, className)}>
        <div className={styles.steps}>{steps}</div>
        <div className={styles.single}>
          <div className={styles.content}>{content}</div>
          <section className={styles.cost} aria-label={t('cost')}>
            {cost}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.steps}>{steps}</div>
      <div
        className={cx(styles.body, picker !== undefined && styles.withPicker)}
      >
        {picker ? (
          <section className={styles.picker} aria-label={t('picker')}>
            {picker}
          </section>
        ) : null}
        <div className={styles.main}>
          <div className={styles.content}>{content}</div>
          <section className={styles.scene} aria-label={t('scene')}>
            {scene}
          </section>
          {detail ? <div className={styles.detail}>{detail}</div> : null}
        </div>
        <div className={styles.aside}>
          <section className={styles.showcase} aria-label={t('showcase')}>
            {showcase}
          </section>
          <section className={styles.cost} aria-label={t('cost')}>
            {cost}
          </section>
        </div>
      </div>
    </div>
  );
}
