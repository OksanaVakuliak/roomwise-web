import type { ReactNode, Ref } from 'react';
import styles from './SlotPlaceholder.module.css';

export type SlotPlaceholderProps = {
  slotRef: Ref<HTMLDivElement>;
  placeholder: ReactNode;
};

export function SlotPlaceholder({
  slotRef,
  placeholder,
}: SlotPlaceholderProps) {
  return (
    <>
      <div ref={slotRef} className={styles.slot} />
      <div className={styles.placeholder}>{placeholder}</div>
    </>
  );
}
