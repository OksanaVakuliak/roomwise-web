import { useTranslations } from 'next-intl';
import type { ComponentType } from 'react';
import { ShowcaseToolbar } from './ShowcaseToolbar';
import { SHOWCASE_SECTIONS, type ShowcaseSection } from './sections';
import { ActionsSection } from './sections/ActionsSection';
import { ColorsSection } from './sections/ColorsSection';
import { DataDisplaySection } from './sections/DataDisplaySection';
import { EstimateSection } from './sections/EstimateSection';
import { FormFieldsSection } from './sections/FormFieldsSection';
import { HeaderSection } from './sections/HeaderSection';
import { IconsSection } from './sections/IconsSection';
import { OverlaysSection } from './sections/OverlaysSection';
import { RoomPlanSection } from './sections/RoomPlanSection';
import { SectionCutSection } from './sections/SectionCutSection';
import { SpacingSection } from './sections/SpacingSection';
import { SpecificationSection } from './sections/SpecificationSection';
import { StepTapeSection } from './sections/StepTapeSection';
import { TypographySection } from './sections/TypographySection';
import styles from './showcase.module.css';

const SECTION_CONTENT: Partial<Record<ShowcaseSection, ComponentType>> = {
  colors: ColorsSection,
  typography: TypographySection,
  spacing: SpacingSection,
  icons: IconsSection,
  header: HeaderSection,
  stepTape: StepTapeSection,
  actions: ActionsSection,
  roomPlan: RoomPlanSection,
  sectionCut: SectionCutSection,
  specification: SpecificationSection,
  estimate: EstimateSection,
  formFields: FormFieldsSection,
  overlays: OverlaysSection,
  dataDisplay: DataDisplaySection,
};

export function Showcase() {
  const t = useTranslations('Showcase');

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <ShowcaseToolbar />
      </header>
      <nav aria-label={t('navLabel')} className={styles.nav}>
        <ul className={styles.navList}>
          {SHOWCASE_SECTIONS.map((section) => (
            <li key={section}>
              <a href={`#${section}`} className={styles.navLink}>
                {t(`sections.${section}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {SHOWCASE_SECTIONS.map((section) => {
        const Content = SECTION_CONTENT[section];

        return (
          <section
            key={section}
            id={section}
            aria-labelledby={`${section}-title`}
            className={styles.section}
          >
            <h2 id={`${section}-title`} className={styles.sectionTitle}>
              {t(`sections.${section}`)}
            </h2>
            {Content ? (
              <Content />
            ) : (
              <p className={styles.empty}>{t('empty')}</p>
            )}
          </section>
        );
      })}
    </main>
  );
}
