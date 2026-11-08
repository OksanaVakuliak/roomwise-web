import type { EstimateMessage } from '@roomwise/calc-engine';
import { useTranslations } from 'next-intl';
import { lineErrorKey, warningKey } from '@/lib/api/errors';
import styles from './LineWarnings.module.css';

export type LineWarningsProps = {
  warnings: readonly EstimateMessage[];
  errorCode?: string | null;
};

type Values = Record<string, string | number>;

function valuesOf(params: EstimateMessage['params']): Values {
  const values: Values = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === 'string' || typeof value === 'number') {
      values[key] = value;
    }
  }
  return values;
}

export function LineWarnings({
  warnings,
  errorCode = null,
}: LineWarningsProps) {
  const t = useTranslations('Estimate');
  const tBreakdown = useTranslations('EstimateBreakdown');

  if (warnings.length === 0 && errorCode === null) {
    return null;
  }

  const warningText = (warning: EstimateMessage) =>
    t(`warning.${warningKey(warning.code)}`, valuesOf(warning.params));

  return (
    <ul className={styles.root} aria-label={tBreakdown('notesLabel')}>
      {errorCode === null ? null : (
        <li className={styles.item}>
          <span className={styles.mark} aria-hidden="true">
            !
          </span>
          <span className={styles.kind}>{tBreakdown('error')}</span>
          {t(`lineError.${lineErrorKey(errorCode)}`)}
        </li>
      )}
      {warnings.map((warning) => (
        <li
          key={`${warning.code}-${JSON.stringify(warning.params)}`}
          className={styles.item}
        >
          <span className={styles.mark} aria-hidden="true">
            !
          </span>
          <span className={styles.kind}>{tBreakdown('warning')}</span>
          {warningText(warning)}
        </li>
      ))}
    </ul>
  );
}
