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
        <RoomPlan
          key={item.clientId}
          name={item.name}
          details={item.details}
          lengthCm={item.lengthCm}
          widthCm={item.widthCm}
          size={size}
          state={item.clientId === value ? 'current' : 'default'}
          onClick={() => onValueChange(item.clientId)}
        />
      ))}
    </div>
  );
}
