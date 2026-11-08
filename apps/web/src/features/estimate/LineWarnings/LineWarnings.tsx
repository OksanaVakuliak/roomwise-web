import type { EstimateMessage } from '@roomwise/calc-engine';
import { useTranslations } from 'next-intl';
import {
  ESTIMATE_LINE_ERROR_CODES,
  ESTIMATE_WARNING_CODES,
} from '@/lib/api/errors';
import styles from './LineWarnings.module.css';

export type LineWarningsProps = {
  warnings: readonly EstimateMessage[];
  errorCode?: string | null;
};

type EstimateWarningCode = (typeof ESTIMATE_WARNING_CODES)[number];
type EstimateLineErrorCode = (typeof ESTIMATE_LINE_ERROR_CODES)[number];
type Values = Record<string, string | number>;

const WARNING_CODES: readonly string[] = ESTIMATE_WARNING_CODES;
const ERROR_CODES: readonly string[] = ESTIMATE_LINE_ERROR_CODES;

function isWarningCode(code: string): code is EstimateWarningCode {
  return WARNING_CODES.includes(code);
}

function isErrorCode(code: string): code is EstimateLineErrorCode {
  return ERROR_CODES.includes(code);
}

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
    isWarningCode(warning.code)
      ? t(`warning.${warning.code}`, valuesOf(warning.params))
      : t('warning.generic');

  return (
    <ul className={styles.root} aria-label={tBreakdown('notesLabel')}>
      {errorCode === null ? null : (
        <li className={styles.item}>
          <span className={styles.mark} aria-hidden="true">
            !
          </span>
          <span className={styles.kind}>{tBreakdown('error')}</span>
          {isErrorCode(errorCode)
            ? t(`lineError.${errorCode}`)
            : t('lineError.generic')}
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
