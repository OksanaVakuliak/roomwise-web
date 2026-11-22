import { StyleStep } from '@/features/configurator';
import { type StepPageProps, stepMetadata } from '../step-metadata';
import { StepPage } from '../step-page';

export const generateMetadata = stepMetadata('style');

export default function StylePage(props: StepPageProps) {
  return (
    <>
      <StepPage step="style" {...props} />
      <StyleStep />
    </>
  );
}
