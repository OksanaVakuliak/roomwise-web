'use client';

import type { Announcements } from '@dnd-kit/core';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { ImageUploader, type ImageUploaderItem } from '@/components/ui';
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '@/lib/admin-api/upload';
import type { ImageValue } from './product-values';
import type { UploadEntry } from './use-uploads';

const MEGABYTE = 1024 * 1024;

export type ProductImagesProps = {
  images: ImageValue[];
  uploads: UploadEntry[];
  onAdd: (files: File[]) => void;
  onRemove: (localId: string) => void;
  onReorder: (next: ImageValue[]) => void;
  onPrimary: (localId: string) => void;
};

export function ProductImages({
  images,
  uploads,
  onAdd,
  onRemove,
  onReorder,
  onPrimary,
}: ProductImagesProps) {
  const t = useTranslations('AdminCatalog.products.form.images');

  const items = useMemo<ImageUploaderItem[]>(
    () => [
      ...images.map((image) => ({
        localId: image.localId,
        previewUrl: image.previewUrl,
        progress: 100,
        state: 'done' as const,
        primary: image.primary,
        imageId: image.imageId,
      })),
      ...uploads.map((upload) => ({
        localId: upload.localId,
        previewUrl: upload.previewUrl,
        progress: upload.progress,
        state: upload.state,
        primary: false,
        errorText: upload.errorText,
      })),
    ],
    [images, uploads],
  );

  const position = useCallback(
    (localId: string | number) =>
      items.findIndex((item) => item.localId === localId) + 1,
    [items],
  );
  const positionOf = useCallback(
    (item: ImageUploaderItem) => position(item.localId),
    [position],
  );

  const handleReorder = useCallback(
    (next: ImageUploaderItem[]) => {
      const byId = new Map(images.map((image) => [image.localId, image]));
      onReorder(
        next.flatMap((item) => {
          const image = byId.get(item.localId);
          return image ? [image] : [];
        }),
      );
    },
    [images, onReorder],
  );

  const previewAlt = useCallback(
    (item: ImageUploaderItem) => t('previewAlt', { n: positionOf(item) }),
    [t, positionOf],
  );
  const removeLabel = useCallback(
    (item: ImageUploaderItem) => t('remove', { n: positionOf(item) }),
    [t, positionOf],
  );
  const dragLabel = useCallback(
    (item: ImageUploaderItem) => t('drag', { n: positionOf(item) }),
    [t, positionOf],
  );
  const moveUpLabel = useCallback(
    (item: ImageUploaderItem) => t('moveUp', { n: positionOf(item) }),
    [t, positionOf],
  );
  const moveDownLabel = useCallback(
    (item: ImageUploaderItem) => t('moveDown', { n: positionOf(item) }),
    [t, positionOf],
  );
  const wrongType = useCallback(
    (name: string) => t('wrongType', { name }),
    [t],
  );
  const tooLarge = useCallback(
    (name: string) =>
      t('tooLarge', { name, max: Math.round(IMAGE_MAX_BYTES / MEGABYTE) }),
    [t],
  );

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) =>
        t('announce.start', { n: position(active.id) }),
      onDragOver: ({ over }) =>
        over ? t('announce.over', { n: position(over.id) }) : undefined,
      onDragEnd: ({ over }) =>
        over ? t('announce.end', { n: position(over.id) }) : undefined,
      onDragCancel: ({ active }) =>
        t('announce.cancel', { n: position(active.id) }),
    }),
    [t, position],
  );

  return (
    <ImageUploader
      items={items}
      onAdd={onAdd}
      onRemove={onRemove}
      onReorder={handleReorder}
      onPrimary={onPrimary}
      accept={IMAGE_ACCEPT}
      maxBytes={IMAGE_MAX_BYTES}
      label={t('label')}
      addLabel={t('add')}
      emptyLabel={t('empty')}
      listLabel={t('list')}
      primaryLabel={t('primary')}
      progressLabel={t('progress')}
      previewAlt={previewAlt}
      removeLabel={removeLabel}
      wrongTypeMessage={wrongType}
      tooLargeMessage={tooLarge}
      dragLabel={dragLabel}
      moveUpLabel={moveUpLabel}
      moveDownLabel={moveDownLabel}
      announcements={announcements}
      screenReaderInstructions={t('instructions')}
    />
  );
}
