'use client';

import { useTranslations } from 'next-intl';
import { type ChangeEvent, useCallback, useId } from 'react';
import {
  ColorField,
  FileField,
  NumberField,
  Progress,
  SectionHeader,
  TexturePreview,
} from '@/components/ui';
import { IMAGE_ACCEPT } from '@/lib/admin-api/upload';
import styles from './ProductForm.module.css';
import type { ProductValues } from './product-values';
import type { UploadEntry } from './use-uploads';

export type ProductTextureProps = {
  values: ProductValues;
  errors: Record<string, string>;
  upload: UploadEntry | undefined;
  resetKey: number;
  onField: <K extends keyof ProductValues>(
    key: K,
    value: ProductValues[K],
  ) => void;
  onFile: (file: File) => void;
  onColorValidity: (valid: boolean) => void;
};

const positive = (raw: string): number => {
  const value = Number(raw.replace(',', '.'));
  return Number.isInteger(value) && value > 0 ? value : 0;
};

export function ProductTexture({
  values,
  errors,
  upload,
  resetKey,
  onField,
  onFile,
  onColorValidity,
}: ProductTextureProps) {
  const t = useTranslations('AdminCatalog.products.form.texture');
  const tFields = useTranslations('Admin.fields');
  const headingId = useId();

  const width = positive(values.tileWidthMm);
  const length = positive(values.tileLengthMm);

  const handleFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) onFile(file);
    },
    [onFile],
  );
  const handleWidth = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onField('tileWidthMm', event.target.value),
    [onField],
  );
  const handleLength = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      onField('tileLengthMm', event.target.value),
    [onField],
  );
  const handleColor = useCallback(
    (color: string) => onField('fallbackColor', color),
    [onField],
  );

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <SectionHeader id={headingId} title={t('title')} note={t('hint')} />
      <FileField
        label={t('image')}
        buttonLabel={t('choose')}
        emptyLabel={t('empty')}
        fileName={values.textureImageId ? t('uploaded') : ''}
        accept={IMAGE_ACCEPT}
        error={errors.textureImageId ? t('required') : undefined}
        onChange={handleFile}
      />
      {upload?.state === 'uploading' ? (
        <Progress
          label={t('progress')}
          value={upload.progress}
          valueText={`${Math.round(upload.progress)}%`}
        />
      ) : null}
      {upload?.state === 'error' && upload.errorText ? (
        <p className={styles.uploadError} role="alert">
          {upload.errorText}
        </p>
      ) : null}
      <div className={styles.pair}>
        <NumberField
          label={t('tileWidth')}
          unit={t('mm')}
          min={1}
          step={1}
          value={values.tileWidthMm}
          error={errors.tileWidthMm}
          onChange={handleWidth}
        />
        <NumberField
          label={t('tileLength')}
          unit={t('mm')}
          min={1}
          step={1}
          value={values.tileLengthMm}
          error={errors.tileLengthMm}
          onChange={handleLength}
        />
      </div>
      <ColorField
        label={t('fallback')}
        value={values.fallbackColor}
        onChange={handleColor}
        onValidityChange={onColorValidity}
        resetKey={resetKey}
        pickerLabel={tFields('colorPicker')}
        invalidMessage={tFields('invalidColor')}
        error={errors.fallbackColor}
      />
      {width > 0 && length > 0 ? (
        <div className={styles.preview}>
          <TexturePreview
            src={values.texturePreviewUrl ?? undefined}
            tileWidthMm={width}
            tileLengthMm={length}
            fallbackColor={values.fallbackColor || 'transparent'}
            label={t('preview')}
          />
        </div>
      ) : null}
    </section>
  );
}
