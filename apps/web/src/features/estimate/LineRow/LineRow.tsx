import { type Locale, useFormatter, useTranslations } from 'next-intl';
import { ResultRow } from '@/components/ui';
import {
  type Currency,
  displayMoney,
  type ExchangeRate,
  unitPrice,
} from '@/lib/format';
import { LineWarnings } from '../LineWarnings/LineWarnings';
import type { EstimateLineModel } from '../model';
import styles from './LineRow.module.css';

export type LineRowProps = {
  line: EstimateLineModel;
  position: string;
  currency: Currency;
  locale: Locale;
  rate?: ExchangeRate;
};

const UNIT_KEYS: Record<string, 'sqm' | 'm' | 'pcs' | 'room'> = {
  SQM: 'sqm',
  ROOM_SQM: 'sqm',
  LINEAR_M: 'm',
  PIECE: 'pcs',
  ROOM: 'room',
};

export function LineRow({
  line,
  position,
  currency,
  locale,
  rate,
}: LineRowProps) {
  const t = useTranslations('EstimateBreakdown');
  const tEstimate = useTranslations('Estimate');
  const format = useFormatter();
  const unitKey = line.unit === null ? undefined : UNIT_KEYS[line.unit];

  const title =
    (line.disabled ? line.category : line.title) ?? t(`fallback.${line.kind}`);
  const price =
    line.unitPriceCents === null
      ? null
      : currency === 'UAH' && rate
        ? unitPrice(line.unitPriceCents, 'UAH', locale, rate)
        : unitPrice(line.unitPriceCents, 'USD', locale);
  const quantity =
    line.quantity !== null && unitKey !== undefined && !line.disabled
      ? `${format.number(line.quantity, { maximumFractionDigits: 2 })} ${tEstimate(`unit.${unitKey}`)}${price === null ? '' : ` × ${price}`}`
      : null;
  const included = line.status === 'INCLUDED' && !line.disabled;
  const note = [
    line.roomNames.join(', '),
    line.brand,
    line.disabled ? null : line.category,
    quantity,
    included ? tEstimate('status.INCLUDED') : null,
  ]
    .filter((part): part is string => part !== null && part !== '')
    .join(' · ');

  let value: string;
  if (line.disabled) {
    value = t('disabled');
  } else if (line.status === 'OK' && line.amountCents !== null) {
    value = displayMoney(
      line.amountCents,
      line.amountUahKopecks,
      currency,
      locale,
    );
  } else if (line.status === 'OK') {
    value = '—';
  } else if (included) {
    value = t('included');
  } else {
    value = tEstimate(`status.${line.status}`);
  }

  return (
    <li className={styles.root}>
      <ResultRow
        position={position}
        title={title}
        note={note || undefined}
        value={value}
        className={line.disabled ? styles.disabled : undefined}
      />
      {line.accessories.length === 0 ? null : (
        <ul className={styles.accessories}>
          {line.accessories.map((accessory) => (
            <li key={accessory.id}>
              {accessory.name} ·{' '}
              <span className="num">
                {displayMoney(
                  accessory.amountCents,
                  accessory.amountUahKopecks,
                  currency,
                  locale,
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {line.disabled ? null : (
        <LineWarnings warnings={line.warnings} errorCode={line.errorCode} />
      )}
    </li>
  );
}
