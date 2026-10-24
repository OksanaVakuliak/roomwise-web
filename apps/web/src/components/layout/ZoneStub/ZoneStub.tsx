import { useTranslations } from 'next-intl';
import { cx } from '@/lib/cx';
import styles from './ZoneStub.module.css';

export type ZoneStubKind = 'scene' | 'showcase' | 'content';

export type ZoneStubProps = {
  kind: ZoneStubKind;
  className?: string;
};

export function ZoneStub({ kind, className }: ZoneStubProps) {
  const t = useTranslations('ZoneStub');

  return (
    <div className={cx(styles.root, styles[kind], className)}>
      <span className={styles.label}>{t(kind)}</span>
    </div>
  );
}
