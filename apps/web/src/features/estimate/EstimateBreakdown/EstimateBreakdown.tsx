import { type Locale, useTranslations } from 'next-intl';
import { type ReactNode, useId } from 'react';
import type { Money } from '@/lib/engine/sections';
import { type Currency, displayMoney, type ExchangeRate } from '@/lib/format';
import { LineRow } from '../LineRow/LineRow';
import type { EstimateLineModel, EstimateModel } from '../model';
import { SectionBlock } from '../SectionBlock/SectionBlock';
import styles from './EstimateBreakdown.module.css';

export type EstimateActionTarget =
  | { section: 'base' }
  | { section: 'balcony' }
  | { section: 'materials'; roomClientId: string }
  | { section: 'engineering' }
  | { section: 'additional' };

export type EstimateBreakdownProps = {
  model: EstimateModel;
  currency: Currency;
  locale: Locale;
  rate?: ExchangeRate;
  readOnly?: boolean;
  renderAction?: (target: EstimateActionTarget) => ReactNode;
};

export function EstimateBreakdown({
  model,
  currency,
  locale,
  rate,
  readOnly = false,
  renderAction,
}: EstimateBreakdownProps) {
  const t = useTranslations('EstimateBreakdown');
  const prefix = useId();
  const action = (target: EstimateActionTarget) =>
    readOnly || !renderAction ? undefined : renderAction(target);
  const amount = (money: Money | null) =>
    money === null
      ? undefined
      : displayMoney(money.usdCents, money.uahKopecks, currency, locale);

  const lineList = (
    lines: readonly EstimateLineModel[],
    number: number,
    offset = 0,
  ) => (
    <ul className={styles.list}>
      {lines.map((line, index) => (
        <LineRow
          key={line.id}
          line={line}
          position={`${number}.${offset + index + 1}`}
          currency={currency}
          locale={locale}
          rate={rate}
        />
      ))}
    </ul>
  );

  const { base, materials, engineering, additional } = model;
  let block = 0;
  const hasBase = base.lines.length > 0;
  const baseNumber = hasBase ? ++block : 0;
  const roomNumbers = materials.rooms.map(() => ++block);
  const balconyNumber = materials.balcony ? ++block : 0;
  const engineeringNumber = engineering.lines.length > 0 ? ++block : 0;
  const additionalNumber = additional.lines.length > 0 ? ++block : 0;

  return (
    <div className={styles.root}>
      {hasBase ? (
        <SectionBlock
          id={`${prefix}-base`}
          level={2}
          title={t('sections.base')}
          amount={amount(base.subtotal)}
          action={action({ section: 'base' })}
        >
          {lineList(base.lines, baseNumber)}
        </SectionBlock>
      ) : null}
      {materials.rooms.length > 0 || materials.balcony ? (
        <SectionBlock
          id={`${prefix}-materials`}
          level={2}
          title={t('sections.materials')}
          amount={amount(materials.subtotal)}
        >
          <div className={styles.rooms}>
            {materials.rooms.map((room, index) => (
              <SectionBlock
                key={room.roomClientId}
                id={`${prefix}-room-${room.roomClientId}`}
                level={3}
                title={room.name}
                amount={amount(room.subtotal)}
                action={action({
                  section: 'materials',
                  roomClientId: room.roomClientId,
                })}
              >
                {lineList(room.lines, roomNumbers[index] ?? 0)}
              </SectionBlock>
            ))}
            {materials.balcony ? (
              <SectionBlock
                id={`${prefix}-balcony`}
                level={3}
                title={t('sections.balcony')}
                amount={amount(materials.balcony.subtotal)}
                action={action({ section: 'balcony' })}
              >
                {lineList(materials.balcony.lines, balconyNumber)}
              </SectionBlock>
            ) : null}
          </div>
        </SectionBlock>
      ) : null}
      {engineering.lines.length > 0 ? (
        <SectionBlock
          id={`${prefix}-engineering`}
          level={2}
          title={t('sections.engineering')}
          amount={amount(engineering.subtotal)}
          action={action({ section: 'engineering' })}
        >
          {lineList(engineering.lines, engineeringNumber)}
        </SectionBlock>
      ) : null}
      {additional.lines.length > 0 ? (
        <SectionBlock
          id={`${prefix}-additional`}
          level={2}
          title={t('sections.additional')}
          amount={amount(additional.subtotal)}
          action={action({ section: 'additional' })}
        >
          {lineList(additional.lines, additionalNumber)}
        </SectionBlock>
      ) : null}
    </div>
  );
}
