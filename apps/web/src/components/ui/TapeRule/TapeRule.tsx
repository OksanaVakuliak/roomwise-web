import { type ReactNode, useId } from 'react';
import { cx } from '@/lib/cx';
import styles from './TapeRule.module.css';

export type TapeRuleSize = 'mobile' | 'desktop';

export type TapeRuleProps = {
  size?: TapeRuleSize;
  label?: string;
  children?: ReactNode;
  className?: string;
};

const TICK_HEIGHT: Record<TapeRuleSize, number> = {
  mobile: 58,
  desktop: 64,
};

export function TapeRule({
  size = 'mobile',
  label,
  children,
  className,
}: TapeRuleProps) {
  const patternId = useId();
  const classes = cx(styles.root, styles[size], className);
  const Root = label ? 'nav' : 'div';

  return (
    <Root className={classes} aria-label={label}>
      <svg className={styles.ticks} aria-hidden="true" focusable="false">
        <defs>
          <pattern
            id={patternId}
            width="40"
            height={TICK_HEIGHT[size]}
            patternUnits="userSpaceOnUse"
          >
            {[8, 16, 24, 32].map((x) => (
              <rect
                key={x}
                x={x}
                width="1"
                height="11"
                fill="var(--tape-ink)"
                opacity=".35"
              />
            ))}
            <rect
              width="1.5"
              height="22"
              fill="var(--tape-ink)"
              opacity=".55"
            />
          </pattern>
        </defs>
        <rect
          className={styles.fill}
          width="200%"
          height="200%"
          fill={`url(#${patternId})`}
        />
      </svg>
      {children ? <ol className={styles.steps}>{children}</ol> : null}
    </Root>
  );
}
