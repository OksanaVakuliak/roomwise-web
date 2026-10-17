import { useLocale, useTranslations } from 'next-intl';
import { RoomPlan, RoomScene, SheetTitle } from '@/components/ui';
import { area, dimension } from '@/lib/format';
import { DesktopFrame } from '../DesktopFrame';
import styles from './RoomPlanSection.module.css';

const BEDROOM = { lengthCm: 420, widthCm: 360, heightCm: 270 };
const LIVING_ROOM = { lengthCm: 540, widthCm: 420 };

const meters = (cm: number) => cm / 100;
const tenths = (value: number) => Math.round(value * 10) / 10;

export function RoomPlanSection() {
  const t = useTranslations('ShowcaseRoomPlan');
  const locale = useLocale();

  const bedroomLength = meters(BEDROOM.lengthCm);
  const bedroomWidth = meters(BEDROOM.widthCm);
  const bedroomHeight = meters(BEDROOM.heightCm);
  const livingLength = meters(LIVING_ROOM.lengthCm);
  const livingWidth = meters(LIVING_ROOM.widthCm);

  const bedroomArea = tenths(bedroomLength * bedroomWidth);
  const livingArea = tenths(livingLength * livingWidth);
  const walls = tenths(2 * (bedroomLength + bedroomWidth) * bedroomHeight);
  const perimeter = tenths(2 * (bedroomLength + bedroomWidth));

  const detailsMobile = (length: number, width: number) =>
    t('planDetailsMobile', { length, width });
  const detailsDesktop = (length: number, width: number) =>
    t('planDetailsDesktop', { length, width });

  const bedroom = t('bedroom');
  const livingRoom = t('livingRoom');

  const scene = {
    ...BEDROOM,
    lengthLabel: dimension(bedroomLength, locale),
    widthLabel: dimension(bedroomWidth, locale),
    heightLabel: dimension(bedroomHeight, locale),
    cutLabel: t('cutLabel'),
    description: t('sceneDescription', {
      name: bedroom,
      length: dimension(bedroomLength, locale),
      width: dimension(bedroomWidth, locale),
      height: dimension(bedroomHeight, locale),
    }),
  };

  return (
    <>
      <h3>{t('plansHeading')}</h3>
      <p>{t('plansMobile')}</p>
      <div className={styles.group}>
        <RoomPlan
          name={livingRoom}
          details={detailsMobile(livingLength, livingWidth)}
          {...LIVING_ROOM}
        />
        <RoomPlan
          name={bedroom}
          details={detailsMobile(bedroomLength, bedroomWidth)}
          lengthCm={BEDROOM.lengthCm}
          widthCm={BEDROOM.widthCm}
          state="current"
        />
      </div>
      <p>{t('plansDesktop')}</p>
      <DesktopFrame label={t('plansHeading')}>
        <div className={`${styles.group} ${styles.groupDesktop}`}>
          <RoomPlan
            size="desktop"
            name={t('planNameDesktop', {
              name: livingRoom,
              area: area(livingArea, locale),
            })}
            details={detailsDesktop(livingLength, livingWidth)}
            {...LIVING_ROOM}
          />
          <RoomPlan
            size="desktop"
            name={t('planNameDesktop', {
              name: bedroom,
              area: area(bedroomArea, locale),
            })}
            details={detailsDesktop(bedroomLength, bedroomWidth)}
            lengthCm={BEDROOM.lengthCm}
            widthCm={BEDROOM.widthCm}
            state="current"
          />
        </div>
      </DesktopFrame>

      <h3>{t('titleHeading')}</h3>
      <p>{t('titleMobile')}</p>
      <SheetTitle
        headingLevel={4}
        title={bedroom}
        primary={area(bedroomArea, locale)}
        secondary={t('wallsMobile', { walls: area(walls, locale) })}
      />
      <p>{t('titleDesktop')}</p>
      <DesktopFrame label={t('titleHeading')}>
        <SheetTitle
          size="desktop"
          headingLevel={4}
          title={bedroom}
          primary={area(bedroomArea, locale)}
          secondary={t('wallsDesktop', {
            walls: area(walls, locale),
            perimeter: dimension(perimeter, locale),
          })}
        />
      </DesktopFrame>

      <h3>{t('sceneHeading')}</h3>
      <p>{t('sceneMobile')}</p>
      <div className={`${styles.frame} ${styles.frameMobile}`}>
        <RoomScene {...scene} />
      </div>
      <p>{t('sceneDesktop')}</p>
      <DesktopFrame label={t('sceneHeading')}>
        <div className={`${styles.frame} ${styles.frameDesktop}`}>
          <RoomScene {...scene} size="desktop" />
        </div>
      </DesktopFrame>
    </>
  );
}
