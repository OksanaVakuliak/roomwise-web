import { Modal, type ModalProps } from '../Modal/Modal';
import styles from './SidePanel.module.css';

export type SidePanelProps = Omit<ModalProps, 'placement' | 'className'>;

export function SidePanel(props: SidePanelProps) {
  return <Modal {...props} placement="side" className={styles.root} />;
}
