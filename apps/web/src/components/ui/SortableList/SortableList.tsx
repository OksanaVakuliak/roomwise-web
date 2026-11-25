'use client';

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CSSProperties, type ReactNode, useCallback } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './SortableList.module.css';

export type SortableListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, context: { index: number }) => ReactNode;
  onReorder: (next: T[]) => void;
  label: string;
  dragLabel: (item: T) => string;
  moveUpLabel: (item: T) => string;
  moveDownLabel: (item: T) => string;
  announcements: Announcements;
  screenReaderInstructions: string;
  isDisabled?: (item: T) => boolean;
  className?: string;
};

type RowProps = {
  id: string;
  index: number;
  last: boolean;
  disabled: boolean;
  content: ReactNode;
  dragLabel: string;
  moveUpLabel: string;
  moveDownLabel: string;
  onMove: (from: number, to: number) => void;
};

function SortableRow({
  id,
  index,
  last,
  disabled,
  content,
  dragLabel,
  moveUpLabel,
  moveDownLabel,
  onMove,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const moveUp = useCallback(() => onMove(index, index - 1), [index, onMove]);
  const moveDown = useCallback(() => onMove(index, index + 1), [index, onMove]);

  const vars: Record<string, string> = {};
  const moved = CSS.Transform.toString(transform);
  if (moved) vars['--sortable-transform'] = moved;
  if (transition) vars['--sortable-transition'] = transition;

  return (
    <li
      ref={setNodeRef}
      className={cx(styles.item, isDragging && styles.dragging)}
      style={vars as CSSProperties}
    >
      <button
        {...attributes}
        {...listeners}
        ref={setActivatorNodeRef}
        type="button"
        className={styles.handle}
        aria-label={dragLabel}
        disabled={disabled}
      >
        <Icon name="grip" size="lg" />
      </button>
      <div className={styles.content}>{content}</div>
      <div className={styles.moves}>
        <IconButton
          icon="chevronUp"
          label={moveUpLabel}
          disabled={disabled || index === 0}
          onClick={moveUp}
        />
        <IconButton
          icon="chevronDown"
          label={moveDownLabel}
          disabled={disabled || last}
          onClick={moveDown}
        />
      </div>
    </li>
  );
}

export function SortableList<T>({
  items,
  getKey,
  renderItem,
  onReorder,
  label,
  dragLabel,
  moveUpLabel,
  moveDownLabel,
  announcements,
  screenReaderInstructions,
  isDisabled,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = items.map(getKey);

  const move = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= items.length) return;
      onReorder(arrayMove(items, from, to));
    },
    [items, onReorder],
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    },
    [ids, move],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: screenReaderInstructions },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className={cx(styles.root, className)} aria-label={label}>
          {items.map((item, index) => (
            <SortableRow
              key={ids[index]}
              id={ids[index]}
              index={index}
              last={index === items.length - 1}
              disabled={isDisabled?.(item) ?? false}
              content={renderItem(item, { index })}
              dragLabel={dragLabel(item)}
              moveUpLabel={moveUpLabel(item)}
              moveDownLabel={moveDownLabel(item)}
              onMove={move}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
