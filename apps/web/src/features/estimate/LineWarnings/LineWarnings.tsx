import type { EstimateMessage } from '@roomwise/calc-engine';
import { useTranslations } from 'next-intl';
import styles from './LineWarnings.module.css';

export type LineWarningsProps = {
  warnings: readonly EstimateMessage[];
  errorCode?: string | null;
};

type Values = Record<string, string | number>;

const WARNING_CODES = [
  'HEATED_FLOOR_INCOMPATIBLE',
  'OPTION_ROOM_TYPE_NOT_ALLOWED',
  'ROOMS_AREA_EXCEEDS_TOTAL',
  'ROOMS_AREA_BELOW_TOTAL',
  'LABOR_RATE_MISSING',
  'EXCHANGE_RATE_UNAVAILABLE',
] as const;
const ERROR_CODES = [
  'PRODUCT_UNAVAILABLE',
  'RULE_NOT_FOUND',
  'OPTION_SCOPE_NOT_ALLOWED',
] as const;

function isWarningCode(code: string): code is (typeof WARNING_CODES)[number] {
  return (WARNING_CODES as readonly string[]).includes(code);
}

function isErrorCode(code: string): code is (typeof ERROR_CODES)[number] {
  return (ERROR_CODES as readonly string[]).includes(code);
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
