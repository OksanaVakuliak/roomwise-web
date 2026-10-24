import { useLocale, useTranslations } from 'next-intl';
import {
  Button,
  CutLayer,
  CutLayers,
  Hatch,
  type HatchMaterial,
  Remark,
  RevisionMark,
} from '@/components/ui';
import { money } from '@/lib/format';
import { SizeFrame } from '../DesktopFrame';
import styles from './SectionCutSection.module.css';

const materials: HatchMaterial[] = [
  'wood',
  'glue',
  'cable',
  'screed',
  'concrete',
];
const sizes = ['mobile', 'desktop'] as const;

const frameClass = (size: (typeof sizes)[number]) =>
  size === 'desktop' ? `${styles.frame} ${styles.desktop}` : styles.frame;

export function SectionCutSection() {
  const t = useTranslations('ShowcaseSectionCut');
  const locale = useLocale();
  const usd = (cents: number) => money(cents, 'USD', locale);
  const revision = { number: 1, label: t('revisionLabel', { number: 1 }) };

  return (
    <div className={styles.stack}>
      <h3 className={styles.heading}>{t('hatches')}</h3>
      <ul className={styles.row}>
        {materials.map((material) => (
          <li key={material} className={styles.cell}>
            <span className={styles.hatch}>
              <Hatch material={material} />
            </span>
            <span className={styles.caption}>{t(`material.${material}`)}</span>
          </li>
        ))}
      </ul>

      <h3 className={styles.heading}>{t('layers')}</h3>
      {sizes.map((size) => (
        <div key={size}>
          <p className={styles.caption}>{t(size)}</p>
          <SizeFrame size={size} label={t('layers')}>
            <div className={frameClass(size)}>
              <CutLayers label={t('cutLabel')}>
                <CutLayer
                  kind="problem"
                  kindLabel={t('kindProblem')}
                  position="first"
                  size={size}
                  material="wood"
                  thickness={34}
                  name={t('laminate')}
                  note={t('laminateNote')}
                  price={usd(22578)}
                  revision={revision}
                />
                <CutLayer
                  kind="new"
                  kindLabel={t('kindNew')}
                  position="rest"
                  size={size}
                  material="glue"
                  thickness={22}
                  name={t('glue')}
                  note={t('glueNote')}
                  price={usd(3180)}
                />
                <CutLayer
                  kind="included"
                  kindLabel={t('kindIncluded')}
                  position="rest"
                  size={size}
                  material="concrete"
                  thickness={46}
                  name={t('slab')}
                  note={t('slabNote')}
                  price="0"
                />
              </CutLayers>
            </div>
          </SizeFrame>
        </div>
      ))}

      <h3 className={styles.heading}>{t('cut')}</h3>
      <div>
        <div className={styles.frame}>
          <CutLayers label={t('cutLabel')}>
            <CutLayer
              kind="problem"
              kindLabel={t('kindProblem')}
              position="first"
              material="wood"
              thickness={34}
              name={t('laminate')}
              note={t('laminateNote')}
              price={usd(22578)}
              revision={revision}
              remarkId="showcase-remark"
            />
            <CutLayer
              kind="new"
              kindLabel={t('kindNew')}
              position="rest"
              material="glue"
              thickness={22}
              name={t('glue')}
              note={t('glueNote')}
              price={usd(3180)}
            />
            <CutLayer
              kind="new"
              kindLabel={t('kindNew')}
              position="rest"
              material="cable"
              thickness={40}
              name={t('cable')}
              note={t('cableNote')}
              price={usd(38400)}
            />
            <CutLayer
              kind="included"
              kindLabel={t('kindIncluded')}
              position="rest"
              material="screed"
              thickness={62}
              name={t('screed')}
              note={t('screedNote')}
              price={t('screedPrice')}
            />
            <CutLayer
              kind="included"
              kindLabel={t('kindIncluded')}
              position="rest"
              material="concrete"
              thickness={46}
              name={t('slab')}
              note={t('slabNote')}
              price="0"
            />
          </CutLayers>
        </div>
        <p className={styles.caption}>{t('thickness')}</p>
      </div>

      <h3 className={styles.heading}>{t('revision')}</h3>
      <ul className={styles.row}>
        {sizes.map((size) => (
          <li key={size} className={styles.cell}>
            <RevisionMark number={1} size={size} label={revision.label} />
            <span className={styles.caption}>{t(size)}</span>
          </li>
        ))}
      </ul>

      <h3 className={styles.heading}>{t('remark')}</h3>
      {sizes.map((size) => (
        <div key={size}>
          <p className={styles.caption}>{t(size)}</p>
          <SizeFrame size={size} label={t('remark')}>
            <div className={`${frameClass(size)} ${styles.remark}`}>
              <Remark
                id={size === 'mobile' ? 'showcase-remark' : undefined}
                number={1}
                size={size}
                title={t('remarkTitle')}
                text={t('remarkText')}
                suggestion={t('remarkHand')}
                action={<Button kind="fill">{t('remarkAction')}</Button>}
              />
            </div>
          </SizeFrame>
        </div>
      ))}
    </div>
  );
}
