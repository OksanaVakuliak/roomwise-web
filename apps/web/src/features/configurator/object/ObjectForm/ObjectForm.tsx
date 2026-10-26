'use client';

import { useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback } from 'react';
import {
  Checkbox,
  NumberField,
  RadioCard,
  RadioCardGroup,
  SwitchRow,
} from '@/components/ui';
import { cx } from '@/lib/cx';
import type { DraftV1 } from '@/lib/draft/schema';
import { parseDecimal, useDecimalText } from '@/lib/form';
import { useDraft } from '@/stores/draft';
import { type ObjectFieldId, objectFieldDomId } from './field-ids';
import styles from './ObjectForm.module.css';

export type ObjectFormErrors = Partial<Record<ObjectFieldId, string>>;

export type ObjectFormProps = {
  errors?: ObjectFormErrors;
  className?: string;
};

type FinishLevel = NonNullable<DraftV1['object']['finishLevel']>;
type KitchenType = DraftV1['object']['kitchenType'];

const FINISH_LEVELS: readonly FinishLevel[] = ['ROUGH', 'PRE_FINISH'];
const KITCHEN_TYPES: readonly KitchenType[] = ['SEPARATE', 'KITCHEN_LIVING'];

const FINISH_LABEL = {
  ROUGH: 'finishRough',
  PRE_FINISH: 'finishPre',
} as const satisfies Record<FinishLevel, string>;

const KITCHEN_LABEL = {
  SEPARATE: 'kitchenSeparate',
  KITCHEN_LIVING: 'kitchenLiving',
} as const satisfies Record<KitchenType, string>;

export function ObjectForm({ errors = {}, className }: ObjectFormProps) {
  const t = useTranslations('ObjectStep.form');
  const object = useDraft((state) => state.object);
  const setObject = useDraft((state) => state.setObject);
  const { balcony } = object;
  const unit = t('unitSqm');
  const [totalText, setTotalText] = useDecimalText(object.totalAreaSqm);
  const [balconyText, setBalconyText] = useDecimalText(balcony.areaSqm);

  const changeFinish = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setObject({ finishLevel: event.target.value as FinishLevel }),
    [setObject],
  );
  const changeKitchen = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setObject({ kitchenType: event.target.value as KitchenType }),
    [setObject],
  );
  const changeTotal = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setTotalText(event.target.value);
      setObject({ totalAreaSqm: parseDecimal(event.target.value) ?? null });
    },
    [setObject, setTotalText],
  );
  const changeGas = useCallback(
    (gas: boolean) => setObject({ gas }),
    [setObject],
  );
  const changePresent = useCallback(
    (present: boolean) => setObject({ balcony: { ...balcony, present } }),
    [setObject, balcony],
  );
  const changeBalconyArea = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setBalconyText(event.target.value);
      const areaSqm = parseDecimal(event.target.value) ?? null;
      setObject({ balcony: { ...balcony, areaSqm } });
    },
    [setObject, balcony, setBalconyText],
  );
  const changeTiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setObject({ balcony: { ...balcony, tiles: event.target.checked } }),
    [setObject, balcony],
  );

  return (
    <div className={cx(styles.root, className)}>
      <RadioCardGroup
        label={t('finishLevel')}
        error={errors.finishLevel}
        required
      >
        {FINISH_LEVELS.map((level, index) => (
          <RadioCard
            key={level}
            id={index === 0 ? objectFieldDomId('finishLevel') : undefined}
            name="object-finishLevel"
            value={level}
            label={t(FINISH_LABEL[level])}
            checked={object.finishLevel === level}
            onChange={changeFinish}
          />
        ))}
      </RadioCardGroup>

      <NumberField
        id={objectFieldDomId('totalArea')}
        label={t('totalArea')}
        unit={unit}
        error={errors.totalArea}
        decimal
        required
        value={totalText}
        onChange={changeTotal}
      />

      <RadioCardGroup label={t('kitchenType')} error={errors.kitchenType}>
        {KITCHEN_TYPES.map((type, index) => (
          <RadioCard
            key={type}
            id={index === 0 ? objectFieldDomId('kitchenType') : undefined}
            name="object-kitchenType"
            value={type}
            label={t(KITCHEN_LABEL[type])}
            checked={object.kitchenType === type}
            onChange={changeKitchen}
          />
        ))}
      </RadioCardGroup>

      <SwitchRow
        title={t('gas')}
        checked={object.gas}
        onCheckedChange={changeGas}
      />

      <div className={styles.balcony}>
        <SwitchRow
          title={t('balcony')}
          checked={balcony.present}
          onCheckedChange={changePresent}
        />
        {balcony.present ? (
          <div className={styles.balconyFields}>
            <NumberField
              id={objectFieldDomId('balconyArea')}
              label={t('balconyArea')}
              unit={unit}
              error={errors.balconyArea}
              decimal
              value={balconyText}
              onChange={changeBalconyArea}
            />
            <Checkbox
              id={objectFieldDomId('balconyTiles')}
              label={t('balconyTiles')}
              error={errors.balconyTiles}
              checked={balcony.tiles}
              onChange={changeTiles}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
