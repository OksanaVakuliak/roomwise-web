import { cx } from '@/lib/cx';
import { Modal, type ModalProps } from '../Modal/Modal';
import styles from './BottomSheet.module.css';

export type BottomSheetProps = Omit<ModalProps, 'placement' | 'className'> & {
  full?: boolean;
};

export function BottomSheet({ full = false, ...rest }: BottomSheetProps) {
  return (
    <Modal
      {...rest}
      placement="bottom"
      className={cx(styles.root, full && styles.full)}
    />
  );
}
