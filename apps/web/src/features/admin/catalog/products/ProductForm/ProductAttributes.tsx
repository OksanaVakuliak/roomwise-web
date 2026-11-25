'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useId, useRef } from 'react';
import {
  Button,
  IconButton,
  LocalizedField,
  SectionHeader,
} from '@/components/ui';
import styles from './ProductForm.module.css';
import {
  type AttributeValue,
  emptyAttribute,
  type LocalizedValue,
  MAX_ATTRIBUTES,
} from './product-values';

export type ProductAttributesProps = {
  attributes: AttributeValue[];
  errors: Record<string, string>;
  onChange: (next: AttributeValue[]) => void;
};

type RowProps = {
  index: number;
  attribute: AttributeValue;
  errors: Record<string, string>;
  onUpdate: (index: number, next: AttributeValue) => void;
  onRemove: (index: number) => void;
};

function AttributeRow({
  index,
  attribute,
  errors,
  onUpdate,
  onRemove,
}: RowProps) {
  const t = useTranslations('AdminCatalog.products.form.attributes');
  const tFields = useTranslations('Admin.fields');
  const prefix = `attributes[${index}]`;

  const changeName = useCallback(
    (name: LocalizedValue) => onUpdate(index, { ...attribute, name }),
    [index, attribute, onUpdate],
  );
  const changeValue = useCallback(
    (value: LocalizedValue) => onUpdate(index, { ...attribute, value }),
    [index, attribute, onUpdate],
  );
  const remove = useCallback(() => onRemove(index), [index, onRemove]);
  const languageLabels = {
    en: tFields('languages.en'),
    uk: tFields('languages.uk'),
  };

  return (
    <li className={styles.attribute}>
      <LocalizedField
        label={t('name', { n: index + 1 })}
        value={attribute.name}
        onChange={changeName}
        languageLabels={languageLabels}
        requiredForPublishLabel={tFields('requiredForPublish')}
        requiredForPublish
        errors={{
          en: errors[`${prefix}.name.en`],
          uk: errors[`${prefix}.name.uk`],
        }}
      />
      <LocalizedField
        label={t('value', { n: index + 1 })}
        value={attribute.value}
        onChange={changeValue}
        languageLabels={languageLabels}
        requiredForPublishLabel={tFields('requiredForPublish')}
        requiredForPublish
        errors={{
          en: errors[`${prefix}.value.en`],
          uk: errors[`${prefix}.value.uk`],
        }}
      />
      <IconButton
        icon="trash"
        label={t('remove', { n: index + 1 })}
        onClick={remove}
      />
    </li>
  );
}

export function ProductAttributes({
  attributes,
  errors,
  onChange,
}: ProductAttributesProps) {
  const t = useTranslations('AdminCatalog.products.form.attributes');
  const headingId = useId();
  const keys = useRef<string[]>([]);
  while (keys.current.length < attributes.length) {
    keys.current.push(crypto.randomUUID());
  }
  keys.current.length = attributes.length;

  const update = useCallback(
    (index: number, next: AttributeValue) =>
      onChange(attributes.map((item, at) => (at === index ? next : item))),
    [attributes, onChange],
  );
  const remove = useCallback(
    (index: number) => {
      keys.current.splice(index, 1);
      onChange(attributes.filter((_, at) => at !== index));
    },
    [attributes, onChange],
  );
  const add = useCallback(
    () => onChange([...attributes, emptyAttribute()]),
    [attributes, onChange],
  );

  const full = attributes.length >= MAX_ATTRIBUTES;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <SectionHeader id={headingId} title={t('title')} />
      {attributes.length > 0 ? (
        <ul className={styles.attributes}>
          {attributes.map((attribute, index) => (
            <AttributeRow
              key={keys.current[index]}
              index={index}
              attribute={attribute}
              errors={errors}
              onUpdate={update}
              onRemove={remove}
            />
          ))}
        </ul>
      ) : null}
      <Button kind="outline" disabled={full} onClick={add}>
        {t('add')}
      </Button>
      {full ? (
        <p className={styles.note}>{t('limit', { max: MAX_ATTRIBUTES })}</p>
      ) : null}
    </section>
  );
}
