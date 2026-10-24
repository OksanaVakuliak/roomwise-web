import { cx } from '@/lib/cx';
import { Icon } from '../Icon/Icon';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './TapeStep.module.css';

export type TapeStepState = 'done' | 'now' | 'later';

export type TapeStepProps = {
  number: string;
  state: TapeStepState;
  stateLabel: string;
  label?: string;
  size?: 'mobile' | 'desktop' | 'responsive';
  href?: string;
  onClick?: () => void;
};

export function TapeStep({
  number,
  state,
  stateLabel,
  label,
  size = 'mobile',
  href,
  onClick,
}: TapeStepProps) {
  const itemClasses = cx(styles.item, styles[state], styles[size]);
  const ariaCurrent = state === 'now' ? 'step' : undefined;
  const content = (
    <>
      <b className={styles.number}>{number}</b>{' '}
      {label ? (
        <span className={cx(state !== 'now' && styles.label)}>{label}</span>
      ) : null}{' '}
      <VisuallyHidden>{stateLabel}</VisuallyHidden>
    </>
  );

  let control = (
    <span className={styles.control} aria-current={ariaCurrent}>
      {content}
    </span>
  );
  if (state !== 'later' && href) {
    control = (
      <a
        className={`${styles.control} ${styles.interactive}`}
        href={href}
        aria-current={ariaCurrent}
      >
        {content}
      </a>
    );
  } else if (state !== 'later' && onClick) {
    control = (
      <button
        type="button"
        className={`${styles.control} ${styles.interactive}`}
        onClick={onClick}
        aria-current={ariaCurrent}
      >
        {content}
      </button>
    );
  }

  return (
    <li className={itemClasses}>
      {control}
      {state === 'now' ? (
        <Icon name="stepPointer" className={styles.pointer} />
      ) : null}
    </li>
  );
}
