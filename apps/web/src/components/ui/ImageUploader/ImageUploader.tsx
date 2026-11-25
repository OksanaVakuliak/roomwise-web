'use client';

import type { Announcements } from '@dnd-kit/core';
import { type ChangeEvent, useCallback, useState } from 'react';
import { cx } from '@/lib/cx';
import { FileField } from '../FileField/FileField';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { Progress } from '../Progress/Progress';
import { SortableList } from '../SortableList/SortableList';
import styles from './ImageUploader.module.css';

export type ImageUploaderItem = {
  localId: string;
  previewUrl: string;
  progress: number;
  state: 'queued' | 'uploading' | 'done' | 'error';
  primary: boolean;
  imageId?: string;
  errorText?: string;
};

export type ImageUploaderProps = {
  items: ImageUploaderItem[];
  onAdd: (files: File[]) => void;
  onRemove: (localId: string) => void;
  onReorder: (next: ImageUploaderItem[]) => void;
  onPrimary: (localId: string) => void;
  accept: string;
  maxBytes: number;
  label: string;
  addLabel: string;
  emptyLabel: string;
  listLabel: string;
  primaryLabel: string;
  progressLabel: string;
  previewAlt: (item: ImageUploaderItem) => string;
  removeLabel: (item: ImageUploaderItem) => string;
  wrongTypeMessage: (fileName: string) => string;
  tooLargeMessage: (fileName: string) => string;
  dragLabel: (item: ImageUploaderItem) => string;
  moveUpLabel: (item: ImageUploaderItem) => string;
  moveDownLabel: (item: ImageUploaderItem) => string;
  announcements: Announcements;
  screenReaderInstructions: string;
  className?: string;
};

type RowProps = {
  item: ImageUploaderItem;
  primaryLabel: string;
  progressLabel: string;
  previewAlt: string;
  removeLabel: string;
  onRemove: (localId: string) => void;
  onPrimary: (localId: string) => void;
};

function UploaderRow({
  item,
  primaryLabel,
  progressLabel,
  previewAlt,
  removeLabel,
  onRemove,
  onPrimary,
}: RowProps) {
  const remove = useCallback(
    () => onRemove(item.localId),
    [item.localId, onRemove],
  );
  const choosePrimary = useCallback(
    () => onPrimary(item.localId),
    [item.localId, onPrimary],
  );

  return (
    <div className={styles.row}>
      <img className={styles.thumb} src={item.previewUrl} alt={previewAlt} />
      <div className={styles.status}>
        {item.state === 'uploading' ? (
          <Progress
            label={progressLabel}
            value={item.progress}
            valueText={`${Math.round(item.progress)}%`}
          />
        ) : null}
        {item.state === 'error' && item.errorText ? (
          <span className={styles.error}>{item.errorText}</span>
        ) : null}
      </div>
      <button
        type="button"
        className={styles.primary}
        aria-pressed={item.primary}
        disabled={item.state !== 'done'}
        onClick={choosePrimary}
      >
        {item.primary ? <Icon name="check" /> : null}
        {primaryLabel}
      </button>
      <IconButton icon="trash" label={removeLabel} onClick={remove} />
    </div>
  );
}

const getKey = (item: ImageUploaderItem) => item.localId;
const isPending = (item: ImageUploaderItem) => item.state !== 'done';

export function ImageUploader({
  items,
  onAdd,
  onRemove,
  onReorder,
  onPrimary,
  accept,
  maxBytes,
  label,
  addLabel,
  emptyLabel,
  listLabel,
  primaryLabel,
  progressLabel,
  previewAlt,
  removeLabel,
  wrongTypeMessage,
  tooLargeMessage,
  dragLabel,
  moveUpLabel,
  moveDownLabel,
  announcements,
  screenReaderInstructions,
  className,
}: ImageUploaderProps) {
  const [problems, setProblems] = useState<string[]>([]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const chosen = Array.from(event.target.files ?? []);
      event.target.value = '';
      const allowed = accept.split(',').map((type) => type.trim());
      const valid: File[] = [];
      const rejected: string[] = [];
      for (const file of chosen) {
        if (!allowed.includes(file.type)) {
          rejected.push(wrongTypeMessage(file.name));
        } else if (file.size > maxBytes) {
          rejected.push(tooLargeMessage(file.name));
        } else {
          valid.push(file);
        }
      }
      setProblems(rejected);
      if (valid.length > 0) onAdd(valid);
    },
    [accept, maxBytes, onAdd, wrongTypeMessage, tooLargeMessage],
  );

  const renderItem = useCallback(
    (item: ImageUploaderItem) => {
      return (
        <UploaderRow
          item={item}
          primaryLabel={primaryLabel}
          progressLabel={progressLabel}
          previewAlt={previewAlt(item)}
          removeLabel={removeLabel(item)}
          onRemove={onRemove}
          onPrimary={onPrimary}
        />
      );
    },
    [primaryLabel, progressLabel, previewAlt, removeLabel, onRemove, onPrimary],
  );

  return (
    <div className={cx(styles.root, className)}>
      <FileField
        label={label}
        buttonLabel={addLabel}
        emptyLabel={emptyLabel}
        fileName=""
        accept={accept}
        multiple
        onChange={handleChange}
      />
      {problems.length > 0 ? (
        <ul className={styles.problems} role="alert">
          {problems.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
      {items.length > 0 ? (
        <SortableList
          items={items}
          getKey={getKey}
          isDisabled={isPending}
          renderItem={renderItem}
          onReorder={onReorder}
          label={listLabel}
          dragLabel={dragLabel}
          moveUpLabel={moveUpLabel}
          moveDownLabel={moveDownLabel}
          announcements={announcements}
          screenReaderInstructions={screenReaderInstructions}
        />
      ) : null}
    </div>
  );
}
