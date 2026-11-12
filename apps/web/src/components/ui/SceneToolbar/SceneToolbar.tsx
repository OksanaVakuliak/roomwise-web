import type { IconName } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import styles from './SceneToolbar.module.css';

export type SceneToolbarAction = {
  id: string;
  label: string;
  icon: IconName;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
};

export type SceneToolbarProps = {
  actions: SceneToolbarAction[];
};

export function SceneToolbar({ actions }: SceneToolbarProps) {
  return (
    <div className={styles.root}>
      {actions.map(({ id, label, icon, onClick, pressed, disabled }) => (
        <IconButton
          key={id}
          label={label}
          icon={icon}
          onClick={onClick}
          disabled={disabled}
          aria-pressed={pressed}
        />
      ))}
    </div>
  );
}
