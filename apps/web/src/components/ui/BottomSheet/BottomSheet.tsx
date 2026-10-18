import { Modal, type ModalProps } from '../Modal/Modal';
import styles from './BottomSheet.module.css';

export type BottomSheetProps = Omit<ModalProps, 'placement' | 'className'>;

export function BottomSheet(props: BottomSheetProps) {
  return <Modal {...props} placement="bottom" className={styles.root} />;
}
