import { useCallback } from 'react';
import { cx } from '@/lib/cx';
import styles from './SegmentedControl.module.css';

export type SegmentedOption = {
  value: string;
  label: string;
};

export type SegmentedControlProps = {
  label: string;
  value: string;
  options: readonly SegmentedOption[];
  onValueChange: (value: string) => void;
  className?: string;
};

type SegmentProps = {
  option: SegmentedOption;
  selected: boolean;
  onValueChange: (value: string) => void;
};

function Segment({ option, selected, onValueChange }: SegmentProps) {
  const select = useCallback(
    () => onValueChange(option.value),
    [onValueChange, option.value],
  );

  return (
    <button
      type="button"
      className={cx(styles.option, selected && styles.selected)}
      aria-pressed={selected}
      onClick={select}
    >
      {option.label}
    </button>
  );
}

export function SegmentedControl({
  label,
  value,
  options,
  onValueChange,
  className,
}: SegmentedControlProps) {
  return (
    <div role="group" aria-label={label} className={cx(styles.root, className)}>
      {options.map((option) => (
        <Segment
          key={option.value}
          option={option}
          selected={option.value === value}
          onValueChange={onValueChange}
        />
      ))}
    </div>
  );
}
