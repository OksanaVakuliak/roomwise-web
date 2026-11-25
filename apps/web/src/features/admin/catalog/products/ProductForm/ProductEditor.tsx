'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Banner,
  Checkbox,
  ConfirmDialog,
  LocalizedField,
  MoneyField,
  NumberField,
  PageTitle,
  SectionHeader,
  Select,
  StatusBadge,
  TextField,
} from '@/components/ui';
import {
  ConflictBanner,
  SaveBar,
  useAdminForm,
  useLeaveGuard,
  useSaveToast,
} from '@/features/admin/forms';
import { isEqual } from '@/features/admin/forms/is-equal';
import { useAdminSession } from '@/features/admin/session';
import { useRouter } from '@/i18n/navigation';
import { useCategories, useMaterialTypes } from '@/lib/admin-api/catalog';
import {
  type AdminError,
  adminErrorMessage,
  toAdminError,
} from '@/lib/admin-api/errors';
import { useUpdateImage } from '@/lib/admin-api/images';
import {
  type AdminProduct,
  fetchProduct,
  type ProductStatus,
  type ProductWarning,
  useChangeProductStatus,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from '@/lib/admin-api/products';
import { ProductAttributes } from './ProductAttributes';
import styles from './ProductForm.module.css';
import { ProductImages } from './ProductImages';
import { ProductTexture } from './ProductTexture';
import {
  type AttributeValue,
  affectsCost,
  assertValid,
  emptyValues,
  type LocalizedValue,
  normalizePrimary,
  type ProductUnit,
  type ProductValues,
  toBody,
  toPatchBody,
  toValues,
  UNITS,
} from './product-values';
import { type UploadDone, useUploads } from './use-uploads';

const LIST_HREF = '/admin/catalog/products';

type Action = 'save' | ProductStatus;

const wholeMm = (raw: string): number | undefined => {
  const value = Number(raw.replace(',', '.'));
  return Number.isInteger(value) && value > 0 ? value : undefined;
};

function readStyles(error: AdminError, locale: 'en' | 'uk'): string[] {
  const list = error.kind === 'inUse' ? error.params.styles : undefined;
  if (!Array.isArray(list)) return [];
  return list.flatMap((style: { name?: Record<string, string> }) =>
    style?.name?.[locale] ? [style.name[locale]] : [],
  );
}

const styleNames = (warning: ProductWarning, locale: 'en' | 'uk') =>
  warning.params.styles.map((style) => style.name[locale]).join(', ');

type WarningBannerProps = {
  warning: ProductWarning & { key: string };
  text: string;
  dismissLabel: string;
  onDismiss: (key: string) => void;
};

function WarningBanner({
  warning,
  text,
  dismissLabel,
  onDismiss,
}: WarningBannerProps) {
  const dismiss = useCallback(
    () => onDismiss(warning.key),
    [warning.key, onDismiss],
  );
  return (
    <Banner variant="warning" onDismiss={dismiss} dismissLabel={dismissLabel}>
      {text}
    </Banner>
  );
}

type Applied = {
  source: ProductValues;
  revision: string | null;
  values: ProductValues;
};

export type ProductEditorProps = { product?: AdminProduct };

export function ProductEditor({ product }: ProductEditorProps) {
  const t = useTranslations('AdminCatalog.products.form');
  const tFields = useTranslations('Admin.fields');
  const tStatus = useTranslations('Admin.status');
  const tRoot = useTranslations();
  const locale = useLocale() as 'en' | 'uk';
  const format = useFormatter();
  const router = useRouter();
  const detailsId = useId();
  const pricingId = useId();
  const imagesId = useId();
  const notify = useSaveToast();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const changeStatus = useChangeProductStatus();
  const remove = useDeleteProduct();
  const updateTexture = useUpdateImage();
  const { withReauth } = useAdminSession();
  const applied = useRef<Applied | null>(null);
  const textureSizes = useRef(new Map<string, number | null>());
  const categories = useCategories();
  const materialTypes = useMaterialTypes();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [inUse, setInUse] = useState<string[] | null>(null);
  const [deleteError, setDeleteError] = useState<AdminError | null>(null);
  const [zeroAction, setZeroAction] = useState<Action | null>(null);
  const [warnings, setWarnings] = useState<
    (ProductWarning & { key: string })[]
  >([]);
  const [blocked, setBlocked] = useState(false);
  const [priceValid, setPriceValid] = useState(true);
  const [colorValid, setColorValid] = useState(true);

  const id = product?.id;

  const fetchLatest = useCallback(async () => {
    applied.current = null;
    if (!id) throw new Error('missing');
    const latest = await fetchProduct(id);
    return {
      values: toValues(latest),
      revision: latest.revision,
      changedBy: latest.updatedBy?.login ?? null,
      changedAt: latest.updatedAt,
    };
  }, [id]);

  const form = useAdminForm<ProductValues>({
    initial: product ? toValues(product) : emptyValues,
    revision: product?.revision ?? null,
    fetchLatest,
  });
  const { dialog } = useLeaveGuard(form.dirty, { fallbackHref: LIST_HREF });
  const { values, initial, dirty, setField, setValues, submit } = form;
  const { mutateAsync: createAsync } = create;
  const { mutateAsync: updateAsync } = update;
  const { mutateAsync: statusAsync } = changeStatus;
  const { mutateAsync: removeAsync } = remove;
  const { mutateAsync: updateTextureAsync } = updateTexture;

  const describe = useCallback(
    (failure: unknown) => {
      const message = adminErrorMessage(toAdminError(failure));
      return tRoot(
        `${message.namespace}.${message.key}` as never,
        message.values as never,
      );
    },
    [tRoot],
  );

  const addImage = useCallback(
    ({ localId, previewUrl, image }: UploadDone) =>
      setValues((current) => ({
        ...current,
        images: normalizePrimary([
          ...current.images,
          { localId, imageId: image.id, previewUrl, primary: false },
        ]),
      })),
    [setValues],
  );
  const setTexture = useCallback(
    ({ image }: UploadDone) => {
      textureSizes.current.set(image.id, image.realSizeMm);
      setValues((current) => ({
        ...current,
        textureImageId: image.id,
        texturePreviewUrl: image.texture,
      }));
    },
    [setValues],
  );
  const imageUploads = useUploads({
    keepPreview: true,
    describe,
    onDone: addImage,
  });
  const textureUploads = useUploads({
    single: true,
    describe,
    onDone: setTexture,
  });
  const unfinished = imageUploads.busy || textureUploads.busy;

  const surface = categories.data?.find(
    (category) => category.id === values.categoryId,
  )?.surface;
  const hasSurface = surface !== undefined && surface !== 'NONE';
  const bodySurface = surface === undefined ? null : hasSurface;
  const clearTexture = textureUploads.clear;
  const pruneImages = imageUploads.prune;

  useEffect(() => {
    if (!hasSurface) clearTexture();
  }, [hasSurface, clearTexture]);

  const previews = useMemo(
    () => values.images.map((image) => image.previewUrl),
    [values.images],
  );
  useEffect(() => pruneImages(previews), [previews, pruneImages]);

  const persist = useCallback(
    async (
      current: ProductValues,
      revision: string | null,
      confirmedZero: boolean,
    ) => {
      if (applied.current && isEqual(applied.current.source, current)) {
        return applied.current;
      }
      assertValid(current, {
        hasSurface,
        publish: false,
        priceValid,
        colorValid,
      });
      const imageId = current.textureImageId;
      const width = wholeMm(current.tileWidthMm);
      if (hasSurface && imageId && width !== undefined) {
        const known = textureSizes.current.has(imageId)
          ? textureSizes.current.get(imageId)
          : product?.texture?.id === imageId
            ? product.texture.realSizeMm
            : undefined;
        if (known !== undefined && known !== width) {
          await withReauth(() =>
            updateTextureAsync({ id: imageId, body: { realSizeMm: width } }),
          );
          textureSizes.current.set(imageId, width);
        }
      }
      const saved = id
        ? await withReauth(() =>
            updateAsync({
              id,
              body: toPatchBody(
                current,
                bodySurface,
                confirmedZero,
                applied.current?.revision ?? revision ?? '',
              ),
            }),
          )
        : await withReauth(() =>
            createAsync(toBody(current, bodySurface, confirmedZero)),
          );
      const result = {
        source: current,
        revision: saved.revision,
        values: toValues(saved),
      };
      applied.current = result;
      return result;
    },
    [
      id,
      product,
      hasSurface,
      bodySurface,
      priceValid,
      colorValid,
      withReauth,
      createAsync,
      updateAsync,
      updateTextureAsync,
    ],
  );

  const execute = useCallback(
    async (action: Action, confirmedZero: boolean) => {
      if (unfinished) {
        setBlocked(true);
        return;
      }
      setBlocked(false);
      const persisting = action === 'save' || dirty || applied.current !== null;
      if (persisting && values.priceCents === 0 && !confirmedZero) {
        setZeroAction(action);
        return;
      }
      const cost = affectsCost(values, initial);
      if (action === 'save') {
        const ok = await submit((current, revision) =>
          persist(current, revision, confirmedZero),
        );
        if (!ok) return;
        applied.current = null;
        notify({ affectsCost: cost });
        if (!id) router.push(LIST_HREF);
        return;
      }
      if (!id) return;
      const ok = await submit(async (current, revision) => {
        if (dirty || action === 'PUBLISHED') {
          assertValid(current, {
            hasSurface,
            publish: action === 'PUBLISHED',
            priceValid,
            colorValid,
          });
        }
        let next = { revision, values: current };
        if (dirty || applied.current) {
          next = await persist(current, revision, confirmedZero);
        }
        const changed = await withReauth(() =>
          statusAsync({
            id,
            body: { status: action, revision: next.revision ?? '' },
          }),
        );
        setWarnings(
          (changed.warnings ?? []).map((warning) => ({
            ...warning,
            key: crypto.randomUUID(),
          })),
        );
        return { revision: changed.revision, values: toValues(changed) };
      });
      if (!ok) return;
      applied.current = null;
      notify({ affectsCost: cost });
    },
    [
      unfinished,
      dirty,
      values,
      initial,
      submit,
      persist,
      statusAsync,
      withReauth,
      notify,
      id,
      router,
      hasSurface,
      priceValid,
      colorValid,
    ],
  );

  const onSave = useCallback(() => void execute('save', false), [execute]);
  const status = product?.status;
  const onTogglePublication = useCallback(
    () => void execute(status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED', false),
    [execute, status],
  );
  const onArchive = useCallback(
    () => void execute('ARCHIVED', false),
    [execute],
  );
  const confirmZero = useCallback(() => {
    const action = zeroAction;
    setZeroAction(null);
    if (action) void execute(action, true);
  }, [zeroAction, execute]);
  const cancelZero = useCallback(() => setZeroAction(null), []);
  const openDelete = useCallback(() => setConfirmingDelete(true), []);
  const closeDelete = useCallback(() => setConfirmingDelete(false), []);
  const closeInUse = useCallback(() => setInUse(null), []);
  const dismissWarning = useCallback(
    (key: string) =>
      setWarnings((current) => current.filter((item) => item.key !== key)),
    [],
  );

  const onDelete = useCallback(async () => {
    if (!id) return;
    setConfirmingDelete(false);
    setDeleteError(null);
    try {
      await withReauth(() => removeAsync(id));
    } catch (failure) {
      const error = toAdminError(failure);
      if (error.kind === 'inUse') setInUse(readStyles(error, locale));
      else setDeleteError(error);
      return;
    }
    notify();
    router.push(LIST_HREF);
  }, [id, removeAsync, withReauth, locale, notify, router]);

  const archiveInstead = useCallback(() => {
    setInUse(null);
    void execute('ARCHIVED', false);
  }, [execute]);

  const addFiles = imageUploads.add;
  const removeUpload = imageUploads.remove;
  const releaseUrl = imageUploads.release;
  const removeImage = useCallback(
    (localId: string) => {
      const image = values.images.find((item) => item.localId === localId);
      if (!image) {
        removeUpload(localId);
        return;
      }
      releaseUrl(image.previewUrl);
      setField(
        'images',
        normalizePrimary(
          values.images.filter((item) => item.localId !== localId),
        ),
      );
    },
    [values.images, removeUpload, releaseUrl, setField],
  );
  const reorderImages = useCallback(
    (next: ProductValues['images']) => setField('images', next),
    [setField],
  );
  const choosePrimary = useCallback(
    (localId: string) => {
      if (!values.images.some((item) => item.localId === localId)) return;
      setField(
        'images',
        values.images.map((item) => ({
          ...item,
          primary: item.localId === localId,
        })),
      );
    },
    [values.images, setField],
  );

  const addTexture = textureUploads.add;
  const uploadTexture = useCallback(
    (file: File) =>
      addTexture([file], { realSizeMm: wholeMm(values.tileWidthMm) }),
    [addTexture, values.tileWidthMm],
  );

  const removeTextureUpload = textureUploads.remove;

  const onName = useCallback(
    (name: LocalizedValue) => setField('name', name),
    [setField],
  );
  const onDescription = useCallback(
    (description: LocalizedValue) => setField('description', description),
    [setField],
  );
  const onColor = useCallback(
    (color: LocalizedValue) => setField('color', color),
    [setField],
  );
  const onSize = useCallback(
    (size: LocalizedValue) => setField('size', size),
    [setField],
  );
  const onBrand = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('brand', event.target.value),
    [setField],
  );
  const onManufacturer = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('manufacturer', event.target.value),
    [setField],
  );
  const onCategory = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setField('categoryId', event.target.value),
    [setField],
  );
  const onMaterialType = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setField('materialTypeId', event.target.value),
    [setField],
  );
  const onUnit = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      setField('unit', event.target.value as ProductUnit),
    [setField],
  );
  const onPrice = useCallback(
    (cents: number | null) => setField('priceCents', cents),
    [setField],
  );
  const onWaste = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('wastePercentOverride', event.target.value),
    [setField],
  );
  const onHeated = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      setField('heatedFloorCompatible', event.target.checked),
    [setField],
  );
  const onAttributes = useCallback(
    (attributes: AttributeValue[]) => setField('attributes', attributes),
    [setField],
  );

  const failure =
    form.error && form.error.kind !== 'stale' ? form.error : deleteError;
  const message = failure ? adminErrorMessage(failure) : null;
  const time = product
    ? format.dateTime(new Date(product.updatedAt), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;
  const languageLabels = {
    en: tFields('languages.en'),
    uk: tFields('languages.uk'),
  };
  const localizedProps = {
    languageLabels,
    requiredForPublishLabel: tFields('requiredForPublish'),
    requiredForPublish: true,
  };
  const errorsFor = (path: string) => ({
    en: form.errors[`${path}.en`],
    uk: form.errors[`${path}.uk`],
  });

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <PageTitle>
          {product
            ? t('editTitle', { name: product.name[locale] })
            : t('newTitle')}
        </PageTitle>
        {product ? (
          <StatusBadge
            status={product.status}
            label={tStatus(product.status)}
          />
        ) : null}
      </div>
      {product && time ? (
        <p className={styles.meta}>
          {product.updatedBy
            ? t('lastChanged', { time, user: product.updatedBy.login })
            : t('lastChangedAnon', { time })}
        </p>
      ) : null}
      {form.conflict ? (
        <ConflictBanner
          changedBy={form.conflict.changedBy}
          changedAt={form.conflict.changedAt}
          revealed={form.conflictRevealed}
          differingCount={form.differing.length}
          onReveal={form.revealConflict}
          onAccept={form.acceptLatest}
          onDismiss={form.dismissConflict}
        />
      ) : null}
      {message ? (
        <Banner variant="error">
          {tRoot(
            `${message.namespace}.${message.key}` as never,
            message.values as never,
          )}
        </Banner>
      ) : null}
      {blocked && unfinished ? (
        <Banner variant="warning">{t('images.unfinished')}</Banner>
      ) : null}
      {warnings.map((warning) => (
        <WarningBanner
          key={warning.key}
          warning={warning}
          text={t(`warnings.${warning.code}`, {
            list: styleNames(warning, locale),
          })}
          dismissLabel={t('warnings.dismiss')}
          onDismiss={dismissWarning}
        />
      ))}
      <div className={styles.form}>
        <section className={styles.section} aria-labelledby={detailsId}>
          <SectionHeader id={detailsId} title={t('sections.details')} />
          <LocalizedField
            key={`name-${form.resetKey}`}
            label={t('name')}
            value={values.name}
            onChange={onName}
            errors={errorsFor('name')}
            {...localizedProps}
          />
          <LocalizedField
            key={`description-${form.resetKey}`}
            label={t('description')}
            value={values.description}
            onChange={onDescription}
            errors={errorsFor('description')}
            multiline
            {...localizedProps}
          />
          <TextField
            label={t('brand')}
            value={values.brand}
            error={form.errors.brand}
            onChange={onBrand}
          />
          <TextField
            label={t('manufacturer')}
            value={values.manufacturer}
            error={form.errors.manufacturer}
            onChange={onManufacturer}
          />
          <Select
            label={t('category')}
            placeholder={t('categoryPlaceholder')}
            value={values.categoryId}
            error={form.errors.categoryId}
            loading={categories.isPending}
            loadingLabel={t('loadingOptions')}
            onChange={onCategory}
          >
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name[locale]}
              </option>
            ))}
          </Select>
          <Select
            label={t('materialType')}
            placeholder={t('materialTypePlaceholder')}
            value={values.materialTypeId}
            error={form.errors.materialTypeId}
            loading={materialTypes.isPending}
            loadingLabel={t('loadingOptions')}
            onChange={onMaterialType}
          >
            {(materialTypes.data ?? []).map((materialType) => (
              <option key={materialType.id} value={materialType.id}>
                {materialType.name[locale]}
              </option>
            ))}
          </Select>
          <LocalizedField
            key={`color-${form.resetKey}`}
            label={t('color')}
            value={values.color}
            onChange={onColor}
            errors={errorsFor('color')}
            {...localizedProps}
          />
          <LocalizedField
            key={`size-${form.resetKey}`}
            label={t('size')}
            value={values.size}
            onChange={onSize}
            errors={errorsFor('size')}
            {...localizedProps}
          />
        </section>
        <section className={styles.section} aria-labelledby={pricingId}>
          <SectionHeader id={pricingId} title={t('sections.pricing')} />
          <MoneyField
            label={t('price')}
            valueCents={values.priceCents}
            onChange={onPrice}
            onValidityChange={setPriceValid}
            resetKey={form.resetKey}
            negativeMessage={tFields('negativePrice')}
            invalidMessage={tFields('invalidPrice')}
            error={priceValid ? form.errors.priceCents : undefined}
          />
          <Select label={t('unit')} value={values.unit} onChange={onUnit}>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {t(`units.${unit}`)}
              </option>
            ))}
          </Select>
          <NumberField
            label={t('waste')}
            unit={t('wasteUnit')}
            hint={t('wasteHint')}
            error={form.errors.wastePercentOverride}
            min={0}
            max={100}
            step="any"
            value={values.wastePercentOverride}
            onChange={onWaste}
          />
          <Checkbox
            label={t('heatedFloor')}
            checked={values.heatedFloorCompatible}
            onChange={onHeated}
          />
        </section>
        <section className={styles.section} aria-labelledby={imagesId}>
          <SectionHeader id={imagesId} title={t('sections.images')} />
          <ProductImages
            images={values.images}
            uploads={imageUploads.entries}
            onAdd={addFiles}
            onRemove={removeImage}
            onReorder={reorderImages}
            onPrimary={choosePrimary}
          />
        </section>
        <ProductAttributes
          attributes={values.attributes}
          errors={form.errors}
          onChange={onAttributes}
        />
        {hasSurface ? (
          <ProductTexture
            values={values}
            errors={form.errors}
            upload={textureUploads.entries[0]}
            onDismissUpload={removeTextureUpload}
            resetKey={form.resetKey}
            onField={setField}
            onFile={uploadTexture}
            onColorValidity={setColorValid}
          />
        ) : null}
      </div>
      <SaveBar
        dirty={dirty}
        saving={form.saving}
        onSave={onSave}
        publication={
          product
            ? {
                published: product.status === 'PUBLISHED',
                onToggle: onTogglePublication,
              }
            : undefined
        }
        onArchive={
          product && product.status !== 'ARCHIVED' ? onArchive : undefined
        }
        onDelete={product ? openDelete : undefined}
      />
      <ConfirmDialog
        open={zeroAction !== null}
        title={t('zeroPrice.title')}
        description={t('zeroPrice.description')}
        confirmLabel={t('zeroPrice.confirm')}
        cancelLabel={t('zeroPrice.cancel')}
        closeLabel={t('zeroPrice.close')}
        onConfirm={confirmZero}
        onCancel={cancelZero}
      />
      <ConfirmDialog
        open={confirmingDelete}
        title={t('delete.title')}
        description={t('delete.description')}
        confirmLabel={t('delete.confirm')}
        cancelLabel={t('delete.cancel')}
        closeLabel={t('delete.close')}
        tone="danger"
        onConfirm={onDelete}
        onCancel={closeDelete}
      />
      <ConfirmDialog
        open={inUse !== null}
        title={t('inUse.title')}
        description={
          inUse ? (
            <>
              <p>{t('inUse.intro')}</p>
              {inUse.length > 0 ? (
                <ul className={styles.dependencies}>
                  <li>{t('inUse.styles', { list: inUse.join(', ') })}</li>
                </ul>
              ) : null}
            </>
          ) : null
        }
        confirmLabel={t('inUse.archive')}
        cancelLabel={t('inUse.cancel')}
        closeLabel={t('inUse.close')}
        onConfirm={archiveInstead}
        onCancel={closeInUse}
      />
      {dialog}
    </div>
  );
}
