import { useCallback } from 'react';
import { RoomPlan } from '@/components/ui';
import styles from './RoomPlans.module.css';

export type RoomPlansItem = {
  clientId: string;
  name: string;
  details: string;
  lengthCm: number;
  widthCm: number;
};

export type RoomPlansProps = {
  label: string;
  items: readonly RoomPlansItem[];
  value: string;
  size: 'mobile' | 'desktop';
  onValueChange: (clientId: string) => void;
};

type RoomPlansEntryProps = {
  item: RoomPlansItem;
  current: boolean;
  size: RoomPlansProps['size'];
  onValueChange: (clientId: string) => void;
};

function RoomPlansEntry({
  item,
  current,
  size,
  onValueChange,
}: RoomPlansEntryProps) {
  const { clientId } = item;
  const select = useCallback(
    () => onValueChange(clientId),
    [clientId, onValueChange],
  );

  return (
    <RoomPlan
      name={item.name}
      details={item.details}
      lengthCm={item.lengthCm}
      widthCm={item.widthCm}
      size={size}
      state={current ? 'current' : 'default'}
      onClick={select}
    />
  );
}

export function RoomPlans({
  label,
  items,
  value,
  size,
  onValueChange,
}: RoomPlansProps) {
  return (
    <div className={styles.root} role="group" aria-label={label}>
      {items.map((item) => (
        <RoomPlansEntry
          key={item.clientId}
          item={item}
          current={item.clientId === value}
          size={size}
          onValueChange={onValueChange}
        />
      ))}
    </div>
  );
}
